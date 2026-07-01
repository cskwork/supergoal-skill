# Changelog 2026-07-02

## Workflow-execution reliability + skill-authoring best-practice pass

Spec: `docs/changelog/2026-07/02-workflow-optimization/plan.md` (plan-first, then implemented).
Yardsticks: skill-creator guidance (SKILL.md <500 lines; reference files >300 lines carry a TOC)
and mattpocock `writing-great-skills` (predictability - the same procedure every run - is the root
virtue; pointers and personas are how the router guarantees it).

### `tests/reference-integrity.test.sh` (new)

- Decision: machine-enforce router integrity. Every workflow executes by following SKILL.md's
  pointers into `reference/`, `agents/`, `templates/`; today a manual sweep found 0 dangling
  pointers, but nothing prevented a rename/delete from silently 404ing a route at dispatch time.
- Checks: (1) every extension-terminated skill-owned path token in SKILL.md/README/reference/agents
  exists on disk; (2) every bare `*-gate.(mjs|sh)` name (e.g. `learn-grounding-gate.mjs` in the
  SKILL.md mode table) resolves inside `templates/`; (3) no orphan persona and every reference file
  is reachable from the router. Extraction uses a perl lookbehind + extension requirement so prose
  ("across agents/surfaces") and runtime workspace paths (`teach/<topic>/reference/*.html`) never
  false-positive.
- Verified red AND green: on a scratch copy with an injected dangling path, phantom gate, and orphan
  persona, the test fails 3/4 with exit 1; on the real tree it passes 4/4. Auto-collected by
  `tests/run-all.sh` (glob), so no runner change.

### TOCs for >300-line reference files

- `reference/teach.md` (556), `reference/taste-skill-v2.md` (371), `reference/harness-eval.md` (328)
  each gained a one-block "Sections (jump, don't rescan)" line. Body text and all machine anchors
  untouched (teach-contract 64/0 still green). taste-skill-v2.md's TOC sits in the supergoal-owned
  header area, outside the compressed upstream body, so an upstream refresh does not collide.

### `reference/market-research.md` analyst pointer

- "The Analyst" was the only persona referenced by word instead of file path; a conductor could
  improvise the role instead of loading `agents/analyst.md`. Now dispatched by path like every other
  persona.

### Rejected alternatives

- Splitting `reference/teach.md` below 500 lines: 52 teach-contract anchors point at that file;
  churn without measured benefit. TOC only.
- Restoring the longer frontmatter description: e3328e6 deliberately tightened it to leading word +
  triggers; not re-litigated.
- Deduplicating SKILL.md vs role-loop.md: the overlap is intentional redundancy machine-anchored by
  workflow-contract.test.sh so the contract survives single-file loads.
- Touching harness-eval runner/gate logic: green, and the pending confirmatory A/B
  (`docs/experiments/2026-07-02-lean-skill-confirmatory-ab/PLAN.md`) depends on them unchanged.

### Deployment note (no repo change)

- `~/.claude/skills/supergoal` is a copy, refreshed externally today 06:23 (old copy backed up as
  `supergoal.bak-20260702-062301`). Copy-based deploys re-drift on the next commit - the 6/21 copy
  ran 11 days without the commit gate, delivery gate, or lean loop. Durable fix: symlink deploy via
  sync-skill.

Verification: `bash tests/run-all.sh` exit 0 - all suites green including the new integrity test
(4/0), teach 64/0, harness-eval 200/0, role-loop 17/0, workflow 17/0.
