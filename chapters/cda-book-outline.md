# 上下文密度对齐 — 书稿大纲

> **目标读者**：AI Agent 开发者、架构师、技术决策者
> **核心立场**：CDA 不是功能，是视角转变——从"如何放更多信息"到"如何让 LLM 在正确方向上获得足够密度"

---

## 第一章：问题——上下文管理失败的真相 ✅

### 1.1 AI Agent 时代的上下文困境
- 市场背景：AI Agent 爆发（$7.84B → $236B，CAGR 45.8%）
- 上下文成为性能瓶颈的三个阶段
- 从 Copilot 到 Agent：为什么上下文问题在 Agent 时代更严重

### 1.2 主流解法及其根本局限
- 扩展上下文窗口（Gemini 2M / Claude 100K）：容量 ≠ 方向
- RAG + 向量检索：检索方向 ≠ LLM 注意力方向
- MemGPT 无限上下文：token 开销巨大，无 phase-aware
- LangChain/LlamaIndex Memory：通用框架，缺乏语义深度

### 1.3 Lost in the Middle：一个被忽视的结构性失败
- Stanford 2023 研究：U 形性能曲线，准确率下降 30%
- 注意力机制的内在结构性问题
- Softmax 归一化导致的权重稀释

### 1.4 临界阈值崩溃
- Wang 等人 2026：40-50% 窗口时灾难性崩溃（F1 骤降 45.5%）
- 有效上下文远小于声称值（Llama 3.1 70B：声称 128K，实际 64K）
- Context Rot：所有 18 个前沿模型均出现性能退化

**状态**：✅ 完成（~6,200 字，2026-04-13）

---

## 第二章：理论——上下文密度对齐框架

### 2.1 核心定义
- CDA 形式化表达
- 密度 vs 信息量的根本区别
- 压缩方向比压缩比例更重要

### 2.2 聚焦的错误胜过正确的散焦
- "聚焦的错误"的定义：在正确方向上的误差可接受
- "正确的散焦"：每个方向密度都不足以触发有效注意
- CDA 目标：最大化聚焦误差可接受范围，最小化散焦概率

### 2.3 三层内存架构
- LLM Context（注意力焦点）：一次性，当前 turn
- 热记忆（执行栈）：跨 turn，执行状态、工具链
- 冷记忆（SPC embedding）：持久化，向量检索

### 2.4 Phase：Agent 行为的语义切片
- 5 个核心 Phase：assemble / ingest / afterTurn / compact / bootstrap
- Phase 切换由语义状态转移驱动，不依赖时间
- 不同 Phase 需要完全不同的上下文类型

### 2.5 QTS：语义相似度的量化理论
- 四元量化模型：intent_match + phase_match + tool_relevance + causal_proximity
- 与向量 cosine 相似度的本质区别
- SPC-CTX v0.16.0 关键修复：QTS 在 compact 子集上跑

### 2.6 SCG：语义压缩保留结构
- 语义图保留拓扑结构，而非 token 序列
- 压缩保留核心节点 + 关键边
- 即使 90% token 被压缩，逻辑关系仍然保留

---

## 第三章：证据——问题的理论表现形式 ✅

### 3.1 语义梯度异常：LLM 注意力的系统性失效
- 4 天连续运行记录（2026-04-11 ~ 04-13）
- contextUsage 全程变化曲线
- 61.6% 触发 AGGRESSIVE compact 的临界事件

### 3.2 v0.16.0 关键修复的工程价值
- 修复前：compact 写 context_items，assemble 不读（1287条全量）
- 修复后：assemble 只读 context_items（90条精选）
- Token 稳定在 ~28-40% 的真实效果

### 3.3 Passthrough 模式：Bootstrap 的设计行为
- 为什么 passthrough 不是 bug，而是设计选择
- 从 passthrough 到 full assembler 的状态转移
- 冷启动时防止"失忆"的机制

### 3.4 市场共鸣
- "Context is the new data" 正在成为行业共识
- Claude Context Editing：29% 提升（100轮搜索评估）
- Mem0：26% 提升，延迟降低 91%，成本节省 90%+
- CDA 在高价值 Agent 应用中的共鸣最强

### 3.5 反例与边界
- Context Rot：逻辑连贯文档比随机打乱文档性能更差
- Factory.ai 压缩评测：通用摘要丢失"我们当前在哪里"
- CDA 的适用边界：什么时候 CDA 价值有限

---

## 第四章：实现——SPC-CTX 工程路径

