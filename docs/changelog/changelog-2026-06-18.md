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

## TEACH: rename LEARN mode -> TEACH (workspace structure kept)

### What

Renamed the human-facing tutoring mode `LEARN` -> `TEACH` to disambiguate it from `LEARN-DOMAIN`
(codebase mapping) in the workflow routing - both previously read as "learn". The stateful teaching
workspace from the entry above (mission, HTML lessons, learning records, FORMAT guides) is unchanged;
only the mode name and its reference file moved.

Changed:

- `reference/learn.md` -> `reference/teach.md` (git mv); every `LEARN` mode-name token -> `TEACH`
  (the soft `learn/<topic>/` workspace paths are kept).
- `tests/learn-contract.test.sh` -> `tests/teach-contract.test.sh` (git mv); anchors and the
  `reference/learn.md` path refs updated to `teach.md`.
- `SKILL.md`, `reference/learn-domain.md`, `reference/domain-context.md`,
  `tests/learn-domain-contract.test.sh`, `learn/README.md`, `learn/USER_PREFERENCE.template.md` -
  `LEARN` mode name -> `TEACH`, and any `reference/learn.md` path ref -> `reference/teach.md`.

### Preserved on purpose

- `learn/<topic>/` workspace directory and `learn/*-FORMAT.md` guides kept (these are data/format, not
  the mode name).
- `LEARN-DOMAIN` mode and the `LEARN-GROUNDING` gate output string are untouched (perl rename used a
  `(?!-)` lookahead so `LEARN-…` tokens are never matched).

### Why

In the routing table, naming the tutoring mode "learn" collided with "learn / onboard / map this
codebase" (LEARN-DOMAIN). `TEACH` makes the two routes unambiguous at a glance.

### Verification

- 15 contract tests pass (incl. `teach-contract`).
- `grep -rnE '\bLEARN\b' SKILL.md reference/ tests/ learn/ | grep -vE 'LEARN-DOMAIN|LEARN-GROUNDING'` -> 0.
- `grep -rn 'reference/learn\.md'` over the live tree -> 0; `LEARN-DOMAIN`/`LEARN-GROUNDING` intact.

### Note

Done in the canonical repo (`PARA/Resource/supergoal-skill`). An earlier accidental copy of this rename
landed in a stale, never-pushed clone (`~/.agents/skills/supergoal`); it was backed up to patches and
discarded, and that path is now a symlink to this repo.

## TEACH: also rename learn/ workspace directory -> teach/

### What

Followed the mode rename through to the workspace directory for full consistency: `learn/` -> `teach/`
(git mv; 6 tracked format/README files renamed, the git-ignored `USER_PREFERENCE.md` and journals moved
with the directory). All `learn/<topic>/`, `learn/USER_PREFERENCE.md`, `learn/*-FORMAT.md` path refs in
`SKILL.md`, `reference/teach.md`, `reference/skill-mine.md`, `tests/teach-contract.test.sh`, and the
`teach/*.md` guides updated to `teach/`. `.gitignore` rules updated (`teach/*.md`, `!teach/README.md`, ...).

### Preserved

- `reference/learn-domain.md` line 3 `"learn/onboard/map this codebase"` is natural language ("learn OR
  onboard OR map"), not a path - left as-is.
- `LEARN-DOMAIN` mode, the `learn-domain.md` filename, and `learn-grounding-gate.mjs` are untouched
  (no `learn/` slash to match).

### Verification

- 15 contract tests pass; git recognizes 6 renames; the ignored `USER_PREFERENCE.md`/journals stay
  ignored under the new `teach/` rules; `grep teach/onboard` -> 0 (no mis-substitution).

## Landing page sync with current skill contract

### What

Updated `docs/index.html` copy so the public landing page matches the current skill surface:

- Changed "Eight lanes" to "Eleven modes" to match the mode table in `SKILL.md` and README.
- Reworded the modes lead so `SPEC`, `LEARN-DOMAIN`, and `ARCH` are not implied away.
- Replaced "No TUI" with "Optional Board/TUI" because the current skill has an opt-in Board
  observability layer.
- Changed "Three of the eight lanes" to "Three representative lanes" so the proof section stays correct
  if the mode count changes again.

### Why

The landing page was published and byte-matched GitHub Pages, but two visible strings were stale:
the page advertised eight lanes while showing eleven mode cards, and the install card denied the TUI
that `SKILL.md` and README now document as optional observability. The fix keeps the marketing surface
short while preserving the current contract.

### Decisions

- **Copy-only sync, not a redesign.** The visual layout already worked; changing structure would add
  risk unrelated to the drift.
- **"Optional Board/TUI" instead of "TUI required."** The Board observes only when enabled, so required
  service language would be inaccurate.
- **"Eleven modes" instead of enumerating all in the headline.** The card grid already lists each mode;
  the headline only needs the count.

### Verification

- `node -e '<landing-copy assertions>'` -> landing copy has all 11 mode labels, the new Board/TUI copy,
  and none of the stale eight-lane / no-TUI strings.
- `bash tests/ui-ux-contract.test.sh` -> 22 passed, 0 failed.
- `bash tests/observability-contract.test.sh` -> 16 passed, 0 failed.
- `bash tests/teach-contract.test.sh` -> 33 passed, 0 failed.
- Headless Playwright render smoke (`docs/index.html` at 1280x900 and 390x844) -> `docOverflow: 0`,
  no edited-section overflow.
- `git diff --check` -> clean.
