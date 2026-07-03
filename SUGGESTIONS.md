# SUGGESTIONS - remaining room for improvement

Prioritized follow-ups from the 2026-07-02 best-practice audit
(`docs/changelog/2026-07/02-workflow-optimization/plan.md`) and the production-adoption plan
(`docs/changelog/2026-07/02-production-adoption/plan.md`). Each entry: why it matters, what to do,
rough cost. None are regressions - the tree is green without them.

## 1. Symlink deploy (highest execution-reliability leverage)

- Why: `~/.claude/skills/supergoal` is a copy; it re-drifts on every repo commit. The 6/21 copy ran
  11 days without the commit gate, delivery gate, and lean loop - the repo verified one workflow
  while sessions executed another.
- Do: replace the copy with a symlink to this repo via sync-skill (one canonical dir, all agents).
- Cost: minutes. Guard: check the skills-manager app tolerates symlinked skill dirs first.

## 2. Run the production pilot before spending on more synthetic A/B

- Why: synthetic fixtures do not answer whether `/supergoal` is actually invoked on real work, whether
  installs drift, or which devices help in production sessions. The active plan moves evidence to real
  tasks and records only summary metrics in this repo.
- Do: run `docs/changelog/2026-07/02-production-adoption/plan.md`: symlink deploy, trigger accuracy,
  then a 10-task or 2-week production pilot with only metrics in
  `docs/experiments/production-pilot/LEDGER.md`.
- Cost: several real tasks over time. Guard: keep the ledger to date, mode, gap, gate, overhead, and friction
  only.

## 2b. Revisit the pending confirmatory A/B only after the pilot

- Why: the lean-out (2c743d3) shipped on directional evidence measured with paraphrased prompts,
  not the shipped files; and the critic keep-vs-remove decision may still need a genuinely
  under-specified fixture if production evidence cannot answer it.
- Do: keep `docs/experiments/2026-07-02-lean-skill-confirmatory-ab/PLAN.md` ready, but spend the
  ~$100-170 only if the production pilot leaves the lean/no-critic question unresolved.
- Cost: ~$100-170 compute, several wall-clock hours (serial runner).

## 3. Measure description trigger accuracy

- Why: the frontmatter description was tightened (e3328e6) on principle, never measured. Skills
  currently under-trigger by default; a too-lean description risks silent misses on real phrasings
  ("리팩토링 해줘", "why is this slow").
- Do: skill-creator's description-optimization loop - ~20 realistic should/shouldn't-trigger
  queries (near-misses included), `claude -p` trigger test, adopt only if the held-out score wins.
- Cost: low (one background loop). This also settles whether dropping the capability sentence
  ("surface hidden requirements...") lost recall.

## 4. Integrity test: cover directory tokens

- Why: `tests/reference-integrity.test.sh` checks extension-terminated paths and bare gate names;
  explicit directory pointers (`templates/spec/`, `templates/db-access/`) are still unchecked.
- Do: extract `(reference|agents|templates)/<segment>/` tokens with a trailing slash in the source
  text and require the directory to exist.
- Cost: ~10 lines in the existing test.

## 5. Upstream-derivative freshness audit

- Why: `reference/taste-skill-v2.md` is pinned to upstream commit 3c7017d (pulled 2026-05-30);
  staleness is invisible until UI output drifts from current taste.
- Do: a small scripted check (skill-install-audit style) that lists each vendored derivative, its
  pinned commit, and the upstream HEAD date; surface "stale > 90 days" as a warning, never a gate.
- Cost: small script + one table in README.

## 6. teach.md split - only with evidence

- Why: 556 lines load whole in TEACH mode. Deferred because 52 teach-contract anchors point at the
  file and there is no measured cost yet.
- Do (if TEACH context cost ever shows up in practice): move the Korean lesson/prerequisite
  templates into `templates/teach/` and migrate anchors in the same commit; the new integrity test
  will catch any pointer missed in the move.
- Cost: medium churn; do not do it preemptively.

## 7. Per-mode load budget visibility

- Why: efficiency regressions (a reference file quietly doubling) are invisible until someone
  re-audits by hand.
- Do: a tiny script that sums lines/approx tokens per mode (SKILL.md + the files its route names)
  and prints a table; run it in review when touching reference files. Report-only - no gate, no
  ceremony (supergoal-baseline-first: gates that never fail are ceremony).
- Cost: ~30-line script.
