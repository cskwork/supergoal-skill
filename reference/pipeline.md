# Pipeline - phases and exit gates

Forward-only lanes. A phase opens only after the previous exit gate passes. Rewinds are explicit
(Verify/QA may reopen Build/Fix).

Vault: `docs/changelog/<date>-<slug>/`, six files only; see `vault.md`.

## Branch/worktree isolation

For GREENFIELD, DEBUG, and LEGACY, ask `base_branch` and `target_branch` immediately after mode
detection. Default target to base when only one branch is given. Create a run branch/worktree from
base; implementation phases run inside the branch-scoped worktree. After Deliver passes and the user
accepts, merge run branch into target, then remove the worktree.

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
- **UI/UX:** If deliverable is visual UI, add Design Read/dials at Plan, Designer at Build, and taste
  Pre-Flight at QA. See `reference/ui-ux.md`.
- **Plan grounding:** Before Human Feedback, planner self-grounds `plan.md` against docs/code. See
  `reference/plan-grounding.md`.
- **Artifact skips:** If a prior spec/plan/PRD already satisfies a phase, seed/skip it and log the skip
  in `README.md`.

## GREENFIELD - Intake -> Validate -> Plan -> Human Feedback -> Build -> Verify -> QA -> Deliver

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Brief goal, audience, acceptance, non-goals | `brief.md`, `state.json` | machine-checkable acceptance criteria |
| Validate | Demand evidence + scoped MVP | `brief.md` `## Validation` | `templates/validate-gate.sh <vault>` exits 0; requires `Decision: GO` |
| Plan | Domain Brief, grounded plan, slices, stack/contracts | `README.md`, frozen `plan.md` | task table; each slice <=5 files / about 500 lines; acceptance check; store `plan_hash` |
| Human Feedback | Human approves, revises, or stops | `plan.md` `## Human Feedback`, `state.json.approval` | required two briefs; human approves Build; `human-feedback-gate.mjs` exits 0 |
| Build | Implement slices in run worktree | code, `claims.md` | slice tests pass; each claim has `run-to-prove` |
| Verify | Clean-state adversarial re-run | `verification.md` | all claims GREEN; `## Coverage`; `Not covered:`; `Regression tests:`; completeness critic; aggregate `verdict: GREEN` |
| QA | Black-box app exercise | `verification.md` `## QA`, `qa/` | browser/CLI QA passes; `qa-gate.sh <vault> <browser|cli>` exits 0 |
| Deliver | Literal gate + package | commit / PR | plan hash matches; `delivery-gate.sh` exits 0 |

## DEBUG - Intake -> Reproduce -> Diagnose -> Human Feedback -> Fix -> Verify -> Deliver

Single-driver. Read-only through Human Feedback.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Capture symptom, env, expected vs actual | `brief.md` | symptom + expected behavior stated |
| Reproduce | Domain-scoped deterministic failing repro | `README.md`, failing test/script, `claims.md` | repro fails on current code in clean sandbox |
| Diagnose | Hypothesis-driven root cause | `README.md`, frozen `plan.md` | one hypothesis confirmed against Domain Brief/current code; minimal fix plan written |
| Human Feedback | Explain cause + fix plan | `plan.md`, `state.json.approval` | human approves Fix; `human-feedback-gate.mjs` exits 0 |
| Fix | Smallest root-cause change in run worktree | code patch | previously failing repro passes |
| Verify | Re-run repro + suite cleanly | `verification.md` | repro GREEN; suite GREEN; coverage map; completeness critic; aggregate GREEN |
| Deliver | Gate + package | commit / PR | `delivery-gate.sh` exits 0 |

DEBUG's valid proof is failing-before -> passing-after in a clean sandbox. DEBUG still writes `plan.md`;
the delivery gate requires `brief.md`, `plan.md`, and `verification.md` in every mode.

## LEGACY - Intake -> Explore -> Plan -> Human Feedback -> Build -> Verify -> QA -> Deliver

Single-driver with targeted helper probes. Read-only through Human Feedback.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Feature spec + acceptance | `brief.md` | acceptance criteria stated |
| Explore | Domain Brief + affected-code map with citations | `README.md` | entry points, call paths, blast radius, invariants, and test commands documented |
| Plan | Ground surgical change plan | frozen `plan.md` | smallest blast radius; reuse noted; store `plan_hash` |
| Human Feedback | Explain implementation plan | `plan.md`, `state.json.approval` | human approves Build; `human-feedback-gate.mjs` exits 0 |
| Build | Implement in existing style | code, `claims.md` | slice tests pass; no unrelated churn |
| Verify | Clean-state claims + suite | `verification.md` | claims GREEN; suite GREEN; coverage map; completeness critic; aggregate GREEN |
| QA | Exercise feature + adjacent flows | `verification.md` `## QA`, `qa/` | `qa-gate.sh <vault> <browser|cli>` exits 0 |
| Deliver | Gate + package | commit / PR | plan hash matches; `delivery-gate.sh` exits 0 |

## Rewinds and circuit breaker

- Verify RED or QA fail: rewind to Build/Fix with the specific failure.
- Human rejects/changes packet: rewind to Plan/Diagnose, update vault, ask again.
- Max 5 fix cycles per phase. Same normalized error 3 times: stop, write root cause to `README.md`,
  escalate.
- Each phase is fresh context, allowed vault reads only, compressed summary only.
