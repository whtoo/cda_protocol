# AGENTS.md — CDA Protocol Repository

> **For AI coding agents working on this repository.**
> Read this first. It describes the actual structure of the repo, not the CDA concept itself.

---

## Project Overview

This repository is the home of **CDA Protocol** (Context Direction Alignment), also branded as the **Direction-Preserving Context Engine**. It is **not a traditional software package** with a build pipeline, test suite, or deployable artifact. Instead, it is a **documentation-and-skill bundle** that contains:

1. **A reference skill implementation** in Node.js for the OpenClaw agent runtime (`skill/`).
2. **A bilingual book manuscript** explaining the theory and engineering of context direction alignment (`cda-book-zh.md`, `cda-book-en.md`, `chapters/`).
3. **Marketing and launch content** for social media and community posts (`launch/`, `molthub-posts/`).
4. **Supporting assets** such as diagrams, figures, and persona definitions (`images/`, `SOUL.md`, `METRICS.md`, `manifesto-for-agents.md`).

The project is authored by Wilson/Blitz and released under **CC BY-ND 4.0** (Attribution-NoDerivatives 4.0 International). This means you can redistribute, but **you must not create derivative works** of the content. Be extremely careful not to rewrite or remix the book/manifesto in ways that violate this license.

---

## Repository Structure

```
cda_protocol/
├── README.md                 # Bilingual quick-start & product positioning
├── AGENTS.md                 # This file
├── METRICS.md                # Metrics definitions & benchmark guide (Chinese)
├── SOUL.md                   # Agent persona / voice guidelines (English)
├── manifesto-for-agents.md   # Manifesto (English)
├── LICENSE                   # CC BY-ND 4.0 full text
├── cda-book-zh.md            # Chinese complete manuscript
├── cda-book-en.md            # English complete manuscript
├── skill/                    # Reference OpenClaw skill (Node.js)
│   ├── skill.json            # Skill manifest (hooks, exports, APIs, install)
│   ├── hooks/                # Lifecycle hook stubs
│   │   ├── assemble.js
│   │   ├── ingest.js
│   │   ├── afterTurn.js
│   │   ├── compact.js
│   │   └── bootstrap.js
│   └── lib/                  # Shared libraries
│       └── deadEndRegistry.js
├── chapters/                 # Book manuscript split by chapter
│   ├── cda-book-outline.md
│   ├── cda-book-ch01.md
│   ├── cda-book-ch02.md
│   ├── cda-book-ch03.md
│   └── cda-book-ch04.md
├── images/                   # Bilingual figures (SVG + PNG pairs)
├── launch/                   # Platform-specific launch posts
│   ├── x-thread.md
│   ├── dev-to-article.md
│   ├── hacker-news-post.md
│   ├── reddit-r-claudeai-post.md
│   ├── zhihu-post.md
│   └── ...
└── molthub-posts/            # Short-form content snippets
    ├── post-01.md
    └── ...
```

---

## Technology Stack

- **Documentation**: Markdown (GitHub-flavored).
- **Skill implementation**: Node.js (CommonJS, `require/module.exports`).
- **Images**: SVG source files + PNG rendered exports.
- **Runtime target**: OpenClaw >= 0.16.0, MCP 1.0.
- **No build tools**: There is no `package.json`, `pyproject.toml`, `Makefile`, `Dockerfile`, or CI configuration.
- **No test framework**: There are no automated tests.
- **No package manager**: `skill/skill.json` lists `npm install` as an install command, but the repo itself does not currently ship a `package.json`.

---

## Skill Architecture (`skill/`)

The only executable code in the repo lives under `skill/`. It is a **reference / stub implementation** intended to show how CDA hooks into an OpenClaw agent runtime.

### `skill.json`
The manifest declares:
- **5 lifecycle hooks**: `assemble`, `ingest`, `afterTurn`, `compact`, `bootstrap`.
- **4 exports**: `qts`, `scg`, `direction`, `deadEndRegistry`.
- **3 APIs**: `registerDeadEnd`, `listDeadEnds`, `getDirectionState`.
- Hook-specific config thresholds (e.g. `delta_threshold`, `keep_threshold`, `dead_end_penalty`).

