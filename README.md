# CDA Protocol

**Context Direction Alignment — 超长连续任务上下文管理范式**

> 一个核心命题：好的上下文管理，不是在问「上下文够不够大」，而是在问「LLM 在推进当前论点的方向上，有没有在重复论证同一个已知的错误」。

## 内容结构

```
cda_protocol/
├── cda-book-zh.md       # 中文完整书稿
├── cda-book-en.md       # English complete manuscript
├── images/              # 14张双语配图 (PNG + SVG)
└── chapters/           # 分章节版本
    ├── cda-book-ch01.md
    ├── cda-book-ch02.md
    ├── cda-book-ch03.md
    ├── cda-book-ch04.md
    └── cda-book-outline.md
```

## 核心概念

- **CDA (Context Direction Alignment)**: 一种上下文管理范式，聚焦于 LLM 在任务方向上的推理效率，而非简单地扩大上下文容量
- **Phase (相位)**: 任务的生命周期阶段识别（bootstrap / assemble / ingest / afterTurn / compact）
- **QTS (Query-Type Switching)**: 根据查询类型动态切换上下文策略
- **SCG (Semantic Compression Graph)**: 语义压缩图，实现三层内存架构

## 关于本书

本书系统阐述了 CDA 范式的理论基础、设计原则和工程实践，适用于构建超长连续任务的 AI Agent 系统。

## 许可

See [LICENSE](LICENSE) 文件。商业使用免费；但对本书的任何修改、翻译、分发需经授权。
