---
paths:
  - "**/AGENTS.md"
---

# Rule: Writing and Maintaining AGENTS.md Files

## Scope
Applies to every `AGENTS.md` file in this repo — root and all nested per-directory
files (e.g. `api/AGENTS.md`, `api/lightning/AGENTS.md`, `frontend/AGENTS.md`, etc.).
Each directory's `CLAUDE.md` is a one-line include (`@AGENTS.md`) — never duplicate
content there; `AGENTS.md` is always the single source of truth.

## Hard constraints
1. **Max 200 lines per file.** If a directory's context doesn't fit, split it: create
   a child `AGENTS.md` in the relevant subdirectory and list it in the parent as a
   "load on demand" child doc (see `api/AGENTS.md`'s child-doc list for the pattern).
2. **Agent-oriented only — never human-facing.** No marketing prose, onboarding
   tutorials, welcome text, or motivational framing. Assume the reader is an
   autonomous coding agent that needs precise, actionable facts fast, not a new
   contributor being onboarded.
3. **Must document architecture + business logic from a product perspective**, not
   just mechanics. Every file should answer both "how is this built" and "why does
   it work this way" (product/business rationale), not only restate what the code
   literally does line-by-line.

## Required content focus
- **Architecture**: directory role/purpose, key files → responsibility (as a table),
  entry points, data/control flow, cross-module boundaries and ownership.
- **Product intent**: business rationale behind non-obvious design choices — mirror
  the "Product intent" pattern (e.g. `api/AGENTS.md`) explaining *why*, not just what.
- **Traps**: known bugs, dead code, divergences between code and docs/env defaults,
  footguns an agent could otherwise walk into.
- **Constraints**: explicit list of things an agent must never do in this area
  (e.g. never regenerate a migration, never bypass `Logics`, never mock a layer).

## Good-practice rules
- Prefer dense tables over prose (`| File | Role |`, `| Field | Purpose |`, etc.).
- Be specific and authoritative: cite real symbol/file/env-var names, state defaults,
  flag when code and `.env-sample`/docstrings disagree.
- Cross-reference sibling/child `AGENTS.md` files instead of duplicating facts —
  single source of truth per fact.
- Document intent/rationale/non-obvious behavior; skip anything trivially readable
  by opening the file (don't restate obvious code).
- Keep it current: update the relevant `AGENTS.md` in the same change that alters
  the behavior it documents. Stale docs are worse than no docs.
- Never invent APIs, params, or endpoints that don't exist in the code. If existing
  docs are stale/wrong, correct them rather than propagate the error.
- Use a consistent section order where applicable: Purpose → Architecture/Map →
  Key files → Behavior/Flow → Product intent → Traps → Constraints.
- Favor terse, information-dense bullet points and tables over long paragraphs.
- When a file approaches the 200-line limit, split by sub-concern (e.g. a
  `models/` or `commands/` subfolder gets its own child doc) rather than trimming
  substance.

## Anti-patterns to avoid
- Human-facing "getting started" guides, changelogs, or narrative history.
- Restating framework/library behavior that's true of Django/React/etc. in general
  and isn't specific to this codebase's usage of it.
- Padding with generic best-practice advice unrelated to this repo's actual code.
- Leaving a "Traps"/"Constraints" section empty just to match the template — omit
  the section entirely if there's genuinely nothing notable to report.
