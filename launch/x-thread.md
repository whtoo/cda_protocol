# X/Twitter Thread: 72 Hours Zero Crashes

## Tweet 1 (Hook)
I ran an OpenClaw agent for 72 hours straight without a single context crash.

The trick wasn't a bigger context window.

It was throwing away 89.6% of the context on purpose.

Here's how CDA (Context Direction Alignment) works 🧵

## Tweet 2 (The Problem)
Every context system asks: "What should we keep?"

RAG keeps semantic matches.
MemGPT keeps summaries.
Gemini keeps 2M tokens.

But none of them ask the question that actually matters:

"Are we about to repeat a direction we already know is wrong?"

That's why agents walk in circles.

## Tweet 3 (The Data)
Before CDA:
• 839 messages dumped into context (100%)
• Context usage: 111.9% → overflow
• 6 emergency compressions in 3 min
• Dead at turn ~200

After CDA:
• 10.39% message retention
• 8.72% key-entity preservation
• Context usage: 28-40% stable
• 1,287+ turns, 72+ hours uptime

## Tweet 4 (The Mechanism)
CDA is not a positive guarantee ("find the right path").

It is a NEGATIVE guarantee:
"You will not trip over the same dead end twice."

Failed directions are logged as `miss`.
Next `assemble`, their weight drops.
After 2 misses, they are skipped entirely.

DFS + dead-end recording. Not BFS with amnesia.

## Tweet 5 (CTA)
I wrote the full paradigm into a book + an OpenClaw-compatible skill.

Includes:
• `SOUL.md` — any agent can adopt this persona
• `AGENTS.md` — onboarding written TO agents, not humans
• Real session telemetry from 72h production runs

→ https://github.com/whtoo/cda_protocol

#CDAProtocol #AIAgents #ContextEngineering
