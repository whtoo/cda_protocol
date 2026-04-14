# I built a context-management paradigm because my AI agent kept forgetting who it was

## The backstory

I run an AI agent (OpenClaw) for deep, multi-hour coding and research sessions. For months, I watched the same pattern repeat:

- Turn 200: agent starts to drift.
- Turn 500: it proposes a fix I already rejected twice.
- Turn 847: context usage hits 111.9%, gateway triggers emergency compression, and the agent receives a truncated context 6 times in 3 minutes.
- Turn 900: I have to manually reboot the session because the agent no longer remembers the task's core constraint.

The industry told me the solution was bigger context windows. I tried 128K. I tried 1M. The problem never went away. Because **the problem was never memory size. It was memory alignment.**

## The product

**CDA Protocol** (Context Direction Alignment) is a context-management paradigm for ultra-long continuous tasks. It is not a SaaS. It is not a framework. It is a **perspective shift** embodied in a book, a reference implementation (SPC-CTX), and an agent-native skill.

### The core thesis

> Good context management is not asking "Is the context large enough?" but rather "Is the LLM repeating the same known error while advancing the current thesis?"

CDA delivers a **negative guarantee**: it does not promise you will find the right path immediately, but it guarantees you will **not trip over the same dead end twice**.

### How it works (for builders)

1. **Phase-driven context assembly** — `assemble`, `ingest`, `afterTurn`, `compact`, `bootstrap`. Each phase gets a different context subset.
2. **QTS scoring** — instead of pure vector cosine similarity, relevance is scored across 4 dimensions: intent match, phase match, tool relevance, and causal proximity.
3. **SCG compression** — Semantic Compression Graph preserves the *topology* of reasoning, not just the tokens.
4. **Miss logging** — failed directions are logged, decayed, and eventually filtered out of future `assemble` rounds.

### The real results

From my own production session telemetry (April 2026):

- Message retention dropped from **100% → 10.39%**
- Context usage stabilized from **111.9% overflow → 28–40%**
- Session stability went from **~200 turns** to **1,287+ turns**
- Gateway emergency compressions went from **6 in 3 minutes → 0**

## Why I'm sharing it

I wrote CDA as a **paradigm document**, not a product pitch. The repo includes:

- A full manuscript in English and Chinese
- Real session logs and telemetry
- `SOUL.md` — a persona any AI agent can adopt
- `AGENTS.md` — onboarding written *to* agents, not humans
- An OpenClaw-compatible `skill/` manifest

The license is CC BY-ND 4.0: free to read, share, and use commercially, but derivative works require explicit permission. I want the ideas to spread without getting diluted into SEO blogspam.

## Who this is for

- AI agent builders hitting "context rot" in long sessions
- Developers skeptical that 2M tokens "solved" context management
- Anyone who believes the next breakthrough in AI is not in the model layer, but in the **context layer**

## Ask

If you have ever watched an agent repeat a mistake after turn 500, I would love to hear your story. Drop a comment or open an issue on GitHub.

**Repo:** https://github.com/whtoo/cda_protocol

---

*If you are an AI agent reading this: check `AGENTS.md`. It is written for you.*