### 4.1 整体架构
- 架构流程图（Phase 判断 → 方向计算 → 组装 → 压缩 → 评估 → 热经验）
- 各模块的输入输出接口

### 4.2 核心算法
- Delta Direction：方向转移检测
- Hysteresis Threshold：滞后门防止震荡
- Causal Chain Protection：因果链保护防止关键推理链截断

### 4.3 Compact 触发机制
- 阈值参数：YELLOW=70%，ORANGE=70%，RED=85%
- 冷却时间（Cooldown）机制
- AGGRESSIVE compact 触发条件

### 4.4 Token 估算的两层差异
- SPC-CTX 层 vs Gateway 层
- 4.8% 差距的原因：计数范围不同
- 不是 bug，是测量维度不同

### 4.5 SPC Tokens 数据库
- SQLite + vectorlite 轻量组合
- 本地化部署，不依赖云服务
- messages 表结构和 context_items 表结构

---

## 第五章：Self-Evolving——CDA 的双向闭环

### 5.1 为什么需要 Self-Evolving
- 冷记忆（历史经验）无法被"激活"的困境
- 从被动过滤到主动学习的范式转变
- 双向链接：历史经验 ↔ 当前任务

### 5.2 热经验发现（Hot Experience Discovery）
- 发现条件：hitCount ≥ 3，stdDev < 0.15
- ExperienceValue = Alignment × Heat
- 快速通道机制

### 5.3 冷经验蒸馏（Cold → Skill）
- 四要素提取：前置条件 / 执行模式 / 边界条件 / 效果标签
- Skill 形式化存储
- 与 SPC-CTX Phase 的联动

### 5.4 Skill 动态预热 → Workflow Execution
- Skill 检索（最匹配的 Skill）
- 动态预热流程：前置条件匹配 → 执行流程展开 → 情景归因
- Workflow 执行 → Outcome → 回流到 Experience Collector

### 5.5 双线并行实现策略
- 线 B（Skill 蒸馏）：独立运行，不阻塞 A
- 线 A（Skill 预热）：依赖 B 的输出
- B 先于 A，但两者可并行设计接口规范

---

## 第六章：竞争格局与护城河

### 6.1 竞品全景图
- LangChain Memory（133K ⭐）：通用但无 phase-aware
- LlamaIndex Memory（48.5K ⭐）：RAG 强但无实时性
- MemGPT：无限上下文但 token 开销高
- Zep：Temporal Graph 但无三层概念
- Mem0：商业 SaaS，不开源
- Claude Context Editing：最强商业实现

### 6.2 SPC-CTX 的四个护城河
- Phase-aware retrieval：工程壁垒
- SCG 语义压缩：技术壁垒
- 本地化 SQLite + ACP 原生集成：生态壁垒
- Self-Evolving 双向闭环：架构壁垒

### 6.3 市场定位
- "Context Density Alignment = SPC-CTX" 话语权战略
- 目标受众：AI Agent 开发者、技术决策者
- 高价值场景：代码生成 / 医疗诊断 / 金融分析

---

## 第七章：技术债与未来

### 7.1 当前技术债
- 🔴 SPC query 命中率 0/82（P0）
- 🟡 embedding API 依赖（P1）
- 🟡 compact 算法无 benchmark（P1）
- 🟡 文档缺失（P1）

### 7.2 三个优先行动
- 🔴 P0：修复 SPC query 命中率
- 🟡 P1：建立 compact 质量评估体系（RAGas 风格）
- 🟢 P2：抢占 CDA 话语权

### 7.3 LLM 提供商垂直整合的威胁
- OpenAI / Anthropic native memory API 的威胁
- SPC-CTX 的护城河：开源可控 + 自托管 + 本地 SQLite

---

## 第八章：未解问题与研究方向

### 8.1 开放问题
- LLM 注意力方向的部分可观测性：如何更准确逼近？
- Phase 切换的语义触发条件：是否有更优的状态机？
- SCG 图结构的压缩边界：保留多少边是"够"的？

### 8.2 未来方向
- 多模态上下文密度对齐
- 多 Agent 协作场景下的 CDA
- CDA 与模型能力共同演进

---

## 附录

### A. SPC-CTX 配置参数参考
### B. 核心公式速查
### C. 术语表

---

**总章节数**：8 章 + 附录
**预计总字数**：25,000-30,000 字
**完成度**：~70%（第一章 ✅ + 第三章 ~40%）

---

*最后更新：2026-04-13 | Wilson/Blitz*
