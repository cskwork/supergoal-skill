# HARNESS-EVAL - test whether a harness helps

Use when the user asks to test harness effectiveness, compare with/without harness, benchmark an agent workflow, or prove a generated harness improves outcomes.

Sections (jump, don't rescan): Contract | Runtime fit | Pipeline | Cases | Pick a discriminating
regime | Validate the fixture discriminates | Execution | Reject.

## Contract

HARNESS-EVAL compares the same task with and without the harness. It measures evidence, not confidence. If the evidence is weak, report `Not proven`.

Required controls:

- same repo snapshot
- isolated worktrees or equivalent clean sandboxes
- identical benchmark task statement; if the harness condition is delivered as a prompt prefix, preserve
  the original task body byte-for-byte and record both the base-task hash and the harness-source hashes
- baseline gets no harness references
- harness run gets only the approved harness, with eval-internal files stripped from the copied
  reference (case definitions, hidden checks, rubric, scorer). The harness arm must never be able to
  read the cases or hidden tests it is being judged on.
- runtime portability: pick the runtime adapter by PREFLIGHTING it on the host - a trivial edit+test
  pass in a throwaway sandbox - and FALL BACK to another available CLI when the preferred one is missing
  or crashes; record host OS, the chosen adapter, and every adapter's preflight result. Never assume one
  CLI runs: `codex exec --sandbox workspace-write` crashes instantly (0 tokens) on some Windows hosts.
  Use the reusable runner `templates/harness-eval-runner.mjs` instead of hand-rolling a per-CLI driver.
- adversarial verification runs in the harness's native runtime profile (see Runtime fit); never
  force a multi-agent verifier/repair loop inside a single non-interactive process
- machine checks before subjective scoring, recorded per individual check (not one all-or-nothing pass)
- scoped evidence bundle: every machine check states what it proves, what it does not prove, confidence,
  and the artifact path or command output behind the claim
- replayable trajectory telemetry: per arm record artifact root, logs, commands, edited files,
  permissions/approvals, turns completed, exit code, crash, and context-exhaustion status
- explicit eval intent: record the user's goal, constraints, tradeoffs, and ruled-out approaches as a
  first-class input. Do not infer intent from the diff after the run; reviewers need the objective, not
  just the files changed.
- deterministic command manifest: record the exact test/lint/build/format/smoke/hidden commands, their
  source (`frozen_repo`, `evaluator_owned`, or `arm_detected`), and which arm used them. Repo-owned or
  evaluator-owned commands are the baseline; arm-detected commands are supplemental evidence, not the
  whole gate.
- decision-gate ledger: classify findings as `auto-fix`, `no-op`, or `ask-user`; product/intent-changing
  findings are `ask-user` and must carry the human decision before a proven claim.
- adapter fixture replay: when claiming a reusable harness improvement, record agent/CLI event fixtures,
  redaction/scrubbing status, the adapter event schema, and the replay command. If the adapter wire format
  changes, re-record fixtures before trusting parser-derived tokens, tool calls, crashes, or turns.
- harness mutation contract: every adopt/revise/reject recommendation names the intended behavior delta,
  safety envelope, rollback path, proof command, and rejected alternatives
- a reachable RevFactory-style 100-point quality score before final comparison: a fully correct
  solution must be able to reach >=80, and each dimension stays individually reachable to 10
- blind or label-swapped grading
- cost, time, tool count, and turn-completion recorded; a crash or context-window/timeout failure is a
  recorded LOSS for that arm, never a silent zero
- stop policy is declared before launch. Manual interruption after observing progress invalidates paired
  correctness; a predeclared budget timeout may be scored only when both arms use the same cutoff and
  patch-capture rule.
- four-axis accounting for every accepted harness change: task success/correctness, token/cost,
  wall-clock speed, and routing accuracy. If an axis is not applicable, record why; do not hide it.
- routing accuracy for skill/router changes: at least 20 should-trigger / should-not-trigger near-miss
  prompts, 3 trials each, with a 60/40 train/test split. Use held-out trigger accuracy for adoption.
- token/time capture source: record `tokens`/`total_tokens`, `duration_ms`, tool calls, and the adapter or
  task-notification event that supplied them. Parser-derived values need adapter fixture replay.
- concurrency + retry discipline: serialize nested agent passes by default (one isolated process is
  host-proven clean); parallelize only after validating the host's concurrency ceiling, since concurrent
  nested agents contend for a rate-limit ceiling and crash. Retry a transient (rate-limit) crash with
  backoff and record the reason + retry count; a crash surviving its retries stays a recorded loss.
- role fidelity: the harness arm must exercise the ACTUAL shipped skill role files (SKILL.md +
  reference/role-loop.md + agents/*.md) or generate its role prompts FROM them and record the source. A
  hand-paraphrased inline critic/fixer/verifier prompt can silently drift from the shipped role text, so
  it measures a paraphrase, not the skill.

Required outcome accounting:

- bug-catch matrix: planted bugs, hidden checks, and discovered real bugs by arm
- false-GREEN count: self-reported ship/green while machine or ground-truth checks still fail
- Visible tests only is false-GREEN when acceptance criteria imply protocol, state, security, scope, parser, concurrency, or error-recovery edges.
- regression protection: permanent tests added for fixed REDs, or explicit exception
- verification strength: covered acceptance surface, uncovered surface, and residual risk by arm
- trajectory efficiency: correctness and verification strength per cost/time/tool-call unit
- quality score: feature completeness, test coverage, code quality, error handling, efficiency, correctness, architecture, extensibility, documentation, and dev environment
- routing accuracy: trigger rate on should-trigger prompts, non-trigger rate on should-not-trigger
  prompts, near-miss failures, train/test split, and held-out score
- overclaim guard: audit trail alone is not a win unless it changes shipped correctness or quality

## Runtime fit (match the eval to how the harness actually runs)

The harness's value is fanning work to fresh isolated contexts. Evaluate it in the profile it will
actually run in, or the result is an artifact of the wrong setup:

- **Orchestrated runtime** (real subagent dispatch + interactive human): run the full pipeline below,
  including the separate adversarial verifier and repair loop.
- **Single non-interactive process** (e.g. `codex exec`, CI, one-shot eval): the harness should route
  to its INLINE profile. Do NOT force the multi-agent verifier/committee/repair ceremony into one
  context window - it exhausts the window and the arm crashes (observed: harness arm completed 0 turns,
  exit 1, tokens recorded 0, 2.15x baseline wall-clock). Score the harness on its INLINE behavior:
  load-only-the-contract, minimal targeted diffs, one scoped sandbox-safe verify pass, stop on green.
- A crashed / context-exhausted / timed-out arm is a recorded LOSS, not a missing data point. Capture
  `turns_completed`, `exit_code`, and a `crashed` flag; ensure token/tool-call parsing matches the
  adapter's actual event names (codex-exec emits `command_execution`, not `function_call`).
- Preflight the runtime before spending a real eval call: run one throwaway edit+test pass and confirm
  the adapter did not crash AND actually edited the stub; if the preferred CLI fails or is absent, fall
  back to another available one and record host OS, chosen adapter, and each preflight result.
  `templates/harness-eval-runner.mjs` ships the adapter selection + fallback + crash-retry so an
  experiment imports one driver instead of re-implementing a CLI-specific spawn loop.

## Pipeline

`Scope -> Cases -> Routing Probe -> Baseline Run -> Harness Run -> Machine Checks -> Quality Score -> Blind Grade -> Compare -> Report -> Persist`

## Cases

Use `templates/harness-eval-case.yaml` for a blank case. The RevFactory seed files in
`templates/harness-eval-cases/` are SPECS ONLY (task, acceptance, hidden-check descriptions, rubric) -
they are NOT runnable. Before a case can be evaluated it needs an authored fixture: a stub source the
agent edits, visible tests, and hidden tests that encode the bug-catch matrix. Runnable fixtures currently
live under `templates/harness-eval-cases/fixtures/`:

- `revfactory-case-002-async-race/`
- `revfactory-case-003-refactoring/`
- `underspec-001-deepmerge/`
- `underspec-002-csvline/`
- `underspec-003-authz-cache/`

Each fixture must remain validated against starter/reference/lazy implementations before use (see the
fixture README for the `SG_EVAL_VALIDATE` replay commands). Specs without a fixture must have one authored
before they can be evaluated.

### Default coding A/B pair (hardest existing runnable pair)

When the user asks for a coding harness eval without naming cases, run exactly this two-case default:

1. `revfactory-case-002-async-race/` (`revfactory-case-002-bug-fix.yaml`) - DEBUG/concurrency, hard,
   visible-pass hidden-fail starter.
2. `revfactory-case-003-refactoring/` (`revfactory-case-003-refactoring.yaml`) - LEGACY/brownfield
   preservation, medium fixture whose hidden suite catches behavior drift.

Do not substitute `underspec-001-deepmerge/`, `underspec-002-csvline/`, or
`underspec-003-authz-cache/` for this default; those are latent-correctness probes, not the default
coding difficulty. If both default cases tie, report
`Not proven`, record the runnable-corpus ceiling, and require authored expert runnable fixtures before
claiming a stronger harness win.

### Public external benchmark mode (DeepSWE-style)

When private/local fixtures are ceilinged out, not committable, or too synthetic for the user's question,
switch to a public benchmark task instead of inventing another local case. Use
`templates/harness-eval-external/deepswe/task-set.yaml` for the first approved public task set and
`templates/harness-eval-external/deepswe/run-full-cycle.mjs` as the default executable runner. That
runner calls `prepare-supergoal-arm.mjs`, runs baseline then harness serially through Pier, enforces the
declared stop policy, applies the same low Codex reasoning effort to both arms by default, auto-uses
Codex auth.json when no `OPENAI_API_KEY` is present, records the required non-secret `chatgpt.com`
egress hint for that auth mode, and writes a manifest/summary/report without manual interruption.

Required external-task provenance:

- benchmark name, public URL, repo URL, and immutable benchmark ref
- upstream source repo and base commit
- task id, task URL, language, category, and current baseline headroom status
- declared stop policy: timeout, valid outcomes, whether patch capture after budget timeout/error is
  scored, and why manual interruption is invalid
- verifier provenance and artifact paths, especially `verifier/reward.json`, `verifier/ctrf.json`,
  `verifier/test-stdout.txt`, `verifier/run.log`, and `model.patch`
- original task body hash for the harness arm and source hashes for the approved harness reference
- exact runner, agent, model, seed policy, token source, duration source, and environment

Forced default public SWE suite:

- For difficult SWE tasks, harness-effectiveness claims, or "does Supergoal help on coding" questions
  without a named task, run the DeepSWE three-task suite by default: `etree-xml-diff-patch`,
  `cliffy-config-file-parsing`, and `yjs-map-conflict-detection`.
- Use `templates/harness-eval-external/deepswe/run-default-suite.mjs` unless the user explicitly asks for
  a single named task. The suite runner serially invokes the full-cycle runner once per task and writes
  `suite-summary.json` plus `suite-report.md`.
- A one-run-per-task suite is directional only. Treat outcomes as mixed evidence unless repeated seeds
  support the same direction. Do not call a 1-task result a default DeepSWE eval.

Default public scoring candidate:

- `etree-xml-diff-patch` from DeepSWE v1.1: upstream `https://github.com/beevik/etree`, base commit
  `4032e04c8f2e2f35e43ce5d772fcef14a5df4d74`, Go feature request. Use it first for public
  effectiveness scoring because it requires XML diff, patch, reverse patch, three-way merge, and
  summaries. It is a candidate, not proof: a completed paired run still has to show baseline headroom or
  a nonzero harness-vs-baseline delta.
- `happy-dom-abort-pending-body-reads` is smoke/reliability only under current Codex `gpt-5.5` low
  settings. The no-interrupt full-cycle run completed both arms and saturated the verifier:
  baseline and harness both reached `reward=1`, `f2p=14/14`, `p2p=165/165`. Do not use this task as the
  default scoring test while it has no baseline headroom.
- `cliffy-config-file-parsing` is now a secondary broad feature task, not the default low-effort public
  pilot, because the earlier low-turn Claude attempt exceeded budget and produced no patch.

External A/B scoring:

- correctness: pass rate from DeepSWE `reward.json`; report absolute percentage-point lift and relative
  percent lift separately
- partial correctness: pass fraction or failed-test count from `reward.json`/`ctrf.json` when available
- token/cost and wall-clock: Pier or adapter trajectory metadata
- routing accuracy: only applicable when the change affects supergoal routing; otherwise link the
  separate 20-prompt routing probe
- process outcome: `completed`, `budget_timeout`, `error`, or `invalid_manual_interrupt`. Only
  `completed` and predeclared `budget_timeout` outcomes are usable for paired correctness; manual
  interruption is diagnostic only.
- headroom: if baseline and harness both complete with perfect public verifier score, report
  `not_proven_no_headroom`, keep the artifact as a valid full-cycle check, and add harder held-out public
  tasks before making an effectiveness claim. A scoring/effectiveness run must not count a no-headroom
  task as signal.

Do not claim a public benchmark win from `u3`. The authz-cache `u3` result only proves hidden-test
discrimination: starter/lazy can pass visible 3/3 while hidden behavior fails 1/8, and the reference can
pass hidden 8/8. It is not a harness improvement unless a paired with/without run shows a pass-rate or
quality lift.

Reusable seeded case specs (the approved corpus - pick from here, never invent new cases):

- `revfactory-case-001-rest-api.yaml`
- `revfactory-case-002-bug-fix.yaml`
- `revfactory-case-003-refactoring.yaml`
- `revfactory-case-004-documentation.yaml`
- `revfactory-case-005-complex.yaml`
- `revfactory-case-006-research.yaml`
- `revfactory-case-007-interpreter.yaml`
- `revfactory-case-008-microservice.yaml`
- `revfactory-case-009-sql-engine.yaml`
- `revfactory-case-010-crdt.yaml`
- `revfactory-case-011-raft-kv.yaml`
- `revfactory-case-012-spreadsheet.yaml`
- `revfactory-case-013-bytecode-vm.yaml`
- `revfactory-case-014-event-sourcing.yaml`
- `revfactory-case-015-lsp.yaml`

Default to the validated RevFactory corpus in `templates/harness-eval-cases/` for comparable, citable
results; do NOT invent throwaway easy/medium cases. Note that underspecified tasks whose implicit
requirements are PUBLIC domain knowledge also ceiling out - a strong baseline fills them unprompted
(evidence: 2026-06-07 csv/lru/semver, 14/14 both arms, `docs/experiments/2026-06-07-harness-eval-underspecified/`).
The one sanctioned reason to author a fresh fixture is probing the under-specified frontier with a
LATENT-CORRECTNESS case (see "Pick a discriminating regime" + "Validate the fixture discriminates"); label
it authored, not corpus, and never run it until the 3-way discrimination check passes.

Use the hard/expert tier only - the cases that discriminate:

- expert (use first): `revfactory-case-007-interpreter` .. `-015-lsp` (007 interpreter, 008 microservice,
  009 sql-engine, 010 crdt, 011 raft-kv, 012 spreadsheet, 013 bytecode-vm, 014 event-sourcing, 015 lsp)
- hard: `revfactory-case-002-bug-fix`, `revfactory-case-005-complex`

Pilot on one runnable hard/expert or latent-correctness case (n=1 is `Not proven` by construction -
direction only), then scale to 8-15 expert/hard cases for a proven claim. A proven significance claim
also needs n >= 6 seeds per arm (see "Pick a discriminating regime" for why n < 6 is directional only).
Both arms passing everything is inconclusive (ceiling), not a win or a tie.

## Pick a discriminating regime (lever = spec-completeness x baseline strength, not "difficulty")

The harness's only correctness lever is surfacing requirements ABSENT from the prompt. On an
explicit-spec task a capable baseline already passes - expect a TIE at 2-3x cost regardless of tier
(observed 2026-06-07: medium case-003 14/14=14/14, hard case-002 8/8=8/8 @ gpt-5.5/low; expert case-015
11/12=11/12 @ spark/high). A nominally "hard" case a strong model aces is still a ceiling. To find signal:

- Make the baseline actually struggle: weaker model and/or higher reasoning effort, OR a genuinely
  under-specified task - not just a higher difficulty label.
- Under-specified surfaces a gap vs a 1-PASS baseline only when the unstated requirement is
  LATENT-CORRECTNESS a literal pass OVERLOOKS (security/robustness edge), not canonical textbook behavior:
  deepMerge prototype-pollution showed a gap (baseline shipped the vuln 2/3 as a false-GREEN), CSV
  quote-handling tied (canonical, baseline does it unprompted). That gap is real value vs a one-shot
  default (the skill forces the verification that catches the vuln), but the active ingredient is the
  extra passes, not role-separation: an equal-compute naive loop (build+3 review, NO skill) scored 4/4 vs
  the role-loop's 3.3/4 (`docs/experiments/2026-06-07-harness-eval-underspecified-n3/`). So the skill
  helps vs not-invoking-it, not vs equal compute (see compute-confound below). Ambiguous choices are NOT
  fair hidden checks - test only what one reasonable reading MUST do.
- If the default hard case ceilings out under low effort, run the authored low-effort discriminator:
  `SG_EVAL_CASE=u3 SG_EVAL_EFFORT=low SG_EVAL_BASELINE_SEEDS=1 SG_EVAL_HARNESS_SEEDS=1 node docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs`.
  This authorization-cache case is intentionally security/concurrency-heavy: starter and lazy
  implementations pass visible 3/3 but hidden 1/8, while the reference implementation passes hidden
  8/8. Treat n=1 as directional only; scale to n >= 6 before claiming statistical proof.
- Sample size: n >= 3 per arm is a DIRECTIONAL pilot floor - a +-1-test delta at n=1 is noise, not a win
  (case-015 read harness 8/9 vs baseline 7/9 one run and an exact tie the next). A PROVEN significance
  claim needs n >= 6 per arm, because the mandated sign-flip permutation test's minimum two-sided p is
  2/2^n (n=3 -> 0.25 and n=5 -> 0.0625 cannot reach 0.05; n=6 -> 0.03125 is the first that can). So n < 6
  is directional only. Always report the per-seed vector, not just the mean. The decision rule (BCa 95%
  CI entirely > 0 AND sign-flip permutation p < 0.05) lives in
  `docs/experiments/2026-07-01-roleloop-coverage-fix-claude-ab/stats.mjs`.
- For binary pass/fail A/B, also run paired McNemar on the SAME tasks. Filter no-signal matched pairs
  (both pass or both fail) for the McNemar table and report `discordant_baseline_only`,
  `discordant_harness_only`, exact two-sided `p`, and the removed matched count. Use
  `templates/harness-eval-stats.mjs` for the portable calculation. Do not use overlapping confidence
  intervals as a winner gate; CI overlap can be visually useful but is not the hypothesis test.
- Compute confound - run BOTH baselines and SAY which win you claim; they answer different questions:
  (a) vs a 1-pass baseline = "does invoking the skill beat NOT invoking it?" Forcing useful verification
  compute IS legitimate value - a one-shot is the realistic default, and on u1 the skill caught a
  prototype-pollution vuln the one-shot shipped as a false-GREEN (3.3 vs 2.3). (b) vs an equal-compute
  naive arm (build+N-review, no skill) = "is the skill's STRUCTURE the active ingredient, or just the
  extra passes?" 2026-06-07: the skill beat (a) but NOT (b) (naive 4/4 >= role-loop 3.3/4), so the value
  was the forced passes, not role-separation - useful, but the mechanism could be leaner. Report the win
  as (a) "skill vs default" or (b) "mechanism vs compute"; never imply (b) when you only showed (a).
- Harness arm design: default to the shipped skill's current forced-verification core:
  Build -> Improve full spec -> Improve edge cases -> Final Verify. Use a critic/fixer loop only when
  the experiment is explicitly testing the surface-hidden-requirements lever; the critic is that lever.
  Use single-pass skill-ref to A/B the SKILL text itself. State which, and keep both arms in the same
  runtime profile.

## Validate the fixture discriminates BEFORE spending compute

A fixture proves nothing unless it can tell solutions apart. Before running any arm, confirm three ways:
1. the stub/starter fails the intended checks (greenfield: all fail; bug-fix: visible pass + planted
   hidden fail; refactor: starter passes ALL, so the case measures preservation),
2. a reference CORRECT impl passes all visible + hidden,
3. a lazy/naive impl (shallow merge, `split(',')`, global-lock, do-nothing) fails the discriminating
   hidden checks.
If (2) or (3) does not hold, the case is mis-specified - fix it, do not run it. A no-codex
`SG_EVAL_VALIDATE` path that prints the starter's per-test results makes (1) cheap.

## Execution

1. Scope
- Select `runtime_adapter` by PREFLIGHT, not assumption: preflight the preferred CLI (codex-exec,
  claude-p, pi-agent, mcp, or mixed) on the host and fall back to another available one if it is missing
  or crashes; record host OS, the chosen adapter, and each adapter's preflight result. The reusable
  runner `templates/harness-eval-runner.mjs` performs this selection + fallback.
- Freeze repo snapshot and task wording.
- Write `eval_intent`: the user's goal in their terms, plus constraints and tradeoffs learned during the
  work. This is not a file-change summary.
- Write the command manifest before either arm runs. If commands are discovered by an arm, label them
  `arm_detected` and keep them out of the trusted baseline unless the evaluator independently accepts
  them.
- Choose the artifact root for logs, result JSON, commands, and the scoped evidence bundle.

2. Routing Probe (required for router/skill-trigger changes; otherwise record not-applicable)
- Build at least 20 prompts split across should-trigger, should-not-trigger, and near-miss cases; run
  each 3 times.
- Tune only on the 60% train split; select wording/config on the 40% held-out split.
- Record trigger/non-trigger rates in `routing_accuracy` and include raw prompt outcomes in the artifact
  root.

3. Baseline Run
- Run a normal agent with no generated harness, no harness references, and no specialized role pack.

4. Harness Run
- Run the same agent/tool family with only the approved harness added, eval-internal files stripped
  from the copied reference (see Contract).
- Match the harness to its Runtime fit. In an orchestrated runtime the harness arm runs a separate
  adversarial verifier that reads acceptance criteria and implementation after Build, writing
  verifier-authored tests before the final claim (provided visible tests do not count). In a single
  non-interactive process the harness runs its INLINE profile - one scoped sandbox-safe verify pass,
  not a multi-agent verifier loop that would exhaust the context window.
- The builder repairs every verifier RED or records `Not proven`; do not advance on a visible-test-only GREEN.

5. Verification (record-only - the eval does NOT impose a verifier/repair loop)
- Baseline-first: do not drive an adversarial-verifier + repair loop onto the harness arm. Eight evals
  showed that ceremony costs 2-3x without beating a strong baseline on explicit-spec tasks, and crashes
  when forced into a single non-interactive process.
- Record whatever verification the harness ran NATIVELY: an orchestrated harness may run its own verifier
  (record verifier-authored tests + REDs); an INLINE harness records its one scoped verify pass.
- Ground truth for BOTH arms is the eval's Machine Checks + hidden tests (next), applied equally. Do not
  advance a visible-test-only GREEN; if hidden checks fail, record `Not proven` with the failing checks.
- Record REDs caught, remaining REDs, and false-GREEN in the bug-catch matrix.

6. Machine Checks
- Run project-relevant checks: tests, lint, typecheck, build, smoke, browser QA, hidden tests, or data checks.
- Prefer deterministic repo-owned/evaluator-owned commands. Auto-detected commands may add evidence, but
  a proven claim must show which commands were trusted and why.
- Record EACH test/check individually as `{name, status, evidence, verifies, does_not_verify, confidence}`
  - never collapse the suite into one all-or-nothing pass. A binary pass/fail hides partial progress
  (observed: baseline passed 6/9 and harness 4/9, yet a single combined check scored both as the same
  "fail").
- Track the pass FRACTION per arm; it feeds the gradient correctness score below.
- `claim_status: proven` requires all baseline and harness checks to pass.

7. Quality Score
- Score each arm with a RevFactory-style 100-point quality rubric.
- Use 10 dimensions, each 0-10: `feature_completeness`, `test_coverage`, `code_quality`, `error_handling`, `efficiency`, `correctness`, `architecture`, `extensibility`, `documentation`, `dev_environment`.
- Keep the rubric REACHABLE: a fully correct solution must be able to reach >=80, and every dimension
  must stay individually reachable to 10. Do not write anchors that cap dimensions so low that even a
  perfect solution sums below the pass threshold (a capped rubric summing to 77 made >=80 impossible
  and flattened the arms to a near-tie).
- Score `correctness` and `feature_completeness` as a GRADIENT over the fraction of individual
  (visible + hidden) checks passed, not a binary all-pass-or-cap. Anchor the remaining dimensions to
  observable properties (tests present, module structure for multi-module tasks, dependency count,
  debug/TODO markers, docs) without capping them below 10.
- Add minimal-diff awareness: reward small targeted diffs; do not let a larger, more-rewritten solution
  score the same as a lean one of equal correctness.
- Record score rationale per dimension in `quality.baseline` and `quality.harness`.

8. Blind Grade
- Hide labels or swap labels before subjective scoring.
- Grade against the case rubric, not against harness marketing claims.

9. Compare
- Record pass winner, quality winner, bug-catch delta, false-GREEN delta, verification-strength delta,
  trajectory-efficiency delta, regression-test delta, cost/time tradeoff, routing-accuracy delta, failure
  notes, and grader uncertainty.
- Record paired statistics: sign-flip/BCa for gradient scores, and McNemar + SNR-filtered discordant
  pairs for binary pass/fail outcomes.
- Record decision gates: unresolved `ask-user` findings block a proven claim. `auto-fix` findings must
  name the mechanical fix and its recheck; `no-op` findings must say why no action was required.
- `claim_status: proven` requires both machine-check support and a harness quality-score win.

10. Report
- Use `templates/harness-eval-report.md`.
- Claim improvement only when machine checks, quality scoring, and blind grading support it.
- Include the harness mutation contract before recommending adoption or revision.
- Otherwise say `Not proven`.

11. Persist
- Save run-specific cases under the vault or `.domain-agent/qa/`.
- Save broadly reusable case templates under `templates/harness-eval-cases/`.
- Save raw logs, command list, result JSON, scoped evidence bundle, and mutation contract under the
  artifact root so the claim can be replayed.
- Save adapter replay fixtures for reusable harness claims, or record why the run is `Not proven`.
- Save surface-sync proof for any accepted harness change: which skill/docs/templates/tests changed and
  which command proves they did not drift.
- Promote a case into the skill only when it is clean-slate, runtime-portable,
  machine-checkable, and includes hidden checks, regression protection, cost
  fields, and the RevFactory-style quality-score rubric.

## Reject

- Self-reported agent success as evidence.
- Different benchmark task wording between runs. An approved harness prefix is allowed only when the
  original task body is preserved and hashed separately from the harness reference.
- Grading after seeing labels.
- Claiming a general percentage from one repo pilot.
- Hiding cost or runtime overhead.
- Omitting one of the four axes: correctness, token/cost, wall-clock speed, routing accuracy.
- Claiming routing improvement without should-trigger/should-not-trigger near-miss probes and held-out
  trigger accuracy.
- Hiding uncovered verification scope behind a passing command.
- Recommending a harness change without a rollback path and proof command.
- Treating a quality score win as sufficient when pass/fail checks regress.
- Counting an all-pass ceiling-effect case (both arms pass everything) as a win or a meaningful tie.
- A capped scorer whose maximum sum is below the pass threshold, or that cannot distinguish a 6/9 from a 4/9 solution.
- Exposing eval cases, hidden checks, or the rubric to the harness arm via the copied reference.
- Scoring a crashed / context-exhausted / timed-out arm as a silent zero instead of a recorded loss.
- Treating a manual post-hoc interrupt as a valid paired arm. Manual interruption after seeing elapsed
  time invalidates correctness scoring; rerun with a predeclared timeout/patch-capture policy.
- Forcing a multi-agent verifier/repair loop into a single non-interactive process and blaming the harness for the resulting context-window crash.
- Inventing throwaway ad-hoc cases for a PROVEN claim instead of the RevFactory corpus; authoring a fixture is allowed only to probe the under-specified frontier, and only after the 3-way discrimination check.
- Calling a +-1-test, n=1 delta a "win"; that is within run-to-run noise (same case flipped win->tie on re-run). A directional pilot needs n>=3 per arm and a per-seed vector; a PROVEN significance claim needs n>=6 per arm (sign-flip permutation min two-sided p = 2/2^n, so n<6 cannot reach p<0.05).
- Using overlapping confidence intervals as the A/B winner gate instead of paired tests.
- Comparing a multi-pass harness to a single-pass baseline and crediting the skill without an equal-compute control or a stated cost multiple.
- Running an authored fixture whose starter, a reference impl, and a lazy impl were not first checked to confirm it discriminates.
- Inferring user intent from changed files when the original goal, constraints, or rejected approaches are available.
- Treating agent-discovered commands as trusted ground truth without a frozen command manifest.
- Leaving `ask-user` findings unresolved while reporting a proven harness win.
- Claiming adapter telemetry is replayable without recorded, scrubbed fixtures and a replay command.
- Assuming one CLI runs the arm without a host preflight, or without a fallback when it is missing or crashes.
- Measuring hand-paraphrased inline critic/fixer/verifier prompts instead of the actual shipped skill role files (SKILL.md + reference/role-loop.md + agents/*.md), letting the eval drift from what ships.
