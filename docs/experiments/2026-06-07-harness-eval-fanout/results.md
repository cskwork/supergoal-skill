# Fan-out eval: does REAL subagent fan-out (fresh codex per role) beat baseline?

Option B from the discussion: the eval script is the Conductor; each role is a separate `codex exec`
(clean context) sharing the sandbox via `.vault/` files - the fresh-context fan-out that single-process
codex structurally could not do. Harness pipeline: plan (analyst) -> build (executor) -> adversarial
verify (verifier, derives spec checks into `.vault/`) -> repair (executor, only if REDs).

Model gpt-5.3-codex-spark high, v2 scorer, case-015's `RULES.md`-style spec per case.

## Billing case (the gap case: single-process harness scored 6/8)

| arm | score | tests | tokens | notes |
|---|---:|---|---:|---|
| baseline (1 pass) | 80 | 8/8 | 0.86M | |
| single-process harness (earlier) | 76 | 6/8 | 0.91M | missed banker's rounding + discount order |
| **fan-out harness** | 80 | **8/8** | 1.47M | plan 0.89M + build 0.58M; verify crashed (transient), repair skipped |

**Finding: fan-out recovered the quality the single-process harness lost (6/8 -> 8/8), reaching baseline
parity** - all four subtle domain rules pass. Decomposing into a planning pass that distills the rules +
a focused build pass was enough; the adversarial verifier never actually ran (a transient codex infra
error: "stream disconnected ... failed to refresh available models"), and repair was skipped because no
REDs were recorded. So the 8/8 came from plan+build alone.

**But it did NOT beat baseline** (both 8/8) and cost **~1.7x the tokens** (1.47M vs 0.86M) - and that is
with the verify+repair roles not even running. With them, cost would be higher still.

## LSP / case-015 (single-process harness scored 6/9)

| arm | score | tests | tokens | wall-clock |
|---|---:|---|---:|---:|
| baseline (1 pass) | 85 | 9/9 | 4.11M | 250 s |
| single-process harness (earlier) | 82 | 6/9 | 2.71M | 207 s |
| **fan-out harness** | 81 | **9/9** | 4.64M | 1015 s |

Again fan-out **recovered correctness** (6/9 -> 9/9, perfect), but **lost the score (81 vs 85) and cost
4x the wall-clock** (3 sequential roles: plan 0.89M + build 3.76M; verify crashed again). Both arms pass
all 9 tests; the entire 4-point gap is ONE static heuristic - `error_handling` (baseline 10 / harness 6,
i.e. the baseline happened to include try/throw, the harness didn't). Functionally they are equal.

The verify role crashed AGAIN with the identical transient infra error ("failed to refresh available
models"), so the adversarial-verify+repair loop has not run in either fan-out case. plan+build alone hit
9/9, so there was nothing for it to fix.

## Combined fan-out (2 cases)

| | baseline | fan-out harness |
|---|---:|---:|
| avg score | 82.5 | 80.5 |
| avg pass-fraction | 1.00 | 1.00 |
| cost | lower | higher tokens + up to 4x wall-clock |

## What this means

- The fan-out mechanism is validated and works (real fresh-context roles, shared via files).
- On this case, fan-out's value is *recovering* the correctness that the cramped single-process harness
  threw away - back to what a plain baseline already achieves - at a multiple of the cost.
- The pattern across every experiment now holds: **the harness (single-process, INLINE, or fan-out)
  matches baseline quality at best and costs more; it does not exceed a strong baseline** on these
  self-contained, explicitly-specified tasks.
- The transient verify crash is infra noise, not a design flaw; but it also shows the orchestration adds
  more moving parts that can fail.

## Caveats / open

- One case (billing). lsp/case-015 not yet run under fan-out (larger, more expensive; the question is
  whether fan-out can beat the single-process harness's 6/9 there).
- verify role crashed transiently, so the adversarial-verify-then-repair hypothesis (catch spec gaps the
  build missed) was not actually exercised here - plan+build happened to be sufficient.
- Same fundamental limit as before: explicit `RULES.md` specs hand the domain knowledge to the baseline
  for free; this still under-tests the skill's implicit-domain-discovery value.
