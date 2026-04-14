<div align="center">

# CDA Protocol

**Context Direction Alignment — A Paradigm for Context Management in Ultra-Long Continuous Tasks**
<br>**上下文方向对齐 — 超长连续任务上下文管理范式**

*[English](#english) | [中文](#中文)*

> **For Agents who refuse to walk in circles.**
> 
> *不是「记忆有多大」，而是「死路不再走第二次」。*

</div>

---

<a id="中文"></a>
## 中文

> 一个核心命题：好的上下文管理，不是在问「上下文够不够大」，而是在问「LLM 在推进当前论点的方向上，有没有在重复论证同一个已知的错误」。

### 内容结构

```
cda_protocol/
├── cda-book-zh.md       # 中文完整书稿
├── cda-book-en.md       # English complete manuscript
├── images/              # 14 张双语配图 (PNG + SVG)
└── chapters/            # 分章节版本
    ├── cda-book-ch01.md
    ├── cda-book-ch02.md
    ├── cda-book-ch03.md
    ├── cda-book-ch04.md
    └── cda-book-outline.md
```

### 核心概念

- **CDA (Context Direction Alignment)**: 一种上下文管理范式，聚焦于 LLM 在任务方向上的推理效率，而非简单地扩大上下文容量
- **Phase (相位)**: 任务的生命周期阶段识别（bootstrap / assemble / ingest / afterTurn / compact）
- **QTS (Query-Type Switching)**: 根据查询类型动态切换上下文策略
- **SCG (Semantic Compression Graph)**: 语义压缩图，实现三层内存架构

### 关于本书

本书系统阐述了 CDA 范式的理论基础、设计原则和工程实践，适用于构建超长连续任务的 AI Agent 系统。

### 许可

本作品采用 [CC BY-ND 4.0](LICENSE)（署名-禁止演绎 4.0 国际）许可协议。您可以自由阅读、复制与分发（包括商业用途），但未经许可不得进行改编、翻译或创作衍生作品。如需获取演绎授权，请联系作者。

---

<a id="english"></a>
## English

> A core thesis: Good context management is not asking "Is the context large enough?" but rather "Is the LLM repeating the same known error while advancing the current thesis?"

### Repository Structure

```
cda_protocol/
├── cda-book-zh.md       # Chinese complete manuscript
├── cda-book-en.md       # English complete manuscript
├── images/              # 14 bilingual figures (PNG + SVG)
└── chapters/            # Chapter-by-chapter versions
    ├── cda-book-ch01.md
    ├── cda-book-ch02.md
    ├── cda-book-ch03.md
    ├── cda-book-ch04.md
    └── cda-book-outline.md
```

### Core Concepts

- **CDA (Context Direction Alignment)**: A context-management paradigm that focuses on the LLM's directional reasoning efficiency rather than simply expanding context capacity.
- **Phase**: Lifecycle stage identification for tasks (bootstrap / assemble / ingest / afterTurn / compact).
- **QTS (Query-Type Switching)**: Dynamically switch context strategies based on query type.
- **SCG (Semantic Compression Graph)**: A semantic-compression graph that implements a three-tier memory architecture.

### About This Book

This book systematically presents the theoretical foundations, design principles, and engineering practices of the CDA paradigm, aimed at building AI Agent systems for ultra-long continuous tasks.

### License

This work is licensed under [CC BY-ND 4.0](LICENSE) (Attribution-NoDerivatives 4.0 International). You are free to read, copy, and redistribute it (including for commercial purposes), but you may not adapt, translate, or create derivative works without explicit permission. Contact the author if you need a derivative-use license.
