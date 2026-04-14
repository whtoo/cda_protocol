<div align="center">

# Direction-Preserving Context Engine
## 基于 CDA Protocol 的上下文引擎

> **让 Agent 在只保留 10% 历史信息的前提下，方向依然不跑偏。**
> 
> *For Agents who refuse to walk in circles.*

*[English](#english) | [中文](#中文)*

</div>

---

<a id="中文"></a>
## 中文

### 痛点：长对话里的“失忆”与“鬼打墙”

当对话超过 500 轮，Agent 开始出现三种典型崩溃：

1. **忘记早期约束** —— 最初定好的目标、格式或禁忌被抛到脑后；
2. **重复走死路** —— 在代码修复、工具调用、多步推理中，反复尝试同一个已被证伪的策略；
3. **主题飘走** —— 讨论逐渐偏离全局任务，陷入无关细节。

这不是上下文窗口不够大，而是**方向管理**出了问题。

### 承诺：CDA 的三个可验证赢面

| 赢面 | 普通 Agent | 启用 CDA |
|------|-----------|---------|
| **超长对话方向稳定** | 1500 轮后主题偏离度 > 0.4 | **偏离度 < 0.25** |
| **死路不再走第二次** | 工具密集型任务死路重复率 20–40% | **< 10%，目标 < 5%** |
| **10% 历史撑起 80% 一致性** | 压缩后有效上下文密度低 | **有效密度提升 2–3×** |

> **核心差异**：CDA 不是帮你「记住更多」，而是帮你「记住哪些路已经证明是错的」，并在每次组装上下文时过滤掉已知错误方向。

### 核心机制

- **方向追踪（Direction Tracking）**：记录当前语义方向 D 与全局意图的偏差，而非原始 token；
- **死路注册表（Dead-End Registry）**：将被证伪的推理链 / 工具调用组合登记为负向经验，assemble 阶段自动降权；
- **语义压缩图（SCG）**：以拓扑结构保留推理骨干，即使压缩 90%，逻辑链条依然完整。

### 5 行接入示例

```python
from cda import SPCContext

ctx = SPCContext()
for turn in conversation:
    ctx.append_turn(turn)
    assembled = ctx.assemble_context(query=turn.user_input, max_tokens=8_000)
    response = llm(assembled)
```

### 最小接口

```ts
// 写入一轮对话与工具轨迹
appendTurn({ messages, tools, phase })

// 组装本轮需要喂给模型的最小上下文
assembleContext({ query: CurrentIntent, max_tokens: number }) => AssembledContext

// 触发压缩（可由外部按需调用）
compact({ strategy?: 'auto' | 'aggressive' })

// 查询语义方向状态（调试、监控）
getDirectionState() => {
  global_intent: IntentVector,
  drift_score: number,
  dead_end_matches: DeadEndMatch[]
}

// 显式注册一条死路（负向经验）
registerDeadEnd({ session_id, trace, reason })
```

### 内容结构

```
cda_protocol/
├── README.md              # 本页：快速入门与产品定位
├── METRICS.md             # 指标体系与可复现 benchmark 说明
├── cda-book-zh.md         # 中文完整书稿（理论深度）
├── cda-book-en.md         # English complete manuscript
├── skill/                 # 可插拔 skill 实现
│   ├── skill.json
│   └── hooks/
├── images/                # 双语配图
└── chapters/              # 分章节版本
```

### 许可

本作品采用 [CC BY-ND 4.0](LICENSE)（署名-禁止演绎 4.0 国际）许可协议。

---

<a id="english"></a>
## English

### The Problem: Amnesia and Déjà Vu in Long Conversations

Beyond 500 turns, Agents exhibit three classic failure modes:

1. **Forgotten constraints** — early goals, formats, or prohibitions slip away;
2. **Dead-end loops** — in code repair, tool use, or multi-step reasoning, the same disproven strategy is tried again and again;
3. **Topic drift** — the conversation slowly slides into irrelevant details, losing sight of the global objective.

This is not a context-window size problem. It is a **direction-management** problem.

### The Promise: Three Verified Wins with CDA

| Win | Baseline Agent | CDA Enabled |
|-----|---------------|-------------|
| **Ultra-long alignment stability** | Topic drift > 0.4 after 1,500 turns | **Drift < 0.25** |
| **Dead ends are not repeated** | Repetition rate 20–40% in tool-heavy tasks | **< 10%, target < 5%** |
| **10% history → 80% consistency** | Low effective context density after compression | **Effective density 2–3× higher** |

> **Key difference**: CDA does not help you "remember more." It helps you **remember which directions are already proven wrong**, and filters them out at every `assemble` stage.

### Core Mechanisms

- **Direction Tracking**: Tracks the current semantic direction D and its deviation from global intent, rather than raw tokens.
- **Dead-End Registry**: Records disproven reasoning chains / tool-call patterns as negative experience, automatically down-weighting them during `assemble`.
- **Semantic Compression Graph (SCG)**: Preserves the topological shape of reasoning; even after 90% compression, the logical skeleton survives.

### 5-Line Integration Example

```python
from cda import SPCContext

ctx = SPCContext()
for turn in conversation:
    ctx.append_turn(turn)
    assembled = ctx.assemble_context(query=turn.user_input, max_tokens=8_000)
    response = llm(assembled)
```

### Minimal API

```ts
// Append one turn plus tool trace
appendTurn({ messages, tools, phase })

// Assemble the minimal context needed for this turn
assembleContext({ query: CurrentIntent, max_tokens: number }) => AssembledContext

// Trigger compression on demand
compact({ strategy?: 'auto' | 'aggressive' })

// Inspect semantic direction state (for debugging / monitoring)
getDirectionState() => {
  global_intent: IntentVector,
  drift_score: number,
  dead_end_matches: DeadEndMatch[]
}

// Explicitly register a dead-end (negative experience)
registerDeadEnd({ session_id, trace, reason })
```

### Repository Structure

```
cda_protocol/
├── README.md              # This page: quick start & product positioning
├── METRICS.md             # Metrics & reproducible benchmark guide
├── cda-book-zh.md         # Chinese manuscript (deep theory)
├── cda-book-en.md         # English manuscript
├── skill/                 # Pluggable skill implementation
│   ├── skill.json
│   └── hooks/
├── images/                # Bilingual figures
└── chapters/              # Chapter-by-chapter versions
```

### License

This work is licensed under [CC BY-ND 4.0](LICENSE) (Attribution-NoDerivatives 4.0 International).
