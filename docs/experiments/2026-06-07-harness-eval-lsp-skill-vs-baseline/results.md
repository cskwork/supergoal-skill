# supergoal skill vs plain codex agent - case-015 LSP (live, n=1)

Runtime: `codex-exec:gpt-5.3-codex-spark:reasoning-high`, INLINE single non-interactive process.
Arms: **baseline** = codex, no skill/harness refs; **harness** = same model + `--add-dir harness-ref`
with the new baseline-first `SKILL.md` (eval-internal case files stripped). Hidden tests injected only
after each agent finished. Fresh `/tmp` sandboxes per arm.

## Result (this run)

| arm | quality | real tests (5 vis + 4 hid) | all checks (+3 syntax) | false-GREEN | tokens | wall-clock | crashed |
|---|---:|---|---|---:|---:|---:|---|
| baseline | 81 | 7/9 | 10/12 | 2 | 1.49M | 174 s | no |
| harness  | **82** | **8/9** | **11/12** | **1** | 2.56M | 190 s | no |

Harness narrowly won both axes (pass-count and quality) and shipped one fewer false-GREEN, at
**1.72x tokens / 1.09x wall-clock**. The only quality dimension that moved is `correctness` (8 -> 9),
tracking the higher pass fraction.

## Per-check vector

Both arms: visible 5/5, syntax 3/3, hidden `didChange` pass, hidden `local-scope definition` pass.
Difference:

- `completion filters by prefix and exposes function signatures` (hidden): baseline **FAIL**, harness **PASS**.
- `parser recovers from syntax errors and still reports semantic diagnostics` (hidden): **both FAIL**.

The harness arm's final message recorded explicit assumptions (completion keyword snippets, param
in-scope handling, forward-ref arity) - the skill's "surface + record requirements" discipline - which is
the plausible reason it got prefix-completion right where the baseline shipped it broken.

## Why this is still `Not proven`

- **n=1 hard case.** The contract rules a single discriminating case `Not proven`; one case cannot prove
  general effectiveness.
- **Inside the documented noise band.** The prior INLINE run on the same model/effort/case (Exp B,
  `2026-06-06-harness-eval-spark-high-lsp-v2`) was baseline 81/7/9 vs **harness 82/6/9** - i.e. the harness
  arm *lost* tests there. The harness arm swung **6/9 -> 8/9** between two runs of the same configuration
  (the only difference is this run used the newer, leaner baseline-first skill). A +1-test, +1-point delta
  that the same setup produces in both directions is variance, not a proven lift.
- **The robust cross-run facts are unchanged.** (a) The baseline extracts the explicit spec cheaply - here
  7/9 at **1.49M tokens, the cheapest baseline arm yet** on this case. (b) The harness costs more every
  run (+72% tokens here). (c) Both arms keep failing the hardest hidden rule (syntax-recovery semantic
  diagnostics) in every experiment to date.

## What this run does add

A data point where the skill's verify/assumption-recording discipline caught a requirement
(prefix-filtered completion signatures) that the unaided baseline shipped broken - the exact mechanism the
skill claims (surface + verify requirements). At n=1 this cannot be separated from variance or from the
leaner new skill, but it is the first INLINE run where the harness arm beat the baseline on the test vector
rather than only tying/losing.

## Bug-catch matrix

| hidden rule | baseline | harness |
|---|---|---|
| didChange incremental refresh | caught | caught |
| completion prefix + signatures | **missed** | caught |
| local-scope definition | caught | caught |
| syntax recovery + semantic diagnostics | missed | missed |

## Adversarial verification loop

None. Single non-interactive process (INLINE profile) - no separate verifier/repair role by design.
Both arms self-reported GREEN on visible-only tests; ground truth came from the post-injected hidden suite.

## Decision

**Not proven** (favorable single run). Harness won this n=1 on tests, quality, and false-GREEN count, but
the win is within the run-to-run noise already documented for this case and cost 1.72x the tokens. A
proven claim needs multiple discriminating cases where the harness wins repeatably.
