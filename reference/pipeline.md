# Pipeline - phases and exit gates

Forward-only lanes. A phase opens only after the previous exit gate passes. Rewinds are explicit
(Verify/QA may reopen Build/Fix).

Vault: `docs/changelog/<date>-<slug>/`, six files for coding modes; QA-ONLY uses a reduced folder (see
its section below) and LEARN writes a journal; see `vault.md`.

## Branch/worktree isolation

For GREENFIELD, DEBUG, and LEGACY, resolve the target repo first, then ask `base_branch`
(source branch) and `target_branch` immediately after mode detection unless both are explicit.
Default target to base when only one branch is given. Verify both source/base and target refs in that
repo before creating the run worktree; if either ref is missing, ask for corrected branch names
instead of guessing. Create a run branch/worktree from base; implementation phases run inside the
branch-scoped worktree. After Deliver passes and the user accepts, merge run branch into target with
an explicit merge commit (`git merge --no-ff <run_branch>`) from a clean target checkout or clean
target integration worktree. If the merge commit is blocked by dirty unrelated work, repo guards,
permissions, or missing refs, stop and report the blocker; do not manually port/copy/apply the diff,
cherry-pick, squash, rebase, or edit the target branch directly unless the human explicitly overrides
the merge-commit policy. Resolve conflicts only inside the active merge state, preserving target
behavior, then commit the merge and record the merge commit SHA. Keep the three most recent completed
run worktrees for the repo; prune only the oldest repo-managed completed run worktree when the
retained count exceeds three.

## Topology rule

Task topology picks architecture:

- **Wide-and-shallow** (research, market scan, independent scaffolding): fan out.
- **Deep-and-narrow** (one feature, one bug, long refactor): single driver + isolated helper probes.

GREENFIELD can fan out Validate/Plan/scaffold work. DEBUG and LEGACY default single-driver and stay
read-only through investigation. All modes pause at Human Feedback before first implementation write.

## Shared overlays

- **Domain rules:** At Intake, record <=10 `ten-rules` priority rules in `README.md`. Advisory only.
- **Domain context:** For GREENFIELD Plan, DEBUG Reproduce/Diagnose, and LEGACY Explore, load
  `reference/domain-context.md`. It builds a compact `## Domain Brief` from repo-local knowledge
  (default `.domain-agent/`) and current-code verification. If the knowledge pack is missing, ask
  where to create it and add the chosen path to `.gitignore` before writing it.
- **UI/UX:** If deliverable is user-facing UI, add Design Read/dials at Plan, Designer at Build, and
  tier Pre-Flight at QA. `reference/ui-ux.md` routes to the Expressive (taste-skill-v2) or Functional
  (functional-ui) tier by surface.
- **Interview:** Before plan freeze (GREENFIELD/LEGACY Plan start, DEBUG Diagnose end), run an
  ambiguity-gated clarifying interview: skip if the request is clear or a cheap code read answers it;
  otherwise resolve code-answerable questions by reading code, then ask at most 3-5 high-leverage
  questions one at a time (DEBUG instead re-ranks 3-5 root-cause hypotheses, non-blocking). Gate the
  freeze on must-have answers or a user-approved assumption. See `reference/interview.md`.
- **Plan grounding:** Before Human Feedback, planner self-grounds `plan.md` against docs/code. See
  `reference/plan-grounding.md`.
- **Artifact skips:** If a prior spec/plan/PRD already satisfies a phase, seed/skip it and log the skip
  in `README.md`.

## GREENFIELD - Intake -> Validate -> Interview -> Plan -> Human Feedback -> Build -> Verify -> QA -> Deliver

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Brief goal, audience, acceptance, non-goals | `brief.md`, `state.json` | machine-checkable acceptance criteria |
| Validate | Demand evidence + scoped MVP | `brief.md` `## Validation` | `templates/validate-gate.sh <vault>` exits 0; requires `Decision: GO` |
| Interview | Crystallize requirements if underspecified | `plan.md` `## Interview` (or skip note in `README.md`) | ambiguity-gated 3-5 questions answered or skipped; must-have answers / user-approved assumptions recorded; see `reference/interview.md` |
| Plan | Domain Brief, grounded plan, slices, stack/contracts | `README.md`, frozen `plan.md` | task table; each slice <=5 files / about 500 lines; acceptance check; store `plan_hash` |
| Human Feedback | Human approves, revises, or stops | `plan.md` `## Human Feedback`, `state.json.approval` | required two briefs; human approves Build; `human-feedback-gate.mjs` exits 0 |
| Build | Implement slices in run worktree | code, `claims.md` | slice tests pass; each claim has `run-to-prove` |
| Verify | Clean-state adversarial re-run | `verification.md` | all claims GREEN; `## Coverage`; `Not covered:`; `High-risk fixed RED:`; `Regression tests:`; completeness critic; aggregate `verdict: GREEN` |
| QA | Black-box app exercise | `verification.md` `## QA`, `qa/` | browser/CLI QA passes; `qa-gate.sh <vault> <browser|cli>` exits 0 |
| Deliver | Literal gate + package | commit / PR | plan hash matches; `delivery-gate.sh` exits 0 |

## DEBUG - Intake -> Reproduce -> Diagnose (+ Interview: hypothesis re-rank) -> Human Feedback -> Fix -> Verify -> Deliver

