# Changelog 2026-07-03

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
