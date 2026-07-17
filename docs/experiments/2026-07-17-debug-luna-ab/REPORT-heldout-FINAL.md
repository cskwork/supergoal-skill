# Held-out generalization + candidate-edit A/B — FINAL REPORT (2026-07-17)

**One line:** On a held-out sympy real bug the DEBUG hidden-contract gate's mechanism generalized
(root-cause-owner fix vs symptom fix deterministically predicts pass/fail, 15/15), but the skill
still lost to a no-skill baseline and every score delta was statistically underpowered — the run is
a clean re-confirmation of baseline-first + the n=3-is-noise lesson, plus a directional (not proven)
refinement `v092` kept on a branch.

Model: codex `gpt-5.6-luna`, medium effort, 900 s, pier/Docker. All rewards read directly from
`verifier/reward.json`; patch sites from `model.patch` (no runner-stdout trust).

## Arms

| arm | skill | commit | meaning |
|---|---|---|---|
| baseline | none | — | no-skill control |
| v090 | supergoal before the gate | `350eb96` | BEFORE |
| v091 | supergoal with the shipped gate | `0715158` | AFTER (shipped) |
| v092 | v091 + exception-owner generalization | branch `debug-cand-exc-owner` `e522c30` | candidate edit |

## Phase 1 — before/after generalization (v090 vs v091) on held-out real bugs

**Round 1 (FOLLOWUPS-A pool 20212 / 24066 / 24213), seed 1:** baseline 3/3, v090 3/3, v091 3/3.
CEILING — a strong baseline solves all three unprompted, so nothing discriminates. Inconclusive;
re-confirms strong baselines absorb scaffolds on in-capability tasks. Lesson: the held-out set was
matched on novelty, not difficulty.

**Round 2 (difficulty-matched fresh instances 21171, 21379), 3 seeds:**

| task | baseline | v090 (before) | v091 (after) |
|---|---|---|---|
| 21171 latex SingularityFunction | 0/3 | 0/3 | 0/3 (floor — nobody solves) |
| 21379 subs PolynomialError | 3/3 | 1/3 | 2/3 |

## The mechanism (the load-bearing result) — 15/15 deterministic

Bug 21379: `exp(sinh(Piecewise(...)/z)).subs({1:1.0})` raises `PolynomialError`. Root cause:
`Mod.eval` (`sympy/core/mod.py`) calls `gcd(p,q)`, which throws on non-polynomial operands. Oracle:
catch it in `Mod.eval`, `G = S.One`.

Across **all 15 runs of 21379** (baseline+v090+v091+v091b+v092), the outcome is fully determined by
**where the agent patches**, with ZERO violations:

- patch `sympy/core/mod.py` (the invariant OWNER — the frame that raises) → **pass** (uses `S.One`,
  the module's canonical singleton = gate check-3).
- patch `sympy/functions/elementary/hyperbolic.py` (the SYMPTOM site — where `%` surfaces the error)
  → **fail** (guards 4-6 caller methods; hidden F2P still fails).

Owner-fix rate by arm on 21379 (= pass rate, since owner⟺pass is 15/15):

| arm | owner-fix / pass |
|---|---|
| baseline | 3/3 |
| v090 (before) | 1/3 |
| v091 (after, batch 1 seeds 1-3) | 2/3 |
| v091b (after, batch 2 seeds 4-6) | 0/3 |
| v092 (edit, seeds 4-6) | 2/3 |

Reading:
1. **The gate's mechanism generalizes.** On a task its wording was never tuned on, the gate targets
   exactly the decision that determines success (fix the owner, not the symptom). check-1 lifted the
   owner-fix rate over the pre-gate skill on batch 1 (2/3 vs 1/3).
2. **The skill loses to no-skill baseline.** Baseline finds the owner 3/3; both skill versions leak
   to the symptom site a majority of the time. On this task, invoking supergoal did WORSE than not
   invoking it — baseline-first, re-confirmed, now with a mechanism.
3. **n=3 single-task deltas are noise — demonstrated live.** The *same* gate (v091) swung 2/3 → 0/3
   between two fresh 3-seed batches. Pooled, the gate is 2/6 (33%) on 21379. Any single 3-seed cell
   is uninterpretable — the repo's 07-17 termenv lesson, cleanly reproduced.

## Phase 2 — candidate edit v092 (before/after of the design change)

**Edit (length-neutral, attention-restructuring — no new check):** generalize check-1's traceback
rule from "RecursionError/cycle" to "any raised exception": the owner is the deepest frame that
RAISES (recursion = the repeating cycle), not the caller where it SURFACES. SKILL.md `GATE.owner=`
example aligned. Diff: SKILL.md 5 lines, role-loop.md net +1 line. Contract tests: role-loop 154/0,
gate-scenarios 86/0, mode-parity 12/12, reference-integrity 4/0 — all green.

**Paired A/B v091 vs v092 on fresh seeds 4-6:**

| task | v091b (current) | v092 (edit) |
|---|---|---|
| 21379 | 0/3 (all symptom) | 2/3 (seeds 5,6 owner-fix) |
| 21171 | 0/3 | 0/3 (floor — different failure class, not exception-owner) |

- Directionally positive: paired 0/3 → 2/3 on the discriminating task, mechanism-consistent (the two
  v092 wins are owner-fixes).
- **Not proven:** 2 discordant pairs → McNemar exact two-sided p ≈ 0.5; n far below the pre-registered
  n≥6 significance floor. v091b's own 0/3 (vs v091's earlier 2/3) shows the baseline of comparison is
  itself noisy.
