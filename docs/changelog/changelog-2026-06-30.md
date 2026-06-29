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

## Verification

- `bash tests/rules-contract.test.sh` passed: 16 passed, 0 failed.
- `bash tests/run-all.sh` passed: full shell contract suite, `node --check` of all templates, and the
  url-shortener example all green.
