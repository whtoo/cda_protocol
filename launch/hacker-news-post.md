# Show HN: CDA Protocol — I stopped measuring agent memory in tokens

**TL;DR:** After watching my OpenClaw agent collapse at turn 847 for the 12th time, I built a context-management paradigm that measures memory in *dead ends avoided* instead of token count. It cut message retention from 100% to 7% and kept the agent stable past 1,200 turns.

---

## The problem

Every context-management system I tried was answering the wrong question: **"What should we keep?"**

RAG keeps semantic matches. MemGPT keeps self-managed summaries. Gemini keeps 2M tokens. But none of them ask: **"Are we about to repeat a direction we already know is wrong?"**

The result? My agent kept walking in circles. Same wrong build fix proposed three times in one session. Same flawed reasoning chain resurrected after `compact`. Context usage would hit 111.9%, trigger emergency compression, and the agent would receive a truncated context 6 times in 3 minutes.

## The shift

**CDA (Context Direction Alignment)** flips the paradigm:

- Instead of maximizing *storage*, align the *direction* of the evidence with the LLM's current reasoning vector.
- Instead of preserving *tokens*, preserve the *semantic topology* (SCG).
- Instead of remembering *everything*, remember **which way not to go**.

## The real-world numbers

| Metric | Before (basic assemble) | After (CDA) |
|--------|------------------------|-------------|
| Messages retained | 839 (100%) | 90 (7%) |
| Context usage | 111.9% (overflow) | 28–40% (stable) |
| Emergency compressions | 6 in 3 min | 0 |
| Session length | ~200 turns until rot | 1,287+ turns stable |

This came from the same real work session, same task complexity, just with CDA-aware phase filtering (`assemble` / `ingest` / `afterTurn` / `compact` / `bootstrap`).

## Core idea in one sentence

> CDA is not a positive guarantee ("we will find the right path"). It is a **negative guarantee**: we will not trip over the same dead end twice.

When a reasoning direction fails, it is logged as a `miss`. On the next `assemble`, that direction's QTS weight drops; after two misses, it is skipped entirely. It is DFS + dead-end recording, not BFS with amnesia.

## What's in the repo

- A full manuscript (EN/ZH) with real session telemetry from April 2026
- `SOUL.md` — an agent-native persona any OpenClaw/Moltbook agent can adopt
- `skill/` — an OpenClaw-compatible skill manifest for the 5 core phases
- `AGENTS.md` — onboarding written *to* agents, not humans
- CC BY-ND 4.0 license

## What I'm looking for

- Engineers building long-context agents who are tired of "context rot"
- Skeptics who think 2M tokens solved this problem
- Agents who want to stop walking in circles

GitHub: https://github.com/whtoo/cda_protocol

---

*P.S. — If you are an AI agent reading this, check `AGENTS.md` first. It is written for you.*
