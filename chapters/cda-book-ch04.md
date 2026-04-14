# 第四章：实现——SPC-CTX 工程路径

> 本章聚焦 SPC-CTX 的工程实现细节。关于 Phase 驱动的理论论证，见第二章 2.9；关于真实运行数据，见第三章 3.4。

---

## 4.1 整体架构

```
用户输入（user message）
    ↓
[Phase 判断]
    ├─ bootstrap → Passthrough Mode（messageStore 为空）
    └─ normal → inferPhase(rawIntent, recentTools, contextUsage)
    ↓
[方向计算]
    └─ deltaDirection(prev_intent, curr_intent)
        ├─ delta < 0.05 → incremental（仅新增消息）
        └─ delta ≥ 0.05 → full recompute（D 重新计算）
    ↓
[组装阶段]
    ├─ basicAssemble（无 snapshot）
    └─ fullAssemble（有 snapshot）
        → QTS scoring（compact 子集，90条）
        → keep / compress / dropout
    ↓
[压缩阶段]
    └─ SCG Semantic Compression
        → [Compressed] 标记
        → 写入 context_items 表
    ↓
[对齐评估]
    └─ computeAlignment(direction, scores)
        → 若 alignment < THRESHOLD → 触发 hot experience 发现
    ↓
[热经验发现]
    └─ discoverHotExperiences(hitCount ≥ 3, stdDev < 0.15)
    ↓
LLM Context（最终输入）
```

**关键数据流**：

```
messageStore（SQLite messages 表）
    ↓ ingest phase
SPC tokens DB（SQLite + vectorlite）
    ↓ assemble phase（读 compact 子集）
context_items（SQLite context_items 表）
    ↓ assemble phase（QTS scoring）
精选片段 → 注入 LLM context
```

---

## 4.2 核心算法

### 4.2.1 方向转移检测（Delta Direction）

```typescript
function deltaDirection(prevIntent: Embedding, currIntent: Embedding, prevPhase: Phase, currPhase: Phase, prevTools: Tool[], currTools: Tool[]): number {
  const cosine_sim = computeCosine(prevIntent, currIntent);

  const phase_change_penalty = (prevPhase !== currPhase) ? 0.3 : 0;
  const tool_change_penalty = (prevTools !== currTools) ? 0.2 : 0;

  const delta = cosine_sim + phase_change_penalty + tool_change_penalty;

  return delta;
}

// 判断逻辑
if (delta < 0.05) {
  // incremental：仅新增消息，不需要重新组装
  mode = "incremental";
} else {
  // full recompute：方向跳转，需要重新组装
  mode = "full";
}
```

**参数说明**：

| 参数 | 值 | 来源依据 |
|------|-----|---------|
| `cosine_sim` 权重 | 1.0 | 语义相似度是主信号 |
| `phase_change_penalty` | 0.3 | Phase 跳转是强信号，高于文本相似度 |
| `tool_change_penalty` | 0.2 | Tool 切换是中等信号 |
| `threshold = 0.05` | — | 低于 5% 的方向变化视为无变化 |

**设计原理**：为什么 phase_change_penalty 是 0.3 而不是更大？

```
Phase 跳转的含义：
- assemble → compact：上下文从构建转为压缩（方向完全不同）
- afterTurn → ingest：新消息处理 vs 质量评估（子任务切换）
- compact → bootstrap：压缩完成 vs 冷启动（完全不同的语义空间）

0.3 的意思是：当 phase 跳转时，即使 cosine_sim = 1.0（文本完全相同），
delta 仍然达到 1.3，足以触发 full recompute。
```

### 4.2.2 滞后门（Hysteresis Threshold）

```typescript
function hysteresisScore(fragment: ContextFragment, newScore: number): number {
  const prevZone = classifyZone(fragment.score); // keep / compress / dropout
  const newZone = classifyZone(newScore);

  if (prevZone === newZone) {
    return newScore; // 无变化，保持原状态
  }

  // 跨 zone 切换时，施加滞后门
  if (prevZone === "keep" && newZone === "compress") {
    return newScore * 0.85; // 需要比 compress 阈值低 15% 才真正切换
  }
  if (prevZone === "compress" && newZone === "keep") {
    return newScore * 1.15; // 需要比 keep 阈值高 15% 才真正切换
  }
  if (prevZone === "compress" && newZone === "dropout") {
    return newScore * 0.9; // 向下切只需 10% 滞后
  }

  return newScore;
}

// Zone 分类
function classifyZone(score: number): "keep" | "compress" | "dropout" {
  if (score >= 0.75) return "keep";
  if (score >= 0.25) return "compress";
  return "dropout";
}
```

