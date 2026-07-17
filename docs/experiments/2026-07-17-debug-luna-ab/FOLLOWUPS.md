# Follow-up designs (written 2026-07-17, not yet run)

## A. Held-out external validation (recommended first — cheapest, answers the biggest caveat)

Question: does the hidden-contract gate generalize beyond the 4 tasks its wording was tuned on?

- Held-out pool: unused validated sympy instances **20212 (0**-oo), 24066 (exp dimensionless),
  24213 (equivalent dims addition)** — never touched by any lever iteration. Excluded: 22005 /
  24152 (fix telegraphed in the report), 21612 (needs antlr4 runtime in the image).
- Rig: same `gen_tasks.py` pipeline (add the 3 ids to TASKS), oracle/nop dual gate, 1-seed
  ceiling screen (dual-solves drop out; these three may well ceiling — that outcome is itself
  informative and cheap: 6 runs).
- Arms: v0.9.1 (post-merge dev-v2) vs pre-gate v0.9.0 (350eb96), 3 seeds × surviving tasks.
- Decision rule (pre-registered here): gate keeps its claim if resolved(v0.9.1) ≥ resolved(v0.9.0)
  overall AND wins ≥1 task where v0.9.0 is at 0/3, with zero p2p regressions. NO lever edits
  allowed between reading held-out results and reporting — one shot.

## B. Ablation: content vs generic compute (expensive — price it before running)

Question: how much of the +5 is the three specific checks vs "any extra adversarial pass"?

- Arms: v0.9.0 / ctrl (naive pass, d7fda4e) / cand3 (5b794bd), same 4 tasks.
- Power reality: observed rates ctrl 25% vs cand3 42%. Two-proportion one-sided detection at
  α=0.05, 80% power needs ~85 cells/arm (≈21 seeds × 4 tasks) — ~$0 marginal (subscription) but
  ~14h wall-clock/arm at current pacing. A cheaper 6-seed (24-cell) version only resolves gaps
  ≥35pp. Recommendation: run A first; run B only if a decision actually hangs on the split
  (e.g. whether to ship the naive-pass line to non-DEBUG modes too).
- Regardless of B: the naive-pass line (0→3/12, p=0.10) is a candidate lever for OTHER modes;
  if pursued, evaluate it as its own campaign with its own pre-registration.

## C. 24102-class gap (parser/structural bugs — 0/12 across ALL arms)

check-2 ("structurally different repro") did not push agents to greek-inside-function-call.
Candidate rewording: "vary the GRAMMATICAL role of the failing construct (argument position,
operator operand, nested call), not just its surroundings". Park until A confirms the gate holds
externally; folding another wording tweak in before that re-opens task-adaptation risk.
