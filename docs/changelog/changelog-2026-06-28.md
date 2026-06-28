# Changelog 2026-06-28

## Code-as-Harness evidence hardening

- Decision: strengthen HARNESS-EVAL proof capture, not the high-level router. The official Code-as-Harness
  paper frames harnesses as executable contracts with accepted-action evidence, trajectory telemetry, and
  governed harness evolution; the existing skill already had same-snapshot controls, blind grading,
  quality scoring, false-GREEN accounting, and fixture discrimination.
- Added scoped evidence bundles to machine checks: every check now records `verifies`, `does_not_verify`,
  `confidence`, and `evidence`. A passing command without its proof boundary was rejected because it can
  hide oracle gaps.
- Added replayable trajectory telemetry to each arm: artifact root, logs, commands, edited files,
  permissions/approvals, turns completed, exit code, crash, and context-exhaustion status. Aggregate
  cost-only telemetry was rejected because it cannot explain why a harness won, lost, or crashed.
- Added a harness mutation contract to result reports: status, intended delta, safety envelope, rollback,
  proof command, and rejected alternatives. Prose-only adoption recommendations were rejected because they
  are not replayable and cannot be rolled back safely.
- Updated `templates/harness-eval-gate.mjs` and `tests/harness-eval-contract.test.sh` so missing scope,
  bad confidence, missing telemetry, proven crashes, and missing mutation contracts fail mechanically.

## no-mistakes gate lessons

- Decision: integrate the portable gate mechanics from `kunchenguid/no-mistakes`, not its local Git proxy.
  `no-mistakes` validates committed work through a disposable-worktree pipeline with explicit intent,
  deterministic commands, approval gates, fixture replay, and generated-surface drift checks. `supergoal`
  should keep its skill/harness scope rather than becoming a push remote, daemon, or PR monitor.
- Added `eval_intent` to HARNESS-EVAL results. Review/test judgment now records the user objective,
  constraints, tradeoffs, and rejected approaches instead of inferring intent from changed files after the
  run.
- Added `command_manifest` with command source and arm usage. A proven claim now needs trusted commands
  (`frozen_repo` or `evaluator_owned`) for both arms; agent-discovered commands remain supplemental
  evidence.
- Added a `decision_gates` ledger with `auto-fix`, `no-op`, and `ask-user` actions. Unresolved
  product/intent-changing `ask-user` findings now block `claim_status: proven`.
- Added `adapter_fixture_replay` and `surface_sync` fields. Reusable harness claims must say how adapter
  telemetry can be replayed and which skill/docs/templates/tests changed with proof commands.
- Corrected the runnable fixture inventory. The repo currently has four fixture directories under
  `templates/harness-eval-cases/fixtures/`; the older "only case-015" statement was rejected because it
  no longer matched the checkout.
- Rejected alternatives: importing the `no-mistakes` daemon/push/PR flow into `supergoal` (too broad for a
  reusable skill), trusting agent auto-detected commands as the whole gate (self-judging), and adding a
  runtime checklist without a mechanical contract test.

## Core Before/After Eval

- Decision: apply the useful `no-mistakes` gate lessons to normal GREENFIELD / DEBUG / LEGACY delivery,
  not only HARNESS-EVAL. The core improvement is a required Before/After Eval for non-trivial code
  projects: prove what was true before, what must be true after, which commands prove the delta, and what
  remains unproven.
- Added `reference/delivery-gate.md` and `templates/delivery-proof.md`. The gate requires `eval_intent`,
  `before_state`, `after_target`, `command_manifest`, `decision_gates`, `after_evidence`, and
  `residual_risk`.
- Updated `SKILL.md`, `reference/role-loop.md`, and `reference/plan-grounding.md` so Frame starts
  `delivery-proof.md`, Build preserves the before proof, and Verify records after evidence, resolved
  decision gates, and residual risk before claiming done.
- Made the before proof mode-specific: GREENFIELD proves absence or a red acceptance check; DEBUG
  reproduces the symptom; LEGACY/brownfield captures behavior to preserve before changing it.
- Updated README and README.ko so public docs describe the new project-delivery proof requirement.
- Rejected alternatives: a prose-only "remember to compare before/after" instruction, a final-answer-only
  checklist, and treating agent-discovered verification commands as sufficient without repo/evaluator
  command provenance.