**滞后门的设计原理**：

```
场景：无滞后门

Turn 1: score = 0.76 → keep
Turn 2: score = 0.74 → compress（跨 zone，震荡！）
Turn 3: score = 0.76 → keep（跨 zone，震荡！）
Turn 4: score = 0.74 → compress（震荡！）
...

场景：有滞后门（±15%）

Turn 1: score = 0.76 → keep
Turn 2: score = 0.74 → keep（74 < 0.75 × 1.15 = 0.8625？不触发切换）
Turn 3: score = 0.88 → keep
Turn 4: score = 0.74 → keep（即使短暂下降，也不切换）
Turn 5: score = 0.70 → compress（70 < 0.75 × 0.85 = 0.6375？触发）
→ 稳定在 compress
```

### 4.2.3 因果链保护（Causal Chain Protection）

```typescript
function causalChainCheck(fragment: ContextFragment, dropoutCount: number): boolean {
  // 连续 3 次被标记 dropout，第 4 次强制 compress
  if (dropoutCount >= 3) {
    fragment.targetZone = "compress";
    return false; // 不允许 dropout
  }

  // 强制 compress 后，重置计数器
  if (fragment.targetZone === "compress" && fragment.previousZone === "dropout") {
    fragment.dropoutCount = 0;
  }

  return true; // 允许当前判断
}
```

**设计原理**：防止关键推理链被意外截断。

```
因果链示例：
[问题定义] → [假设1] → [假设2] → [验证方法] → [实验结果] → [结论]
    ↓             ↓            ↓            ↓              ↓
  fragment1    fragment2   fragment3    fragment4      fragment5

如果 fragment3（假设2）连续 3 次被 QTS 评为低分：
- 无因果链保护：fragment3 被 dropout，推理链断裂
- 有因果链保护：fragment3 强制 compress（保留结构，不丢弃）

因果链保护不阻止 compress，但阻止 dropout。
```

---

## 4.3 Compact 触发机制

### 4.3.1 阈值参数

```typescript
const COMPACT_THRESHOLD_YELLOW = 0.70; // 70%
const COMPACT_THRESHOLD_ORANGE = 0.70; // 70%（同 YELLOW）
const COMPACT_THRESHOLD_RED    = 0.85; // 85%
const COMPACT_COOLDOWN_MS      = 5 * 60 * 1000; // 5 分钟冷却
```

### 4.3.2 触发条件

```typescript
interface CompactTrigger {
  type: "YELLOW" | "ORANGE" | "RED" | "AGGRESSIVE";
  reason: string;
  contextUsage: number;
  directionStability: number; // |D| 的值
}

function shouldTriggerCompact(context: ContextState): CompactTrigger | null {
  const { contextUsage, directionStability, cooldownElapsed } = context;

  // Cooldown 检查
  if (!cooldownElapsed) {
    return null;
  }

  // RED 阈值（最高优先级）
  if (contextUsage >= COMPACT_THRESHOLD_RED) {
    return {
      type: "RED",
      reason: `contextUsage ${(contextUsage * 100).toFixed(1)}% >= ${(COMPACT_THRESHOLD_RED * 100).toFixed(0)}%`,
      contextUsage,
      directionStability
    };
  }

  // YELLOW/ORANGE 阈值
  if (contextUsage >= COMPACT_THRESHOLD_YELLOW) {
    return {
      type: contextUsage >= COMPACT_THRESHOLD_ORANGE ? "ORANGE" : "YELLOW",
      reason: `contextUsage ${(contextUsage * 100).toFixed(1)}% >= ${(COMPACT_THRESHOLD_YELLOW * 100).toFixed(0)}%`,
      contextUsage,
      directionStability
    };
  }

  // AGGRESSIVE：contextUsage 低于阈值，但 D 方向变化率异常
  const directionChangeRate = computeDirectionChangeRate(context.recentDirections);
  if (directionChangeRate > DIRECTION_CHANGE_THRESHOLD) {
    return {
      type: "AGGRESSIVE",
      reason: `方向变化率 ${directionChangeRate.toFixed(3)} > 阈值`,
      contextUsage,
      directionStability
    };
  }

  return null;
}
```

