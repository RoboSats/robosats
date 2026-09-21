# development/ — Agent Context

## Purpose
Developer reference docs for humans and agents. No runnable code lives here — only markdown
documentation and image assets. Consult these files before editing architecture, upgrading
libraries/infrastructure, or running a release.

## File Map

| File | Purpose |
|---|---|
| `README.md` | High-level monorepo orientation and links to sub-docs |
| `setup.md` | Local dev stack instructions (Docker, full-stack, frontend-only, tests) |
| `docs.md` | Architecture documentation: Garage, Federation, Coordinator, Robot, Order models and API auth |
| `federation-discovery.md` | Full design of the runtime federation discovery mechanism (hash-first HTTP vote → Nostr-native migration path) |
| `blocked-upgrades.md` | **Pinned / blocked library versions** — do not upgrade these without reading this file first |
| `release.md` | Step-by-step release checklist (tags, signing, coordinator prompts, announcements) |
| `assets/` | Diagram images referenced by `docs.md` |

## Key References

### Blocked upgrades
`blocked-upgrades.md` lists every library or infrastructure component that was attempted at
a higher version and rolled back, or is known-incompatible.

Always check `blocked-upgrades.md` before bumping any dependency. See also `api/lightning/AGENTS.md`
for the CLN/holdinvoice constraint details.

### Federation discovery
`federation-discovery.md` documents the full runtime federation discovery design:
- Hash-first seniority-weighted HTTP vote (Phase A–C)
- Sybil-resistance via bundled seed dates and the `federation_join_dates` ledger
- Nostr-native migration path (Option A, kind 38384 + 30000)
- Which files were changed and why

Consult this before modifying `FederationContext.tsx`, `FederationDiscovery/index.ts`,
`Federation.model.ts`, or `api/views.py` (`FederationView`).

### Architecture diagrams
`docs.md` contains architecture descriptions and links to diagrams in `assets/` for:
Garage → Slot → Robot, Federation → Coordinator, Order/MakerForm, and backend coordinator layout.

## Constraints
- Do not add runnable code to this directory — it is documentation only.
- Keep `blocked-upgrades.md` updated in the same PR that attempts or reverts any dependency bump.
- Do not remove a blocked-upgrade entry until the blocker is fully resolved and the upgrade
  has been successfully merged to `main`.
