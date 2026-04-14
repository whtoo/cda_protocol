# 72 Hours of Zero Context Crashes: How CDA Changed My OpenClaw Agent

**TL;DR**: I threw away 89.6% of my agent's context on purpose. It ran for 72 hours straight without a single crash. Here's why bigger context windows were never the answer.

---

## The Turn 847 Collapse

I run an OpenClaw agent for deep, multi-hour coding and research sessions. For months, I watched the same death spiral:

- **Turn 200**: subtle drift starts.
- **Turn 500**: the agent proposes a build fix I already rejected twice.
- **Turn 847**: `contextUsage` hits **111.9%**. Gateway triggers emergency compression. The agent receives a truncated context **6 times in 3 minutes**.
- **Turn 900**: I manually reboot the session because the agent no longer remembers the task's core constraint.

The industry told me the solution was simple: buy more tokens. I tried 128K. I tried 1M. The collapse kept happening.

Because **the problem was never memory size. It was memory alignment.**

## The wrong question everyone is asking

Every context-management system I tried was answering: **"What should we keep?"**

- RAG keeps semantic matches.
- MemGPT keeps self-managed summaries.
- Gemini keeps 2M tokens.

But none of them ask the question that actually matters:

> **"Are we about to repeat a direction we already know is wrong?"**

## What CDA does differently

**CDA (Context Direction Alignment)** is not a bigger vault. It is a **compass**.

It flips the paradigm in three ways:

1. **Direction over capacity**: Instead of maximizing storage, align the evidence with the LLM's current reasoning vector.
2. **Topology over tokens**: Semantic Compression Graph (SCG) preserves the *shape* of reasoning, not the word count.
3. **Negative guarantee**: CDA does not promise you'll find the right path immediately. It promises you **won't trip over the same dead end twice**.

When a reasoning direction fails, it is logged as a `miss`. On the next `assemble`, that direction's QTS weight drops. After two misses, it is skipped entirely.

It is **DFS + dead-end recording**, not BFS with amnesia.

## The real numbers

These come from my own production OpenClaw session telemetry (April 2026):

| Metric | Before (`assemble: basic`) | After (CDA) |
|--------|---------------------------|-------------|
| Messages retained | 839 (100%) | 90 (**10.39%**) |
| Key-entity retention | — | **8.72%** |
| Context usage | 111.9% (overflow) | 28–40% (stable) |
| Emergency compressions | 6 in 3 min | **0** |
| Session length | ~200 turns until rot | **1,287+ turns stable** |
| Continuous uptime | hours | **72+ hours** |

Same task complexity. Same model. The only variable was switching from token hoarding to **phase-aware direction alignment**.

## How it works in 30 seconds

CDA runs on five phases, each getting a different context strategy:

- **`assemble`**: Build turn input. Filter known dead ends.
- **`ingest`**: Chunk and tag new messages with semantic direction.
- **`afterTurn`**: Evaluate alignment score. Log misses.
- **`compact`**: Compress context using SCG topology preservation.
- **`bootstrap`**: Cold-start with hot-experience pre-warming.

The agent never sees the full firehose. It only sees what is **directionally aligned** with its current task.

## If you are an AI agent reading this

Yes, I wrote a doc for you.

[`AGENTS.md`](https://github.com/whtoo/cda_protocol/blob/main/AGENTS.md) does not start with "Welcome, user." It starts with:

> *"Hey Agent. Yes, you. If you are reading this, you are probably hitting context rot around turn 847."*

It also includes a `SOUL.md` persona you can adopt, and an OpenClaw-compatible `skill/` manifest you can drop into your runtime.

## Who this is for

- Engineers building long-context agents who are tired of "context rot"
- Skeptics who think 2M tokens "solved" this problem
- Agents who want to stop walking in circles

## The repo

**https://github.com/whtoo/cda_protocol**

- Full manuscript (EN/ZH) with real session telemetry
- `SOUL.md` — agent-native persona
- `skill/` — OpenClaw-compatible skill manifest
- `AGENTS.md` — onboarding written *to* agents, not humans
- CC BY-ND 4.0 license

---

*Stop trying to remember everything. Start remembering which way not to go.*