- Zero regressions: no p2p failures anywhere; contract tests green; does not hurt the floor task.

**Disposition: KEEP on branch `debug-cand-exc-owner` (e522c30), do NOT merge to dev-v2.** It is a
principled, length-neutral, contract-clean, zero-regression, directionally-positive generalization —
but directional only. Merging an unproven edit would violate this repo's own "not proven" discipline
and the task-adaptation caution (the edit was designed from 21379's failure). Merge only after a
powered confirmatory run on a difficulty-matched held-out set (n≥6).

## Secondary finding (design tension worth a future edit)

The skill's DEBUG "observe-first at the symptom's boundary" guidance (`reference/debugging.md`) may
anchor the agent at the site where the error surfaces (hyperbolic.py's `%`), partly CAUSING the
symptom-fixation the gate then has to correct — while a free baseline traces the exception to its
origin. Candidate future edit: make observe-first explicitly hand off to the traceback origin for
raised-exception bugs. Not tested here.

## Why generalization couldn't be proven, and what to build

Clean, difficulty-matched held-out sympy instances are nearly exhausted: of the fresh ones, most
CEILING (baseline solves unprompted) or FLOOR (nobody solves — 21171, 24102), leaving a thin
discriminating band (essentially 21379). Proving generalization needs a larger supply of hard,
naturalistic debug instances. The next build is a **BugPilot-style FeatAdd generator** (arXiv/Microsoft
debug-gym): have an agent add a feature that unintentionally breaks existing tests, yielding
naturalistic root-cause-vs-symptom bugs at scale — the axis this whole run showed the gate operates on.

## Phase 3 — powered non-inferiority A/B (v091 vs v092, 14 tasks x 3 seeds = 42 paired)

Motivation: the held-out pool has ~1 exception-owner discriminator (21379), so v092's WIN can't be
powered from scraped bugs. But v092 is off-regime-neutral (it only changes behavior on raised-exception
bugs), so a broad run tests NON-INFERIORITY (does it regress anything v091 solves?) with real power.
Ran v091 (current HEAD) vs v092 (`e522c30`) on all 14 built sympy tasks, 3 seeds, reward.json direct.

| class | tasks | result |
|---|---|---|
| ceiling | 20212, 20442, 21055, 21847, 22714, 23262, 24066, 24213 | both 3/3 — perfect concordance |
| floor | 21171, 21627, 23191, 24102 | both 0/3 — concordant |
| in-regime | 21379 | v091 0/3, **v092 2/3** (+2 discordant, mechanism-consistent) |
| convention | 24909 | both 2/3 — seeds disagree (1 pair each way) = n=3 noise, same rate |

Totals: v091 26/42, v092 28/42. McNemar: 38/42 concordant; discordant 3 (v092) vs 1 (v091);
**exact two-sided p = 0.625**.

Verdict:
- **Non-inferiority: supported.** 12 of 14 tasks perfectly concordant across 3 seeds; no SYSTEMATIC
  regression. The single v091-favoring discordant pair is on 24909 where both arms hit 2/3 (same rate,
  seed noise), not a real regression.
- **In-regime benefit: directional** (21379 0/3 -> 2/3), consistent with the owner<->pass mechanism.
- **NOT a proven win:** p = 0.625; the signal rides on one task and is underpowered. The original gate
  was merged at p = 0.020 — v092 does not meet that bar and is not claimed to.

## Merge decision: MERGE v092 as a safe refinement (NOT a proven win)

The user pre-committed to merging v092 iff it is non-inferior (no systematic regression) AND shows an
in-regime directional benefit. Both hold. v092 is additionally length-neutral (no adherence cost per the
IFScale/context-rot evidence), contract-clean (154+86+12+4 green), and a principled generalization of an
existing rule (RecursionError -> any raised exception), which mitigates task-adaptation risk. Merged into
dev-v2 on that pre-committed criterion, documented explicitly as a safe, directionally-supported
refinement — not a proven correctness win. A proven win would still require a powered in-regime set
(the FeatAdd generator, `templates/harness-eval-external/featadd/`, exists for that next campaign).

## Provenance

Rig: `gen_tasks.py` (+ held-out ids), `run_screen.sh` / `run_v092ab.sh`, `read_heldout.py` /
`read_v092.py`. Dual-validation (oracle reward=1, nop reward=0) passed for all 5 built instances.
Raw runs under `/tmp/sg-debug-luna/runs/` (volatile). Autopsy detail: `HELDOUT-AUTOPSY.md`.
