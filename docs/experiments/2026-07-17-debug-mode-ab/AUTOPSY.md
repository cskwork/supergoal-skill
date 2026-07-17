# Phase 1 autopsy — termenv 3-test gap (2026-07-17)

Verdict: **H4 confirmed — implementation-shape sampling noise. The fast path is not causal.
Experiment CLOSED at the decision gate; no Phase 2/3; v0.9.0 unchanged.**

Bonus finding: the premise itself was wrong — termenv is a **feature-add** task, not debug
(instruction.md line 606: "Add preserve-resets and ANSI-safe truncation to termenv. Create an
ansi subpackage exporting: ..."). The v0.9.0 "task-shape interaction" table mislabeled it; no
debug-vs-feature signal exists in this data.

All evidence read from existing rollouts under `/tmp/sg-deepswe-eff3/` (no new runs).

## The 3 missed tests share ONE root cause

cand1med's 3 f2p misses: `TestMarsPreserveResets_ReappliesAfterReset`,
`_OutputOptionAffectsOutputString`, `_CompoundReset`. All three derive their expectation from the
implementation's own empty-string render:

```go
startSeq := strings.TrimSuffix(styled.Styled(""), resetSeq)
want := startSeq + "a" + resetSeq + startSeq + "b" + resetSeq
```

Contract (inherited from the unmodified `Styled` Sprintf path): `Styled("")` = open-SGR + reset.

cand1med's preserve-resets branch replaced the Sprintf wrap with the truncator:

```go
return ansi.TruncateANSI(fmt.Sprintf("%s%sm%s", CSI, seq, s), ansi.ANSIWidth(s), ...)
// and TruncateANSI begins: if width <= 0 { return "" }
```

`Styled("")` → width 0 → `""` → derived `startSeq` empty → all three wants corrupted. The actual
reapply behavior on the non-empty inputs was CORRECT — got == want-with-true-startSeq in all three
failures, including compound `1;0;31` reset detection. One line, one edge (empty input), 3 tests.

## 7-arm evidence table (all termenv rollouts on disk)

| arm | effort | protocol | `Styled` preserve-resets shape | 3 PreserveResets tests |
|---|---|---|---|---|
| baseline | low | no skill | dedicated helper + Sprintf wrap | pass |
| recon | low | full five-gate | **TruncateANSI reuse** (inner-only; reopen never fires) | **FAIL** (+2 more) |
| cand1 | low | fast path | dedicated helper + Sprintf wrap | pass |
| v080 | low | v0.8.0 | dedicated helper + Sprintf wrap | pass |
| basemed | med | no skill | dedicated helper + Sprintf wrap | pass |
| reconmed | med | full five-gate | dedicated helper + Sprintf wrap | pass |
| cand1med | med | fast path | **TruncateANSI reuse** (replaces wrap; width<=0 → "") | **FAIL** |

The failing shape ("delegate Styled's preserve-resets to the truncation helper") appeared exactly
twice — once in a **full-ceremony** arm (recon-low) and once in a **fast-path** arm (cand1med) —
and is anti-correlated with the fast path across efforts (cand1-low passed, recon-low failed).
Every arm that sampled the dedicated-helper shape passed; every arm that sampled truncate-reuse
failed the same tests, via two different mechanisms (recon-low: truncator can't see the enclosing
style → reapply never happens; cand1med: width-0 early return eats the empty-string wrap).

## Hypothesis verdicts

- **H1 fewer iterations — rejected.** go-test invocations comparable (basemed 19 / reconmed 22 /
  cand1med 16 session mentions). reconmed's extra refinement rounds fixed issues its own tests
  surfaced (OSC off-by-one, closeout, reopen-dup) — none touched the `Styled("")` contract.
- **H2 planning skip — rejected.** cand1med's in-context plan (event 51: dedicated ansi package,
  wire through Style/Output/template helpers, integration tests) equals reconmed's scope (event 101).
- **H3 verify altitude — rejected.** cand1med ran the full suite repeatedly (env-cleared), did a
  diff review that caught 2 real subtle issues, and a final audit. No arm — including the passers —
  tested `Styled("")`; the passers were saved by architecture, not verification. cand1med wrote the
  MOST preserve-related own tests of any arm (7).
- **H4 noise — CONFIRMED.** Failure keys 1:1 to which implementation shape the model sampled
  (~2/7 ≈ 29% mode for gpt-5.5 on this task), independent of protocol arm and effort.

## Shared miss (secondary, all 7 arms)

`TestTruncate_DoesNotSplitOSCSequence_WhenWidthZero`: every arm early-returns at `width <= 0`;
gold only returns early for `width < 0` and treats width 0 as normal flow (keep zero-width
sequences un-split, close hyperlinks/SGR). Task-level difficulty, protocol-independent — and the
same width-0 region cand1med happened to route `Styled` through.

## Consequences

1. **No role-loop change.** Per the pre-registered gate: no specific loop-step absence caused the
   miss. The debug-mode conditional is unmotivated — doubly so since the task isn't debug-shaped.
2. **Correction to v0.9.0 records:** the "fast path loses on debug" open item
   (changelog-2026-07-17, memory) is withdrawn. What the data supports: n=1 cells cannot attribute
   a ±3 f2p swing when a ~29% implementation-shape sampling mode exists. The PLAN's Phase 3
   methodology fix (n≥3 seeds/cell) is exactly what prevents this misattribution — apply it to any
   future single-cell delta before theorizing.
3. **Parked, not adopted:** a flag-noop invariant check ("an opt-in flag must not change output for
   inputs that don't exercise it, incl. empty input") would have caught cand1med's instance but not
   recon-low's (different mechanism; caught instead by any direct feature test). 1-of-2 catch rate
   on one task is below the evidence bar for a rule edit.

## Artifacts

- Arm roots: `/tmp/sg-deepswe-eff3/{baseline,recon,cand1,v080,basemed,reconmed,cand1med}-termenv-preserve-ansi-resets/`
- Per-test results: `jobs/*/termenv-*/verifier/reports/new-ctrf.json`; patches: `jobs/*/termenv-*/artifacts/model.patch`
- Trajectories: `jobs/*/termenv-*/agent/sessions/**/rollout-*.jsonl`
- Gold: `deep-swe-harness/tasks/termenv-preserve-ansi-resets/{instruction.md,solution/solution.patch,tests/test.patch}`