## Delivery-Gate Effect Eval

- Decision: classify the first actual-code A/B as **partially proven**. On two controlled fixtures,
  exact pre-patch `HEAD` and the current patch both passed canonical hidden correctness checks, so a
  general correctness lift is not proven. The measured improvement is proof quality: current-patch arms
  produced complete `delivery-proof.md` ledgers for GREENFIELD and DEBUG work; pre-patch arms did not.
- Ran a controlled GREENFIELD fixture (`underspec-001-deepmerge`) and DEBUG fixture
  (`revfactory-case-002-async-race`) from clean visible-test sandboxes. Hidden tests were injected only
  into scoring copies after each arm completed.
- Results: `underspec-001-deepmerge` tied at 4/4 canonical hidden tests and full-suite pass on both arms;
  `async-race` tied at 5/5 canonical hidden tests and full-suite pass on both arms. Required
  Before/After Eval sections improved from 0/7 strict sections to 7/7 on both current-patch arms.
- Runtime caveat: the global installed skill copies under `.agents`, `.codex`, and `.claude` are plain
  directories, not symlinks, and did not contain the new delivery-gate wording during the eval. Direct use
  of this repo path gets the improvement; normal global skill invocation will not until those copies are
  synced.
- Rejected claim: "the patch improves code correctness generally." The current evidence supports
  "the patch improves auditable proof quality without hurting correctness on two fixtures."

## Hardest Default Coding A/B

- Decision: make the default coding HARNESS-EVAL pair the hardest existing runnable two-case set:
  `revfactory-case-002-async-race/` plus `revfactory-case-003-refactoring/`. This covers one hard
  DEBUG/concurrency hidden-fail case and one LEGACY/brownfield preservation case whose hidden suite catches
  behavior drift.
- Added the default pair and tie rule to `reference/harness-eval.md`, `templates/harness-eval-case.yaml`,
  `templates/harness-eval-result.json`, and `templates/harness-eval-report.md`.
- Rejected alternatives: using `underspec-001-deepmerge/` or `underspec-002-csvline/` as the coding
  default (they are latent-correctness probes, not default difficulty), pretending spec-only expert cases
  are runnable, or claiming a stronger harness win when both runnable default cases tie.
- Required result: if both default cases tie, report `Not proven`, record the runnable-corpus ceiling, and
  require authored expert runnable fixtures before claiming a stronger win.
- Effect eval: `docs/experiments/2026-06-28-supergoal-hardest-default-coding-ab/report.md` proves the
  default-selection improvement and shows no hidden-test regression on the two selected real code tasks.
  It does not prove an actual code-correctness lift because pre-default and post-default arms both passed
  all hidden-inclusive checks.

## Source basis

- Official project page: `https://code-as-harness.github.io/code-as-harness-webpage/`
- Paper: `https://arxiv.org/abs/2605.18747`
- `no-mistakes` source snapshot: `https://github.com/kunchenguid/no-mistakes` at
  `87b2abf78888d8af738903415f5f4b58e61e2396`
- OpenAI Codex docs: skills package task-specific workflows with instructions/resources/scripts; AGENTS.md
  is the repo-scoped durable guidance surface; subagents are useful for explicit parallel work but add cost.

## Verification

- `node --check templates/harness-eval-gate.mjs` passed.
- `node templates/harness-eval-gate.mjs templates/harness-eval-result.json` passed.
- `bash tests/delivery-gate-contract.test.sh` passed: 23 passed, 0 failed.
- `bash tests/workflow-contract.test.sh` passed: 16 passed, 0 failed.
- `bash tests/role-loop-contract.test.sh` passed: 17 passed, 0 failed.
- `bash tests/harness-eval-contract.test.sh` passed: 170 passed, 0 failed.
- `npm test` with hidden scoring copies passed for both controlled current-patch fixtures:
  `docs/experiments/2026-06-28-supergoal-delivery-gate-effect/raw/iteration2-*current-patch-score.log`.
- Hardest-default actual-code rerun passed hidden-inclusive scoring on all four arms:
  `docs/experiments/2026-06-28-supergoal-hardest-default-coding-ab/raw/*-score.log`.
- `git diff --check` passed.
- `bash tests/run-all.sh` passed.