Single-driver by default; escalate to split localize/fix contexts when the bug spans many files or
multiple services. Read-only through Human Feedback. See `reference/debugging.md` for the loop,
distributed triage, and escalation rule.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Capture symptom, env, expected vs actual | `brief.md` | symptom + expected behavior stated |
| Reproduce | Domain-scoped deterministic failing repro | `README.md`, failing test/script, `claims.md` | repro FAILS on current code and is expected to PASS after fix (F->P) in a clean sandbox; flaky/timing bugs fail consistently over N runs |
| Diagnose | Hypothesis-driven root cause | `README.md` hypothesis ledger, frozen `plan.md` | 3-5 ranked hypotheses presented to user for re-rank (non-blocking; see `reference/interview.md`); one hypothesis confirmed by direct evidence against Domain Brief/current code; cross-boundary bugs pass distributed triage; minimal fix plan written |
| Human Feedback | Explain cause + fix plan | `plan.md`, `state.json.approval` | human approves Fix; `human-feedback-gate.mjs` exits 0 |
| Fix | Smallest root-cause change in run worktree | code patch | previously failing repro passes; minimal diff, no unrelated churn |
| Verify | Re-run repro + suite cleanly | `verification.md` | repro GREEN; suite GREEN; coverage map; completeness critic; aggregate GREEN |
| Deliver | Gate + package | commit / PR | `delivery-gate.sh` exits 0 |

DEBUG's valid proof is failing-before -> passing-after in a clean sandbox. DEBUG still writes `plan.md`;
the delivery gate requires `brief.md`, `plan.md`, and `verification.md` in every mode.

## LEGACY - Intake -> Explore -> Interview -> Plan -> Human Feedback -> Build -> Verify -> QA -> Deliver

Single-driver with targeted helper probes. Read-only through Human Feedback.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Feature spec + acceptance | `brief.md` | acceptance criteria stated |
| Explore | Domain Brief + affected-code map with citations | `README.md` | entry points, call paths, blast radius, invariants, and test commands documented |
| Interview | Crystallize requirements if underspecified | `plan.md` `## Interview` (or skip note in `README.md`) | ambiguity-gated 3-5 questions answered or skipped; must-have answers / user-approved assumptions recorded; see `reference/interview.md` |
| Plan | Ground surgical change plan | frozen `plan.md` | smallest blast radius; reuse noted; store `plan_hash` |
| Human Feedback | Explain implementation plan | `plan.md`, `state.json.approval` | human approves Build; `human-feedback-gate.mjs` exits 0 |
| Build | Implement in existing style | code, `claims.md` | slice tests pass; no unrelated churn |
| Verify | Clean-state claims + suite | `verification.md` | claims GREEN; suite GREEN; coverage map; completeness critic; aggregate GREEN |
| QA | Exercise feature + adjacent flows | `verification.md` `## QA`, `qa/` | `qa-gate.sh <vault> <browser|cli>` exits 0 |
| Deliver | Gate + package | commit / PR | plan hash matches; `delivery-gate.sh` exits 0 |

## QA-ONLY - Intake -> Target & Access -> Scenario checkpoint -> Exercise -> Cross-check -> Report -> Persist

No-code mode: exercise an already-running app (and a read-only DB) to QA behavior or compare data.
Read-only except the run folder and the `.domain-agent/qa/` suite. No worktree, no Validate/Human
Feedback/Committee/Deliver gates. The Scenario checkpoint is the only pause (nothing ships). Reduced run
folder: `brief.md`, `verification.md` (`## QA`), `report.md`, `qa/`, `state.json`. See `reference/qa-only.md`.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | QA goal, scenarios, `Comparison:` type, acceptance | `brief.md`, `state.json` | scenarios + comparison type stated |
| Target & Access | Running-app target (URL/env, not built), browser driver, read-only DB access, budget | `brief.md` | target reachable; driver + DB named; `action_cap` set (default 100) |
| Scenario checkpoint | Show scenarios + budget + comparison; let user narrow | run note | user confirms or narrows; proceed unless told to wait |
| Exercise | Drive app via `qa-auditor`, capped | `verification.md` `## QA`, `qa/` | per-scenario pass/fail; combined `action_count <= action_cap` |
| Cross-check | Read-only DB via `db-reader`: auth, UI-value integrity, dataset/env diff | `verification.md` `## QA`, `qa/expected.md` | per-check pass/fail + small diff; no raw dumps |
| Report | Human-friendly result | `report.md` | `## What worked`/`## What didn't`/`## What I discovered`/`## How to re-run` |
| Persist | Save reusable suite, index it | `.domain-agent/qa/<suite>.md`, `index.md` `## QA Suites` | suite + re-run steps; no secrets/PII; gitignored |

Gate: `bash templates/qa-only-gate.sh <vault> <browser|cli>` exits 0. Browser driver is `agent-browser`
by default, attach-to-browser (Playwright CLI) for authenticated sessions. DB access is read-only and
DB-independent (`reference/db-access.md`). `qa-auditor` and `db-reader` are separate read-only subagents
so DB raw rows/PII never enter the browser agent; the conductor relays a small `qa/expected.md`.

## Rewinds and circuit breaker

- Verify RED or QA fail: rewind to Build/Fix with the specific failure.
- Human rejects/changes packet: rewind to Plan/Diagnose, update vault, ask again.
- Max 5 fix cycles per phase. Same normalized error 3 times: stop, write root cause to `README.md`,
  escalate.
- Each phase is fresh context, allowed vault reads only, compressed summary only.