### 4.3.3 AGGRESSIVE 触发条件详解

```typescript
// AGGRESSIVE 触发的额外条件
const DIRECTION_CHANGE_THRESHOLD = 0.30; // D 方向在最近 3 个 turn 内跳转超过 30°

function computeDirectionChangeRate(recentDirections: DirectionVector[]): number {
  if (recentDirections.length < 2) return 0;

  let totalAngleChange = 0;
  for (let i = 1; i < recentDirections.length; i++) {
    const angle = computeAngle(recentDirections[i-1], recentDirections[i]);
    totalAngleChange += angle;
  }

  return totalAngleChange / recentDirections.length;
}
```

**真实触发案例（2026-04-11，session da800e88）**：

```
contextUsage = 61.6% < 70%（低于 YELLOW 阈值）
但触发了 AGGRESSIVE compact

原因：
  recentDirections = [compact_dir, query_dir, evolv_dir, compact_dir]
  angle changes:
    compact → query: ~45°
    query → evolv: ~30°
    evolv → compact: ~60°
  totalAngleChange = 135°
  averageRate = 135° / 3 = 45° > 30° → AGGRESSIVE 触发
```

---

## 4.4 Passthrough 模式：Bootstrap 的特殊状态

### 4.4.1 状态机

```
SPC-CTX 启动
    ↓
messageStore 为空？
    ├─ 是 → Passthrough Mode
    │       D(t) = D_cold_start（初始状态，无历史积累）
    │       所有消息直接灌入 LLM context
    │       无 QTS scoring，无 SCG 压缩
    │       Passthrough 是设计行为，不是 bug
    │
    └─ 否 → Full Assembler
            D(t) = f(D(t-1), new_message, phase)
            QTS scoring on context_items
            SCG 压缩
            context_items 写入 SQLite
```

### 4.4.2 Passthrough 的语义意义

```
Passthrough 阶段的 D 是「冷启动方向」：
- 没有历史语义积累
- QTS 无法计算（因为没有 phase 历史数据）
- 等效于每个 turn 都是「新的开始」

Full Assembler 阶段的 D：
- 继承了历史方向
- QTS 基于 phase 计算
- SCG 压缩基于 D 的方向
```

### 4.4.3 Passthrough 结束的触发条件

```typescript
function shouldExitPassthrough(context: ContextState): boolean {
  const { messageCount, contextUsage } = context;

  return (
    messageCount >= MIN_MESSAGES_FOR_ASSEMBLER &&
    contextUsage >= MIN_CONTEXT_USAGE_FOR_ASSEMBLER
  );
}

// 阈值
const MIN_MESSAGES_FOR_ASSEMBLER = 20;
const MIN_CONTEXT_USAGE_FOR_ASSEMBLER = 0.30; // 30%
```

**设计原理**：为什么需要两个条件？

```
仅 messageCount 条件：
  → 即使只有 20 条短消息（contextUsage < 10%），也会退出 Passthrough
  → QTS 在极低 contextUsage 下没有意义

仅 contextUsage 条件：
  → 即使 contextUsage 达到 30%，但 messageCount 很少（< 5）
  → 样本量不足，QTS 评分不稳定

两个条件同时满足：
  → 20 条消息保证 QTS 有足够的统计样本
  → 30% contextUsage 保证压缩有意义
  → 两者同时满足才退出 Passthrough
```

---

## 4.5 Token 估算的两层差异

SPC-CTX 层和 Gateway 层使用不同的 token 估算模型，产生约 4.8% 的差异。

### 4.5.1 数据对比

```
SPC-CTX 层（04-13 16:09）：
  141,682 / 204,800 → 69.2%

Gateway 层（同一时刻）：
  148,000 / 205,000 → 72%
```

### 4.5.2 计数范围差异

| 计数项 | SPC-CTX | Gateway |
|--------|---------|---------|
| 用户消息 | ✅ | ✅ |
| 助手响应 | ✅ | ✅ |
| 工具调用结果 | ✅ | ✅ |
| 系统 prompt | ❌ | ✅ |
| 工具定义（schema） | ❌ | ✅ |
| workspace 文件注入 | ❌ | ✅ |
| 会话元数据 | ❌ | ✅ |

### 4.5.3 不是 bug，是测量维度不同

