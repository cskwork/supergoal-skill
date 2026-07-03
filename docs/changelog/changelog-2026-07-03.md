# Changelog 2026-07-03

## Public DeepSWE harness A/B pilot

Decision: record the first public-source harness A/B attempt as invalid for paired correctness.

Why: the user asked for a meaningful public open-source issue/feature benchmark instead of private LMS
code or synthetic local fixtures. `happy-dom-abort-pending-body-reads` gave a real TypeScript bugfix with
independent DeepSWE hidden tests, but the harness arm was manually interrupted after running longer than
baseline. That makes the harness verifier score diagnostic only, not a clean paired correctness result.

Result:

- Baseline: DeepSWE `reward=0`, `f2p=1/14`, `p2p=165/165`, `partial=0.9273743017`, `176,591` tokens,
  `328s`.
- Harness diagnostic partial patch: DeepSWE `reward=0`, `f2p=1/14`, `p2p=165/165`,
  `partial=0.9273743017`, `213,917` tokens, `589s` before manual interruption.
- Correctness lift: not valid to claim because the harness arm did not complete and no fixed timeout was
  declared before execution.

Follow-up contract change:

- `happy-dom-abort-pending-body-reads` is recorded as the first public DeepSWE setup/smoke task in
  `templates/harness-eval-external/deepswe/task-set.yaml` and `reference/harness-eval.md`.
- Reason: it is a real open-source TypeScript bugfix that can be replayed through public DeepSWE verifier
  artifacts, but it is not enough to prove effectiveness after a completed run saturated both arms.
- Guardrail: the default only counts under a predeclared stop policy. Manual post-hoc interruption after
  observing elapsed time invalidates paired correctness; the artifact can be diagnostic only.

Rejected alternatives:

- Claim the `u3` authz-cache result as a harness win: rejected because it only proves hidden-test
  discrimination, not paired with/without lift.
- Use the Cliffy config-file task as the primary result: rejected because both arms exceeded the low-turn
  budget and produced no patch under the Claude adapter.
- Score only committed `HEAD`: rejected for this host Codex run because the inner workspace sandbox made
  `.git` read-only. Both arms were instead scored from working-tree diffs, and the adapter caveat is
  recorded in the report.
- Treat a predeclared budget timeout and a manual interrupt as equivalent: rejected because benchmark
  comparability requires the stop/capture policy before the run starts.

Evidence: `docs/experiments/2026-07-03-deepswe-happy-dom-codex-ab/report.md`.

## DeepSWE full-cycle harness runner

Decision: turn the public DeepSWE lane from a manual checklist into an executable full-cycle runner.

Why: benchmark research says heterogeneous coding harnesses are only comparable under a fixed task,
runtime budget, patch extraction procedure, and evaluator. Manual interruption after observing runtime is
not a valid arm, and DeepSWE v1.1 grades committed repository code in a clean environment. The harness
needs to optimize for that scoring contract without seeing verifier internals.

What changed:

- `templates/harness-eval-external/deepswe/run-full-cycle.mjs` now runs baseline and harness serially
  through Pier, writes a predeclared stop-policy manifest, enforces an outer no-manual-interrupt timeout,
  defaults Codex to low reasoning effort for both arms, auto-uses Codex `auth.json` when no
  `OPENAI_API_KEY` is present, supplies the non-secret `chatgpt.com` egress allowlist hint required by
  that auth path, and records `summary.json`, `report.md`, logs, rewards, and patch artifacts.
- `prepare-supergoal-arm.mjs` now prepends a compact DeepSWE scoring contract: make repo code changes,
  preserve pass-to-pass behavior, run focused repo-native checks where feasible, avoid verifier/solution
  files, and commit final code when the environment permits.
- `reference/harness-eval.md`, `task-set.yaml`, and the external README now make the full-cycle runner
  the default executable path for public DeepSWE A/B runs; Happy DOM is smoke-only after the completed
  no-headroom result.
