# Debug-mode improvement + A/B — PLAN (2026-07-17)

Status: **CLOSED at the Phase 1 decision gate (2026-07-17) — H4 confirmed, see `AUTOPSY.md`.**
No code change; v0.9.0 stands. The premise table below is also corrected by the autopsy: termenv is
a feature-add task (instruction.md: "Add preserve-resets and ANSI-safe truncation..."), not debug.
Plan kept below for the record. Originally forward design for the one open item carried out of
v0.9.0 (`../2026-07-16-supergoal-efficiency-ab/STATUS.md`, changelog-2026-07-17).

## Problem

v0.9.0 (cand1 = regression reconciliation + ephemeral fast path) wins overall but hides a
**task-shape interaction**: the fast path is a net win on feature-add and a net loss on debug.

| task (medium) | shape | baseline f2p | reconmed f2p (full protocol) | cand1med f2p (fast path) |
|---|---|---|---|---|
| csstree | feature-add | 75/79 | 78/79 | **79/79** |
| termenv | debug | 34/35 | 34/35 | **31/35** |

Low effort shows the same sign (termenv: baseline 34, recon 29, cand1 33 → cand1 −1 vs baseline).
Two facts sharpen it:
1. The loss is in **f2p** (target tests the fix should make pass), not p2p — p2p stayed 87/87. So
   cand1 produced a **less complete fix**, it did not break regressions.
2. On termenv cand1 is also **faster** (453s vs reconmed 575s, baseline 493s). It is trading fix
   completeness for speed on debug tasks — exactly where there is no speed problem to solve.

Working hypothesis: for a debug-shaped task ("one bug, many edge-case target tests"), the full
protocol's extra verify-and-iterate cycles catch more edge cases; the fast path's leaner loop stops
at a fix that passes most but not all target tests. **The fast path may have over-trimmed by
conflating "skip file ceremony" (pure waste) with "do fewer fix→verify iterations" (load-bearing).**

## Non-negotiable: root-cause before any change

The mechanism above is a hypothesis, not a finding. Do NOT design the change from it. Phase 1 is a
rollout autopsy; the change is designed only from what it shows. (Repo principle: evidence-gated,
smallest accurate fix.)

### Phase 1 — rollout autopsy (no new runs; read existing artifacts)

Inputs already on disk: `/tmp/sg-deepswe-eff3/{basemed,reconmed,cand1med}-termenv-*/` rollouts
(codex session jsonl + final patch + verifier ctrf.json).

Produce, per arm:
- the exact 3 f2p tests cand1med failed that reconmed/basemed passed, and their assertion messages;
- the final patch diff of each arm, aligned — what did the full-protocol arms include that cand1
  omitted (an extra branch? an edge case in the ANSI reset handling?);
- the loop trace — how many fix→verify iterations each arm ran, where cand1 stopped, and whether it
  stopped because of an explicit "targeted tests green" signal or because the fast path shortened
  the verify discipline.

Decision gate: only proceed if the autopsy isolates a **specific** loop step whose absence caused
the miss. Candidate mechanisms to confirm or rule out:
- **H1 fewer iterations** — cand1 ran fewer verify-and-iterate cycles; the missed tests are edge
  cases a second iteration would have surfaced.
- **H2 planning skip** — cand1's in-context (vs vault-file) planning under-scoped the fix surface.
- **H3 verify altitude** — "one full-suite run at Exact Verify" was read as "one fix attempt"; the
  targeted-tests-while-building loop was silently weakened.
- **H4 no real cause** — the 3-test gap is within run-to-run noise (then the answer is replication,
  not a code change; go to Phase 3 with cand1 unchanged and stop).

## Phase 2 — candidate change (design AFTER Phase 1)

Constraint: whatever restores debug quality must **not** give back the feature-add win (csstree
79/79, −8% time vs baseline). So the change must be **debug-shape-gated**, not global.

Shape of the likely change (to be finalized by Phase 1, not before):
- A cheap debug-shape detector at Frame: failing target test(s) present + localized surface (small
  gold-patch footprint / few files). This is a classifier, cross-cutting the ephemeral detector.