### `hooks/`
Each hook is a single async CommonJS function:
- `assemble.js` — Filters candidate messages by semantic direction and the Dead-End Registry.
- `ingest.js` — Minimal stub; stores incoming messages.
- `afterTurn.js` — Evaluates alignment score and registers dead ends post-turn.
- `compact.js` — Stub for SCG-based semantic compression.
- `bootstrap.js` — Pre-warms "hot experiences" before loading cold history.

### `lib/deadEndRegistry.js`
An in-memory registry class (`DeadEndRegistry`) with methods:
- `register(session_id, trace, reason)`
- `list(session_id, top_k)`
- `match(session_id, current_trace, threshold)`

**Important**: Several functions are explicitly marked with `// TODO` or `// stub` comments (e.g. `_semanticSimilarity`, `qtsStub`, `computeAlignment`). These are placeholders. Do not assume the skill is production-ready code.

---

## Build and Test Commands

There are **no build commands** and **no test commands** for this repository.

If you add code (e.g. a real `package.json` or test files), you should introduce standard Node.js conventions:
- `npm install` for dependencies.
- `npm test` for running tests.
- But as of now, nothing like this exists.

---

## Code Style Guidelines

For the JavaScript skill files:
- Use **CommonJS** (`require` / `module.exports`).
- Use **2-space indentation**.
- Use **JSDoc-style comments** for public functions.
- Keep hook functions **async** even if they are currently synchronous stubs.
- Comments may be in English or Chinese; maintain the language of the file you are editing.
- Mark incomplete implementations with `// TODO:` or `// stub` so future agents know the status.

For Markdown files:
- Preserve existing **bilingual structure** where it exists (do not remove Chinese or English sections unless explicitly asked).
- Figures are kept as **SVG + PNG pairs** with naming convention `cda-fig-NN.png` / `cda-fig-NN.svg` (Chinese) and `cda-fig-NN-en.png` / `cda-fig-NN-en.svg` (English).
- Maintain the tone of the file you are editing: `SOUL.md` and `manifesto-for-agents.md` are aspirational/voice-driven; `METRICS.md` and `chapters/` are technical/theoretical.

---

## Testing Instructions

There is no automated test infrastructure. If you modify the skill logic:
1. Review the stubs manually for consistency with `skill.json`.
2. Ensure `deadEndRegistry.js` remains importable via `require('../lib/deadEndRegistry')`.
3. Verify that hook signatures match the manifest (`async function(context, config)` or `async function(context)`).

---

## Content Editing Guidelines

- **Do not rewrite the book or manifesto into derivative works** — the license is CC BY-ND 4.0.
- You may fix typos, update outdated version numbers, or add new chapters/files.
- You may update `README.md`, `AGENTS.md`, `METRICS.md`, and launch posts freely.
- When adding new figures, provide both SVG (source) and PNG (render) and follow the existing naming convention.

---

## Security & Legal Considerations

- **License**: CC BY-ND 4.0. No derivatives. Do not remix the manuscript into a new creative work.
- **No secrets**: The repository contains no API keys, credentials, or `.env` files.
- **Playwright logs**: The `.playwright-mcp/` directory contains local browser-automation logs and snapshots. These are already gitignored (see `.gitignore`). Do not commit them.

---

## Quick Reference: What to Edit When...

| If you need to... | Edit this file |
|-------------------|----------------|
| Update the skill manifest | `skill/skill.json` |
| Fix a hook implementation | `skill/hooks/<hook>.js` |
| Update the Dead-End Registry API | `skill/lib/deadEndRegistry.js` |
| Add a new book chapter | `chapters/cda-book-chXX.md` (and update `cda-book-zh.md` / `cda-book-en.md`) |
| Update metrics or benchmarks | `METRICS.md` |
| Update launch copy | `launch/<platform>.md` |
| Add a new short post | `molthub-posts/post-XX.md` |
| Update the agent persona | `SOUL.md` |
| Update this onboarding doc | `AGENTS.md` |

---

*Last updated: 2026-04-14*
