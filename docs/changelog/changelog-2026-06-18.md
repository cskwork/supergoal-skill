# Changelog 2026-06-18

## LEARN mode: integrate mattpocock/skills `teach` as a stateful teaching workspace

### What

Merged the `teach` skill (github.com/mattpocock/skills `skills/productivity/teach`) into supergoal's
LEARN mode. LEARN was chat-only and ephemeral (one journal per session). It is now a **stateful,
multi-session teaching workspace** that keeps all of supergoal's existing pedagogy.

Changed:

- `reference/learn.md` - surgical edits: header + flow now describe a stateful workspace; new sections
  **Teaching workspace**, **Philosophy (Knowledge / Skills / Wisdom; Fluency vs storage strength;
  desirable difficulty)**, **The mission**, **Resources (never trust parametric knowledge)**, **Zone of
  proximal development**, **Lessons (HTML, the primary teaching unit)**, **Reference documents &
  glossary**, **Wisdom & communities**, **Assets**. Flow step 1 became "Mission + Source", step 5
  became "Records + journal". Tutor contract gained points 15-17.
- `learn/MISSION-FORMAT.md`, `RESOURCES-FORMAT.md`, `GLOSSARY-FORMAT.md`, `LEARNING-RECORD-FORMAT.md` -
  adapted from teach's four format guides, with source attribution and supergoal paths (`learn/<topic>/`).
- `learn/README.md` - documents the new per-topic workspace layout; keeps the session-journal template.
- `.gitignore` - commit the `*-FORMAT.md` guides; ignore per-topic workspaces (`learn/*/`).
- `SKILL.md` - router, module list, and reference map now describe LEARN as a stateful workspace.
- `tests/learn-contract.test.sh` - kept all 12 existing anchors; added 10 anchors for the integrated
  concepts and a `require_file` check for the 4 format guides (26 checks, was 12).

### Why

The user asked to integrate the `teach` skill "exactly" into the current `learn`, then chose **full
workspace adoption** with **contract-test + new anchors** verification. teach and learn are
philosophically complementary: learn had strong *in-session* pedagogy (decomposition, process trace,
interview check, difficulty ladder, prerequisite scaffolding, human-to-code bridge) but no durable
state; teach had the durable model learn lacked (mission grounding, high-trust sourcing over parametric
guessing, Knowledge/Skills/Wisdom, fluency-vs-storage with spacing/interleaving, ADR-style learning
records, beautiful HTML lessons). The merge keeps both.

### Key design decisions

- **Surgical edits, not a rewrite.** `learn-contract.test.sh` pins 12 substrings via fixed-string grep.
  Editing only anchor-free regions preserves every anchor automatically; the test confirms it.
- **Workspace path = `learn/<topic>/`.** teach assumes a dedicated directory; LEARN runs inside
  arbitrary user repos, so the workspace is namespaced under the skill dir (existing learn precedent)
  per topic, with the global `USER_PREFERENCE.md` shared across topics. Avoids polluting user repos.
- **Per-topic data git-ignored.** Missions, records, lessons, and journals are personal; only the
  format guides and README ship. `learn/*/` ignores all per-topic workspaces.
- **HTML lessons kept distinct from LEARN-DOMAIN's `onboarding.html`.** Different purpose (teach a
  human vs onboard the agent), different path, no overlap; the boundary is stated in `learn.md`.

### Rejected alternatives

- **Concept graft (minimal).** Absorb only teach's ideas, no new artifacts. Smallest change, but the
  user explicitly wanted the full workspace, so records/missions/lessons would have stayed implicit.
- **Hybrid (concepts + missions/records/glossary, no HTML lessons/assets).** Avoids HTML overlap with
  LEARN-DOMAIN, but drops teach's primary teaching unit (the lesson) - the user chose full adoption.

### Verification

- `bash tests/learn-contract.test.sh` -> 26 passed, 0 failed (12 original anchors intact + 10 new + 4
  format-guide file checks).
- Full contract suite (13 grep-style tests) -> all rc=0; no regressions in learn-domain, spec, qa,
  review, role-loop, interview, arch, gate, harness-eval, db-access, domain-context, ui-ux.
- `git status` -> only the 5 intended edits + 4 new format guides; no stray changes.