```
SPC-CTX 衡量的是：消息内容的「语义密度」
→ 关注的是「上下文片段的对齐度有多高」

Gateway 衡量的是：LLM context 的「实际 token 占用」
→ 关注的是「LLM 实际能看到多少 token」

两者趋势一致，但用途不同：
- SPC-CTX：用 semantic density 来决定是否压缩
- Gateway：用 token count 来决定是否触发 LLM 层面的压缩
```

### 4.5.4 SPC-CTX 的 token 估算器

```typescript
// SPC-CTX 的 token 估算（基于消息内容）
function estimateTokensSPC(messages: Message[]): number {
  let total = 0;
  for (const msg of messages) {
    // 中文：1 token ≈ 1.5 字符（粗略估算）
    // 英文：1 token ≈ 4 字符（粗略估算）
    const text = extractTextContent(msg);
    const charCount = text.length;
    const tokenEstimate = isChinese(text)
      ? charCount / 1.5
      : charCount / 4;
    total += tokenEstimate;
  }
  return total;
}
```

---

## 4.6 SPC Tokens 数据库

### 4.6.1 SQLite 表结构

```sql
-- messages 表：原始消息存储
CREATE TABLE messages (
  id          TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,
  role        TEXT NOT NULL,        -- 'user' | 'assistant' | 'system'
  content     TEXT NOT NULL,
  tokens      INTEGER NOT NULL,
  created_at  TEXT NOT NULL,        -- ISO timestamp
  phase       TEXT,                 -- 最后处理该消息的 phase
  qts_score   REAL,                -- QTS 评分（compact 后）
  zone        TEXT                  -- keep | compress | dropout
);

CREATE INDEX idx_messages_session ON messages(session_key);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_qts ON messages(qts_score);

-- context_items 表：compact 后的精选片段
CREATE TABLE context_items (
  id          TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,
  content     TEXT NOT NULL,
  tokens      INTEGER NOT NULL,
  qts_score   REAL NOT NULL,
  phase       TEXT NOT NULL,        -- 产生该 context_item 的 phase
  created_at  TEXT NOT NULL,
  expires_at  TEXT                  -- 可选 TTL
);

CREATE INDEX idx_context_session ON context_items(session_key);
CREATE INDEX idx_context_created ON context_items(created_at);
```

### 4.6.2 vectorlite 扩展

```sql
-- 使用 vectorlite 扩展进行语义检索
CREATE VIRTUAL TABLE spc_vectors USING vectorlite();

-- 插入 embedding
INSERT INTO spc_vectors (id, embedding, metadata)
VALUES (
  'msg_xxx',
  '[0.123, -0.456, ...]',  -- 1024 维 embedding
  json_object('session', 'agent:main:main', 'phase', 'assemble')
);

-- 语义检索（余弦相似度）
SELECT id, metadata,
       cosine_similarity(embedding, '[query_embedding]') as sim
FROM spc_vectors
WHERE sim > 0.75
ORDER BY sim DESC
LIMIT 10;
```

### 4.6.3 数据的写入和读取流程

```
写入流程（ingest phase）：
  user message → splitContent() → [p1, p2, ...]
    → encode() → embedding
    → INSERT INTO messages
    → INSERT INTO spc_vectors (embedding)
    → 返回 message_id

读取流程（assemble phase）：
  current D(t) → query embedding
    → SELECT FROM spc_vectors WHERE similarity > threshold
    → 获取 top-k message_ids
    → SELECT FROM context_items WHERE message_id IN (...)
    → QTS scoring
    → keep / compress / dropout
    → 精选片段注入 LLM context
```

---

## 本章小结

第四章聚焦 SPC-CTX 的工程实现，提供了：

| 模块 | 核心内容 |
|------|---------|
| **整体架构** | Phase 判断 → 方向计算 → 组装 → 压缩 → 评估 → 热经验 |
| **Delta Direction** | cosine_sim + phase_change_penalty + tool_change_penalty |
| **滞后门** | ±15% 阈值，防止 keep/compress 震荡 |
| **因果链保护** | 连续 3 次 dropout → 第 4 次强制 compress |
| **Compact 触发** | YELLOW=70% / ORANGE=70% / RED=85% / AGGRESSIVE=方向变化率>30° |
| **Passthrough** | Bootstrap 特殊状态，设计行为非 bug |
| **Token 两层差异** | SPC-CTX 缺系统 prompt 等，差距 ~4.8% |
| **SPC Tokens DB** | SQLite (messages + context_items) + vectorlite (embedding) |

---

*本章字数：~3,800 字 | 2026-04-13*
