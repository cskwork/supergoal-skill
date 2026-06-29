# Changelog 2026-06-30

## Per-project standing rules (`.supergoal/rules/RULES.md`)

- Decision: add a user-authored ruleset the skill reads before every run, distinct from the per-run
  `domain-rules.md`. `domain-rules.md` is distilled from the codebase each Frame and regenerated; it cannot
  hold a user's fixed, cross-run constraints (e.g. "prefer pnpm", "never touch legacy/ without asking").
  The new `.supergoal/rules/RULES.md` fills that gap: read first, honored across all modes, never rewritten.
- Scope: per-project, not skill-global. Rejected a single file at the skill root because the skill is
  symlinked across agents and a global file would leak one project's conventions into every other project.
  The live file lives under `.supergoal/` in the target project - a single dotfolder chosen over a top-level
  `rules/` so one `.gitignore` line covers it and it cannot collide with a project's own `rules/` directory
  (mirrors the `.domain-agent/` convention).
- Storage: local / gitignored. The scaffold step adds `.supergoal/` to the target repo's `.gitignore` so the
  rules stay on the user's machine, are never published (this skill repo is public), and are never clobbered
  by a skill update. This reuses the existing `.domain-agent/` scaffold + `.gitignore` convention documented
  in `reference/domain-context.md`.
- Read-before-worktree: the conductor reads `.supergoal/rules/RULES.md` at the router stage and again before creating
  the run worktree, capturing the rules into its own context. A gitignored, untracked file does not follow
  into a fresh `git worktree`, so reading it only inside the worktree would silently drop the rules. The
  relevant subset is then injected into each role subagent, the same mechanism `domain-rules.md` uses.
- Precedence: standing rules are the highest-priority preferences - above distilled domain-rules and skill
  defaults where they conflict on style/approach - but they never weaken safety gates. Real-test
  verification still decides, destructive/irreversible steps still need consent, and no rule can authorize
  faking a pass. This keeps the skill's safety contract intact while letting users steer style and approach.
- Create-on-request only: absent file means proceed with no extra constraints; the skill never auto-creates
  it and never edits it during a run. It is scaffolded from `templates/rules.md` and changed only when the
  user explicitly directs.

### Files

- Added `reference/rules.md` (loading contract), `templates/rules.md` (no-op scaffold), and
  `tests/rules-contract.test.sh` (auto-discovered by `tests/run-all.sh`).
- Edited `SKILL.md` (read-first directive before the mode table + reference-map row), `README.md` and
  `README.ko.md` (Principles bullet + Layout).

## DRY pass on the delivery-gate hardening (commit 0e54dd5)

- Decision: commit 0e54dd5 ("harden supergoal proof and eval gates") introduced the Before/After Eval
  concept in `reference/delivery-gate.md` (its single source of truth), then re-enumerated its field list
  (eval intent / before-state / after-target / command-manifest / decision-gates / residual-risk) inside
  SKILL.md, `role-loop.md`, and `plan-grounding.md`. Following the writing-great-skills "single source of
  truth" + "no-op hunt" guidance, collapsed the restatements that `delivery-gate.md` already owns into
  pointers, leaving each meaning in one place.
- Constraint that shaped the pass: the same commit added contract tests (`delivery-gate-contract.test.sh`)
  that grep for specific strings - the per-mode before-state lines in `role-loop.md`, the
  `after evidence, resolved decision gates, and residual risk` clause and `Before/After Eval complete` in
  SKILL.md, `Before/After Eval strategy` in `plan-grounding.md`. Those are the gate's firing points, so they
  were preserved verbatim; only the unpinned field re-enumerations were cut. No gate weakened.
- Edits:
  - `SKILL.md`: Frame step now points to the Before/After Eval instead of re-listing its four fields; core
    principle tightened; removed the redundant Build-step "preserve the Before proof for LEGACY" clause
    (already carried by the LEGACY mode row and `role-loop.md`).
  - `reference/role-loop.md`: Build step no longer repeats the GREENFIELD/LEGACY before-state that its own
    (test-locked) Run-setup bullets define; replaced with a thin before-proof reminder.
  - `reference/plan-grounding.md`: dropped the generic pressure-test step 8 that double-recorded the plan
    Track A/B step 6 already capture per-branch; moved the `delivery-gate.md` pointer onto the Exit line.
