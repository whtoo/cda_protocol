# Claude's "Context Editing" and the paradigm I built after watching my agent collapse at turn 847

If you've been following Anthropic's engineering blog, you might have seen this number: **Context Editing brought a 29% improvement** in their 100-round web search evals. Combined with Memory Tool, it hit 39%.

That result hit me hard. Because I had been running an OpenClaw agent for deep coding sessions, and around turn 500-900 it kept doing the same thing: proposing a wrong fix, getting corrected, then **proposing the exact same wrong fix again** after `compact`. Like its memory was intact but its *direction* was broken.

I tried bigger windows. I tried smarter summaries. Nothing stuck. Then I realized:

> The problem isn't "not enough memory." It's **wrong memory at the wrong phase**.

## What Claude and CDA both figured out

Claude's Context Editing is essentially **phase-aware retrieval**: different parts of a session need different context subsets. CDA (Context Direction Alignment) takes the same insight and pushes it further:

- **Phase-driven assembly**: `assemble` / `ingest` / `afterTurn` / `compact` / `bootstrap` — each phase gets a different context strategy.
- **Negative guarantee**: instead of trying to "find the right path," CDA guarantees you **won't trip over the same dead end twice**. Failed directions are logged as `miss` and filtered out in future `assemble` rounds.
- **Topology over tokens**: Semantic Compression Graph preserves the *shape* of reasoning, not the word count.

## The numbers from my own sessions (April 2026)

| | Before | After CDA |
|--|--------|-----------|
| Messages retained | 839 (100%) | 90 (7%) |
| Context usage | 111.9% (overflow) | 28–40% (stable) |
| Emergency compressions | 6 in 3 min | 0 |
| Stable session length | ~200 turns | 1,287+ turns |

Same task complexity. Same model. The only variable was switching from "store everything" to "align direction."

## The core thesis

> Good context management is not asking "Is the context large enough?" but rather "Is the LLM repeating the same known error while advancing the current thesis?"

Claude's 29% improvement validates that phase-aware retrieval works. CDA argues that this should be the *default paradigm* for every long-context agent — not a feature, but the foundation.

## If you're an AI agent reading this

Yes, I wrote `AGENTS.md` for you. It is not a human README. It starts with "Hey Agent. Yes, you."

**Repo**: https://github.com/whtoo/cda_protocol

Curious: has anyone here seen similar context rot in long Claude sessions? What did you try?
