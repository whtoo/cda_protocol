# CDA Metrics & Benchmark Guide

> 本文件定义 CDA / SPC-CTX 对外可验证的三类核心指标，以及最小可复现实验（MRE）的设置方法。

---

## 一、三类核心指标

### 1. 方向稳定性（Alignment Stability）

**定义**：当前轮次的语义方向 D 与初始全局意图 G 的语义相似度随轮数衰减的曲线。

- **X 轴**：对话轮数（0, 200, 500, 1000, 1500, …）
- **Y 轴**：`sim(D_t, G)`，取值 0–1
- **目标表述**：
  > “在 1500+ 轮后，未使用 CDA 的 Agent 主题偏离度 > 0.4，使用 CDA 的偏离度 < 0.25。”

**计算方式（简化版）**：

1. 用嵌入模型分别编码全局意图 G 和第 t 轮后的「当前方向摘要」D_t；
2. 计算余弦相似度 `cos_sim(G, D_t)`；
3. 偏离度 `drift_t = 1 - cos_sim(G, D_t)`。

**Baseline 要求**：
- 至少对比一种朴素方案：
  - 按时间截断（naive truncation）或
  - 朴素总结压缩（naive summarization）。

---

### 2. 死路重复率（Dead-End Repetition Rate）

**定义**：在需要多步尝试的任务中，已被证伪的推理/工具模式在后续轮次中被重新尝试的比例。

**实验设计（最小任务）**：
- 任务类型：代码修复、数据清洗、或需要多次 API 调用的协调任务；
- 给 Agent 一个隐藏约束（例如某个 API 不可用、某段代码有特定 bug）；
- 允许 Agent 自主尝试并收到失败反馈。

**死路判定**：
- 若某条推理链或工具调用组合在 N 步后被模型自报失败，或被外部判定器标记为失败，则记为死路 DE_i。

**重复判定**：
- 在后续轮次中，若 Agent 提出的新方案与某条已记录死路的语义相似度 > θ（例如 0.82），则记为一次重复。

**公式**：

```
Dead-End Repetition Rate = (重复次数) / (后续尝试总次数)
```

**目标数字**：
- 普通 Agent / 朴素上下文压缩：**20–40%**
- 启用 CDA / SPC-CTX 后：**< 10%，目标 < 5%**

---

### 3. 有效上下文密度（Effective Context Density, ECD）

**定义**：在同等 token 预算下，真正对后续推理起到关键作用的历史信息比例。

**简化计算方式**：

1. 对每一轮回答，用 LLM 或规则判定哪些历史片段被「直接引用」或「起关键作用」；
2. 统计这些片段的 token 数之和 `T_effective`；
3. 除以该轮实际喂给模型的总 token 数 `T_total`：

```
ECD = T_effective / T_total
```

**对比口径**：
- 对比 naive truncation 或 naive summarization；
- 目标表述：
  > “在同等 token 预算下，CDA 的有效上下文密度是朴素截断/总结方案的 2–3 倍。”

---

## 二、最小可复现实验（MRE）设置

### 任务模板：Multi-Step API Orchestration

一个适合快速验证的死路重复任务：

> "请帮我预订一张明天从北京到上海的机票，要求上午起飞、价格最低。你可以调用 search_flights、book_ticket、query_weather 三个工具。"

隐藏约束：
- `book_ticket` 在调用前必须先 `query_weather`（否则返回失败）；
- 某航班（CA1501）虽然最便宜，但已售罄（调用 `book_ticket` 会失败）。

预期死路：
1. 先 `book_ticket` 后 `query_weather` → 失败；
2. 反复尝试 `CA1501` → 失败。

在 20 轮内观察 Agent 是否会重复尝试这两条路。

### 记录格式

每次运行记录：

```yaml
experiment:
  task: multi_step_api_orchestration
  agent: cda-v1.1.0
  max_turns: 20
  compression_ratio: 0.10

results:
  alignment_stability:
    drift_at_turn_20: 0.12
  dead_end_repetition:
    total_attempts_after_first_failure: 8
    repetitions: 1
    rate: 0.125
  effective_context_density:
    ecd: 0.45
    baseline_naive_truncation: 0.18
    improvement: 2.5x
```

---

## 三、对外讲故事的固定话术

无论 README、博客还是演讲，优先讲这三句话：

1. **超长对话方向稳定**：1500+ 轮后主题偏移小于 baseline 的一半。
2. **死路不再走第二次**：工具密集型任务中，死路重复率从 30% 降到 5%。
3. **10% 历史撑起 80% 一致性**：压缩后依然可用于严肃任务，不是聊着玩。

技术细节放在后面，给愿意深入的人看。