- In debug mode, keep the fast path's file-ceremony leanness (no vault/worktree/changelog — that
  was pure waste and is task-shape-independent) but **restore the load-bearing step Phase 1 named**
  (e.g. iterate-until-all-target-tests-green, or explicit edge-case enumeration before the fix).
- Wording, not new machinery: prefer a conditional clause in `reference/role-loop.md`, mirroring how
  the ephemeral fast path was added. Avoid new gates.

Keep the diff surgical: this is a refinement of the fast-path clause, not a new subsystem.

## Phase 3 — A/B validation

### Fix the two methodological weaknesses of the v0.9.0 study

1. **n=1 per cell.** f2p is bimodal; a 3-test swing is inside single-run noise. Every cell here runs
   **≥3 seeds** (vary the codex run, not the task). Report median + spread, not a point.
2. **Only one debug task.** One task cannot support a task-shape claim. Build a **debug task set**
   (target ≥4 debug-shaped tasks) plus keep ≥2 feature-add tasks as the guardrail that the change
   did not regress the win.

### Task-shape classification (deliverable of Phase 3 setup)

Classify the DeepSWE pool by gold-patch footprint as a proxy: debug = small localized gold patch
with failing target tests pinning one behavior; feature-add = broad multi-file surface. Record the
classifier and the chosen tasks; do not hand-pick to fit the hypothesis.

### Environment pre-validation (skrub lesson)

Before scoring, dry-run each candidate task's verifier on the **gold patch** and confirm it reaches
a real pass/fail (no collection segfault as skrub-duration-encoding hit). Drop any task whose
verifier is unstable; log the drop — never let a silent env fault read as a quality result.

### Arms (per task, paired, ≥3 seeds each)

- `baseline` — no skill (reference floor).
- `v090` — shipped cand1 (incumbent; the arm we are trying to beat on debug without losing on
  feature-add).
- `cand-dbg` — v090 + the Phase 2 debug-mode change.

Single runner (current checkout), `--skill-repo` varies — same design that removed the
per-worktree-runner confound. Reuse `templates/harness-eval-external/deepswe/run-full-cycle.mjs`
(already records agent-time + tokens per arm).

### Metric + keep/discard rule

Primary axis is **debug f2p**; efficiency is secondary (the fast path already solved speed).

KEEP `cand-dbg` iff, across seeds (median):
- debug tasks: f2p **≥ v090 AND ≥ baseline** on every debug task, with a **strict gain on ≥1**
  (recovers the termenv-class loss); AND
- feature-add guardrail: f2p **not worse than v090** on every feature-add task (the csstree win is
  preserved); AND
- no efficiency blow-up: agent-time sum **≤ v090 + 15%** (debug mode may cost some of the speed it
  over-traded, but must not erase the fast-path gain).

Otherwise DISCARD and either re-enter Phase 2 with the next mechanism, or — if Phase 1 landed on H4
— close the item as "within noise, no change warranted" and record that cand1/v0.9.0 is final.

### Bounds

- Iterations: ≤3 candidate designs (autoresearch classic loop, same as the v0.9.0 study).
- Budget guard: codex gpt-5.5, medium effort primary (low as a cheap pre-screen), 900s/arm.
- Runtime estimate: (4 debug + 2 feature) × 3 arms × 3 seeds = 54 arm-runs/iteration ≈ several
  hours; pre-screen at low on a 2-task subset before committing the full matrix.

## Risks / rollback

- **Regressing the feature-add win** — the guardrail arm + KEEP rule block this; if cand-dbg wins
  debug but nicks csstree, it is discarded.
- **Over-fitting to termenv** — mitigated by the ≥4-task debug set and seed replication; a change
  that only helps termenv is not shipped.
- **Rollback** — the change is one clause in `reference/role-loop.md`; revert the commit. v0.9.0
  remains the fallback and is already released.

## Out of scope

Token overhead (still ~2× baseline in the all-files-embed benchmark, 97% cached): an embed artifact,
not a debug-quality issue. Not addressed here.

## Deliverables of this experiment (when run)

`docs/experiments/2026-07-17-debug-mode-ab/`: this PLAN, a STATUS with the results matrix, and an
`autoresearch/` loop log; changelog entry with the decision and rejected mechanisms.