- The runner classifies completed ties with perfect baseline score as `not_proven_no_headroom`, so a
  saturated task is kept as full-cycle reliability evidence instead of being misread as a harness win.

Completed no-interrupt check:

- Run root: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress`.
- Baseline: completed, `reward=1`, `f2p=14/14`, `p2p=165/165`, `partial=1`, `$2.736928`, `531s`,
  patch `22,974` bytes.
- Harness: completed, `reward=1`, `f2p=14/14`, `p2p=165/165`, `partial=1`, `$3.091722`, `884s`,
  patch `15,707` bytes.
- Raw runner decision: `not_proven`; updated taxonomy classification: `not_proven_no_headroom`. This
  validates the no-interrupt public runner path, but it does not prove harness effectiveness because the
  baseline already hit the verifier ceiling.

Current scoring default:

- `etree-xml-diff-patch` is now the default DeepSWE public effectiveness task in the runner, manifest,
  case template, result template, README, and harness-eval reference.
- Reason: the task is a larger Go feature request covering XML diff, patch, reverse patch, three-way
  merge, and summaries. It has a better chance of showing baseline headroom than the saturated Happy DOM
  smoke task.
- Guardrail: `etree-xml-diff-patch` is a scoring candidate, not a proven discriminator yet. A completed
  paired run still needs baseline headroom or a nonzero harness-vs-baseline reward/partial-reward delta.

Rejected alternatives:

- Keep using hand-run Pier/Codex commands: rejected because the user explicitly required no manual
  interruption and a full cycle.
- Claim the prompt-prefix change is a proven benchmark improvement: rejected until a completed paired run
  shows positive DeepSWE reward or partial-reward delta.
- Keep Happy DOM as the scoring default: rejected because the no-interrupt run produced the same perfect
  score for baseline and harness, so it cannot show a meaningful effectiveness difference under the
  current low-effort Codex setting.
- Leave Codex at Pier's high-effort adapter default: rejected because the requested test needs a harder,
  lower-cost setting where harness behavior can create a meaningful difference.
- Assume `OPENAI_API_KEY` exists in local Pier runs: rejected after the first full-cycle Codex attempt
  produced paired 401 errors while `~/.codex/auth.json` was present.
- Pass auth.json without extending Pier's filtered egress allowlist: rejected after the second attempt
  reached ChatGPT auth transport but the proxy returned 403 for `chatgpt.com`.
- Let the runner delete arbitrary output roots with `--force`: rejected; it refuses anything outside
  `/tmp` or `docs/experiments`.

## Public docs synced to lean loop + production-adoption plan

Decision: update README EN/KO, landing copy, SUGGESTIONS, and older design/research docs so the public
surfaces follow the live `SKILL.md` contract.

Why: `SKILL.md` and `reference/role-loop.md` now make Build -> Forced Verify the mandatory core.
Critic/Fixer remains available, but only as opt-in escalation for under-specified or latent-correctness
work. The public README and landing still described independent Critic -> Fixer as the normal path,
which overstated role separation and hid the measured lean-out result.

What changed:

- `README.md` and `README.ko.md` now describe forced whole-spec verification as the default, with
  Critic/Fixer as escalation. Korean README gained the optional Board/TUI section and the same install
  audit flow as English.
- `docs/index.html` now says visible green is not enough, shows Build -> Forced Verify in the route map
  and mode cards, and surfaces the 10-task production pilot plan as metrics-only.
- `SUGGESTIONS.md` now points to the production-adoption plan first and keeps the synthetic confirmatory
  A/B as a follow-up only if production evidence cannot answer the lean/no-critic question.
- `docs/DESIGN.md`, `docs/research-brief.md`, and `docs/harness-eval-explained.md` now carry status notes
  so historical research does not get mistaken for the live contract.

Rejected alternatives:

- Re-run or rewrite the whole historical design brief: rejected because it is an evidence record. Status
  notes preserve history while preventing stale routing guidance.
- Advertise Critic/Fixer as the main value proposition: rejected because the July eval says forced
  whole-spec verification is the active default for explicit-spec work.
- Put production run vaults in this public repo: rejected because the public docs only need date/mode/gap/gate
  metrics in the production-pilot ledger.

## Korean copy cleanup

Decision: replace translation-shaped Korean/English mixes in the Korean public surfaces.

Why: mixed Korean/English terms in the landing page and Korean docs sounded unnatural and unclear.

Rejected alternative: explain those terms inline. The docs are clearer when the awkward concepts are removed or
rewritten as concrete Korean actions.

Verification planned: run the contract test suite, docs whitespace checks, and local landing smoke check
after the docs patch.

## OmO/lazycodex parity improvements, tiers 1-3

Decision: adopt the directly portable OmO mechanics as `supergoal` contract changes: IntentGate routing,
four-axis HARNESS-EVAL accounting, paired McNemar/SNR statistics, completion-promise loop bounds,
resumable run state, and conditional adversarial plan attack.

Why: `supergoal` is a skill contract, not a runtime/model router. The portable value is better route
selection, proof accounting, bounded self-correction, and resume state; provider routing and custom edit
protocols belong outside the skill.

What changed:

- `SKILL.md` now classifies with IntentGate before the mode table and separates work category from
  capability refs.
- `reference/role-loop.md`, `reference/delivery-gate.md`, `templates/delivery-proof.md`, and
  `templates/run-state.json` now carry a completion promise, default 8-iteration Build/Verify cap, forced
  reflection at the cap, and resumable state fields.
- `reference/harness-eval.md`, `templates/harness-eval-case.yaml`, `templates/harness-eval-result.json`,
  `templates/harness-eval-report.md`, `templates/harness-eval-gate.mjs`, and
  `templates/harness-eval-stats.mjs` now cover the four A/B axes, routing probes, McNemar, and SNR
  filtering.
- `README.md` and `README.ko.md` were synced so public docs mention IntentGate, run state, and the
  four-axis HARNESS-EVAL standard.

Rejected alternatives:

- Port OmO model/provider routing: rejected because this skill runs inside the host agent and does not own
  the model router.
- Port hash-anchored editing: rejected because edit semantics are owned by the host tooling; the skill can
  require post-edit verification but not replace the editor.
- Turn adversarial plan attack on for every task: rejected because previous `supergoal` evals showed
  equal-compute forced verification is leaner on explicit-spec work.
- Use overlapping confidence intervals as the A/B winner gate: rejected because paired tests are the
  correct fit for same-task binary outcomes.

## Low-effort HARNESS-EVAL discriminator case

Decision: add `underspec-003-authz-cache` as a runnable low-effort discriminator for harness A/B tests.

Why: the existing hard async-race case ceilings out under low effort: both baseline and harness can pass,
while the harness pays roughly 4x token and wall-clock cost. A better signal needs a latent correctness
surface where visible-green is easy but missing verification creates a real security/concurrency bug.

What changed:

- `docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs` now supports
  `SG_EVAL_CASE=u3`.
- `templates/harness-eval-cases/fixtures/underspec-003-authz-cache/` contains the executable starter,
  visible tests, and hidden tests for an authorization decision cache.
- `templates/harness-eval-cases/authored/authored-underspec-003-authz-cache.yaml` records the authored
  case spec.
- `reference/harness-eval.md` documents the low-effort command and keeps `u3` out of the default
  RevFactory coding pair.

Rejected alternatives:

- Make `revfactory-case-002` harder: rejected because the current baseline already solved it, so this
  would tune around one result rather than add a clearer signal.
- Use the expert LSP script: rejected because it mostly measures large-generation stamina and high cost.
- Only lower model effort: rejected because lowering effort without a discriminating fixture can still
  produce a no-signal tie.

Proof commands:

- `SG_EVAL_VALIDATE=1 SG_EVAL_CASE=u3 SG_EVAL_RUN_ROOT=/tmp/sg-eval-u3-validate node docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs`
- `bash tests/harness-eval-contract.test.sh`

## QA regression scope and requirement trace hardening

Decision: implement the QA regression-scope plan as a tiered contract: shared code/state changes past
`very easy` capture neighbor characterization baselines, non-trivial code runs close a bidirectional
Requirement Trace, and DEBUG/prod proxy checks record reproduction fidelity.

Why: the existing loop proved the changed target well, but adjacent behavior and user requirement
coverage were still easy to under-map. The fix is not more always-on ceremony; it is conditional evidence
where the risk appears.

What changed:

- `reference/qa.md` now exposes a lean code-change scenario stencil and a characterization baseline path
  for neighboring behavior.
- `reference/role-loop.md`, `reference/delivery-gate.md`, and `SKILL.md` now require RTM closure,
  neighbor baseline reruns, fresh-context regression verification, and non-exact reproduction fidelity.
- `templates/delivery-proof.md` and `templates/run-state.json` now carry Requirement Trace,
  Neighbor Baseline, Reproduction Fidelity, and `regression_ledger` fields.
- `templates/commit-gate.sh` now blocks unmet Requirement Trace rows, non-clean Backward-trace scope, and
  non-exact reproduction without residual risk plus post-deploy confirmation.
- Contract tests now assert the new anchors, and `tests/gate-scenarios.test.sh` exercises open RTM,
  orphan backward trace, exact reproduction, and synthetic-representative proxy cases.

Rejected alternatives:

- Turn the Impact Matrix into the default loop for every task: rejected because prior evals favored the
  lean forced-verification path for explicit work.
- Treat characterization snapshots as correctness proof: rejected because they can preserve a known bug;
  they are drift signals only.
- Fully automate reverse trace from `git diff`: rejected for this pass because proof templates need the
  contract first; attested `Backward-trace: clean` is the minimal reliable gate.

## Critic requirement-threshold guard

Decision: add an explicit requirement threshold for forced verification and critic escalation: inferred
behaviors are classified as `must`, `should`, or `ask-user`; only grounded `must` behavior becomes a
generated failing test.

Why: the `u1` deepMerge capability run showed a concrete overreach failure. The single-pass no-skill arm
passed hidden tests on 2/3 seeds (`3/4`, `4/4`, `4/4`), while both four-pass arms failed the same hidden
null/undefined-source check on all seeds (`3/4`, `3/4`, `3/4`). The multi-pass drafts converged on
throwing `TypeError` for absent sources, even though the evaluator ground truth treated absent source as
a no-op. More passes did not improve capability here; they made ambiguous degenerate-input semantics more
strict than the hidden contract.

What changed:

- `SKILL.md`, `reference/role-loop.md`, and `agents/code-reviewer.md` now say ambiguous or
  product-changing semantics are `ask-user` decision gates, not generated RED tests.
- `agents/executor.md` now tells the fixer to stop and report a decision gate if a critic-authored test
  encodes an ask-user choice or hardens semantics not required by spec or safety.
- `templates/surfaced-requirements.md` now records only classified `must` requirements; ambiguous
  candidates go to decision gates.
- `tests/role-loop-contract.test.sh` now asserts the requirement threshold, stricter-semantics guard, and
  fixer stop behavior.

Rejected alternatives:

- Special-case `deepMerge` null handling in the eval: rejected because the defect is skill behavior, not
  the fixture implementation.
- Treat every degenerate input as a mandatory generated test: rejected because that caused the observed
  false-green path when the prompt left multiple reasonable semantics open.
- Drop critic escalation entirely: rejected because the role loop still helps on latent correctness; the
  fix is to classify requirements before turning them into REDs.

Proof commands:

- `SG_EVAL_VALIDATE=1 SG_EVAL_CASE=u1 SG_EVAL_RUN_ROOT=/tmp/sg-meaningful-skill-eval-LFyTmG/validate-u1-3way node /tmp/sg-meaningful-skill-eval-LFyTmG/docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs`
- `SG_EVAL_CASE=u1 SG_EVAL_BASELINE_SEEDS=3 SG_EVAL_HARNESS_SEEDS=0 SG_EVAL_NAIVE_SEEDS=0 SG_EVAL_RESULT_SUFFIX=-baseline-headroom SG_EVAL_RUN_ROOT=/tmp/sg-meaningful-skill-eval-LFyTmG/run-u1-baseline-headroom SG_EVAL_MODEL=gpt-5.5 SG_EVAL_EFFORT=low node /tmp/sg-meaningful-skill-eval-LFyTmG/docs/experiments/2026-06-07-harness-eval-underspecified-n3/run.mjs`
- `SG_EVAL_CASE=u1 SG_EVAL_BASELINE_SEEDS=0 SG_EVAL_HARNESS_SEEDS=3 SG_EVAL_NAIVE_SEEDS=0 SG_EVAL_RESULT_SUFFIX=-harness-n3 SG_EVAL_RUN_ROOT=/tmp/sg-meaningful-skill-eval-LFyTmG/run-u1-harness-n3 SG_EVAL_MODEL=gpt-5.5 SG_EVAL_EFFORT=low node /tmp/sg-meaningful-skill-eval-LFyTmG/docs/experiments/2026-06-07-harness-eval-underspecified-n3/run.mjs`
- `SG_EVAL_CASE=u1 SG_EVAL_BASELINE_SEEDS=0 SG_EVAL_HARNESS_SEEDS=0 SG_EVAL_NAIVE_SEEDS=3 SG_EVAL_RESULT_SUFFIX=-naive-n3 SG_EVAL_RUN_ROOT=/tmp/sg-meaningful-skill-eval-LFyTmG/run-u1-naive-n3 SG_EVAL_MODEL=gpt-5.5 SG_EVAL_EFFORT=low node /tmp/sg-meaningful-skill-eval-LFyTmG/docs/experiments/2026-06-07-harness-eval-underspecified-n3/run.mjs`

## Equal-compute improve-pass role loop

Decision: make the default GREENFIELD/DEBUG/LEGACY core
`Build -> Improve full spec -> Improve edge cases -> Final Verify`, with each non-trivial role dispatched
fresh-context by default. Keep Critic/Fixer as optional adversarial escalation, not the normal engine.

Why: after the requirement-threshold update, the skill arm improved against single-pass baseline but still
lost to the no-skill equal-compute loop. Updated skill seeds scored hidden `3/4`, `3/4`, `4/4` (avg 3.3,
false-green count 2); single-pass baseline scored `3/4`, `2/4`, `2/4` (avg 2.3, false-green count 3);
no-skill equal-compute scored `4/4`, `3/4`, `4/4` (avg 3.7, false-green count 1). The likely useful
variable is not critic ritual; it is spending comparable compute on a full-spec improvement pass, an
edge-case improvement pass, and fresh final verification.

What changed:

- `SKILL.md` now states the equal-compute improve-pass loop as the default mandatory core.
- `reference/role-loop.md` now defines fresh-context Build, full-spec improve, edge-case improve, and
  Final Verify/QA roles, with Critic/Fixer retained as optional under-specified escalation.
- `agents/executor.md` now supports explicit full-spec and edge-case improve modes.
- `agents/code-reviewer.md` now labels the critic as optional escalation, and `agents/qa-auditor.md`
  verifies after the improve passes with an adversarial stance.
- `tests/role-loop-contract.test.sh` now asserts the new loop, fresh improve roles, production/domain
  user-feedback gate, and conservative no-user default.

Rejected alternatives:

- Keep Critic/Fixer as the primary default loop: rejected because the latest retest still underperformed
  equal-compute no-skill on hidden tests.
- Make all ambiguity conservative by default: rejected because production/source-code domain behavior may
  need user feedback instead of an agent guess.
- Remove adversarial critic/QA: rejected because fresh adversarial verification is still useful; the
  change is where it sits in the loop and how it handles ambiguous requirements.

Proof commands:

- `rtk proxy bash tests/role-loop-contract.test.sh`
- `rtk proxy bash tests/run-all.sh`