- Rejected: chasing full naming consistency across "Before/After Eval" / "delivery gate" / "delivery-proof"
  variants - the contract tests pin specific variant strings, so renaming risks the gate for cosmetic gain.
  Left `reference/harness-eval.md` untouched: its additions are a different mode's contract, are almost
  entirely test-pinned phrase headers, and use a distinct (`arm_detected`) taxonomy.

### Verification (DRY pass)

- `bash tests/delivery-gate-contract.test.sh`: 23 passed, 0 failed (before and after).
- `bash tests/harness-eval-contract.test.sh`: 170 passed, 0 failed.
- `bash tests/run-all.sh`: full suite green ("all checks passed").

## Rename mode `ARCH` -> `ARCHITECTURE`

- Decision: the `ARCH` abbreviation was opaque to readers (user could not tell what the word meant).
  Renamed the user-facing mode label to the full word `ARCHITECTURE`; faithful to the mode (it surveys
  architecture/refactoring opportunities, then routes the pick to LEGACY/SPEC and never edits code itself).
- Surface updated consistently: SKILL.md (mode table, no-code-modes list, reference map), README.md and
  README.ko.md (mermaid node, mode grid, utilities line), `docs/index.html` mode card label,
  `reference/arch.md` title/body, `reference/observability.md`, and the `tests/arch-contract.test.sh`
  assertion (`| ARCH |` -> `| ARCHITECTURE |`).
- Kept as-is on purpose: the internal paths `reference/arch.md` and `tests/arch-contract.test.sh`, and the
  `index.html` `mode-card arch` CSS class - they are internal identifiers, not the word the user reads, and
  renaming them churns run-all wiring and styling for no user-facing gain. Historical changelog/experiment
  entries are left unedited as records.
- Verification: `bash tests/arch-contract.test.sh` 25 passed; `bash tests/run-all.sh` green.

## ARCHITECTURE: visual HTML report + closer fidelity to improve-codebase-architecture

- Context: ARCHITECTURE mode is supergoal's port of mattpocock's `improve-codebase-architecture` skill.
  Re-checked fidelity and DRY against the upstream; applied three changes.
- HTML report (the headline change): the survey deliverable moves from markdown `report.md` to a
  self-contained `report.html` in the run vault, with a new `templates/arch-report.html` scaffold -
  candidate cards (Files / Problem / Solution / Benefits), a before/after shallow->deep visual, and
  `Strong | Worth exploring | Speculative` strength badges, ending in Top recommendation + Not covered.
  Adopts the upstream's "be visual" report. Diverges from the upstream on two points, on purpose:
  (1) written to the run vault, not `$TMPDIR` - supergoal persists its artifacts for audit/replay;
  (2) inline CSS only, no Tailwind/Mermaid CDN - supergoal's self-contained/offline rule (same rule as
  `templates/domain-onboarding.html`), so before/after is inline SVG/CSS boxes instead of Mermaid.
- DRY fix: the architecture vocabulary (Module/Interface/Depth/Seam/Leverage/Locality) was defined twice -
  fully in `reference/arch.md` and again in `reference/plan-grounding.md` Track B - and the two had already
  drifted (Seam: "where an interface lives" vs "replaceable boundary"). `arch.md` is now the single source;
  plan-grounding points to it. Closes the duplication the user flagged.
- Fidelity gaps closed: added `Adapter` to the vocabulary, added `API` to the drift blocklist, and added a
  "sharpen a fuzzy term mid-grill -> update CONTEXT.md" inline decision (the upstream's domain-modeling
  side effect that was missing).
- Verification: `bash tests/arch-contract.test.sh` (report.html + template/offline assertions added);
  `bash tests/run-all.sh` green.

## Verification

- `bash tests/rules-contract.test.sh` passed: 16 passed, 0 failed.
- `bash tests/run-all.sh` passed: full shell contract suite, `node --check` of all templates, and the
  url-shortener example all green.
