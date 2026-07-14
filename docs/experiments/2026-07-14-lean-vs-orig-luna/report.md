# Lean vs Orig supergoal harness — A/B on DeepSWE `etree-xml-diff-patch`

Date: 2026-07-14 (report assembled 2026-07-15 by the conductor after the eval subagent hit a session
limit mid-write). Status: **directional, n=1, NOT proven.** One task, one run per arm — this cannot
support a proven-win claim, and the efficiency axis is additionally confounded (see Deviations).

## What was compared

- **ORIG** (baseline harness, commit `295992a`): delivery core
  `Build -> Improve full spec -> Improve edge cases -> Final Verify` = 4 serial CLI passes.
- **LEAN** (improved harness, commit `3e4a1cf`): delivery core
  `Frame+Plan(auto)+Build -> Exact Verify/QA`, with verdict-gated R-LOOP fix passes, `max_iterations` 3.

Role prompts for each arm were derived from that arm's shipped SKILL.md + reference/role-loop.md +
agents/*.md (role-fidelity rule). Both arms ran the same task, same runtime profile, serial passes.

- Model/effort actually used: **`gpt-5.6-luna`, medium reasoning effort**, via `codex exec`
  (codex-cli 0.144.4), `--full-auto`. Per-pass hard timeout 540 s (9 min), 0 retries.
- Task: DeepSWE `etree-xml-diff-patch` (implement a diff/patch/3-way-merge API for the `beevik/etree`
  Go library). Difficult: the target is an absent public API, not a one-line fix.
- Grader: **repo-owned / evaluator-owned** — the eval resets test files, applies the hidden
  `test.patch` over each arm's `model.patch`, and runs the Go suite via `go-ctrf-json-reporter`.
  No self-written tests were scored.

## Results (verified from the grader, not from either arm's self-report)

| Arm  | reward (binary gate) | f2p passed | p2p (regression) | partial credit | CLI passes | wall-clock (productive) | tokens |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ORIG | 0 | **50 / 52** | 15 / 15 | 0.9701 | 4 | ~18.6 min | 6,474,846 |
| LEAN | 0 | **51 / 52** | 15 / 15 | 0.9851 | 6 slots (1 build timed out) | ~14.8 min productive + 9 min wasted on timeout | 5,348,598 **(undercounted)** |

- **Neither arm hit reward=1**: the binary gate needs 100% of fail-to-pass tests. Both left ≥1 f2p
  failing, so both score 0 on the hard gate. Partial credit is the discriminating signal here.
- **Accuracy: LEAN ≥ ORIG.** Both kept all 15 regression tests green (zero regressions either arm).
  Both missed the same detail — `TestDiffOperationStringFormat` (the `MOVE` `String()` must print both
  paths). ORIG *additionally* missed `TestApplyPatchRemoveTextAndAttr` (a text-removal edge case) which
  LEAN got right. So LEAN passed one more f2p test (51 vs 50) and edged partial credit 0.985 vs 0.970.

## The LEAN R-LOOP worked as designed (the qualitative win)

LEAN's `R-LOOP.md` shows the verifier→builder loop doing exactly its job across 3 iterations:

1. **Iter 1** — verifier caught that the *entire* public API was absent (`go test` didn't compile:
   undefined `Diff`, `GeneratePatch`, `ApplyPatch`, `Merge3Way`, …). This was because the build pass
   had timed out before finishing (see Deviations). Builder implemented the API.
2. **Iter 2** — verifier **surfaced a hidden requirement** not in the prompt: exported declarations had
   no Go doc comments (`surfaced criterion 11`). Builder added them.
3. **Iter 3** — verifier **surfaced a real latent-correctness bug** (`surfaced criterion 12`): two
   independent sibling additions under one parent were wrongly classified as a merge conflict because
   `operationsConflict` compared parent paths. Builder distinguished them by element identity.

This is the mechanism the LEAN redesign bets on — one adversarial verifier that both proves and surfaces
hidden `must` requirements, feeding a relaunched builder red-first — and here it produced the
accuracy edge over ORIG.

## Deviations (why this run does NOT settle the efficiency question)

1. **LEAN's build pass timed out (9 min cap) on the low-tier model.** `i1-frame-plan-build` was killed
   at 540 s with `crashed: timeout`. Two consequences:
   - Its tokens were reported as **0** (codex's usage summary never printed before the kill), so LEAN's
     recorded 5.35M token total **excludes its single most expensive pass**. LEAN's *true* token cost is
     higher than recorded and **not comparable** to ORIG's complete 6.47M. **We cannot claim LEAN cut
     tokens from this run.**
   - The incomplete build is what forced Iter 1's "API absent" finding, inflating LEAN to 3 R-LOOP
     iterations (6 pass-slots) vs ORIG's 4 clean passes. So LEAN used **more** dispatches here — an
     artifact of the timeout, not evidence against the lean design.
2. **n=1, single task.** DeepSWE default suite is 5 tasks; only the primary scoring task ran before the
   session limit. Directional only.
3. **Two earlier attempts were discarded for hygiene** (`etree-aborted-firstattempt`,
   `etree-contaminated-2nd`) and correctly not scored; `runs2/` is the clean run.
4. Vault language: the task prompt was English, so both arms' vaults are English — consistent with the
   "one vault, one language" rule (request language = vault language), not a violation.

## Directional conclusion

On this single difficult task, **LEAN preserved accuracy and slightly beat ORIG** (51 vs 50 fail-to-pass
tests, zero regressions on both, partial 0.985 vs 0.970), and its verifier→R-LOOP loop demonstrably
surfaced and fixed two hidden requirements the flat ORIG passes did not encode. **The token/turn savings
the redesign targets are NOT demonstrated here** — the LEAN build pass timed out on the low-tier model,
which both undercounted its tokens and inflated its iteration count. The honest reading: *lean did not
cost accuracy, and may help it; efficiency is unmeasured on this run.*

## Recommended next run (to actually measure efficiency)

Re-run with the **build pass timeout raised** (e.g. 20–25 min, or a stronger tier for the build slice
only) so the LEAN build completes in one pass. Then compare tokens/turns on runs where neither arm's
core pass is truncated, across ≥3 tasks, and apply the harness-eval gate's paired stats before any
"cuts tokens" claim. Until then, treat efficiency as open.
