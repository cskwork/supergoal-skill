# ROLE-LOOP - the default loop for GREENFIELD / DEBUG / LEGACY

Use when the user invokes `supergoal` for GREENFIELD / DEBUG / LEGACY feature, bug, or refactor
work. Once invoked, use this loop; do not downgrade to an inline shortcut.

The mandatory core is Frame -> Plan approval -> Build -> Exact Verify/QA -> Finalize: five gates,
fresh context per role. Default cost envelope: one builder + one verifier dispatch per iteration - any
dispatch beyond that pair is escalation and needs a named escalation trigger recorded in
`run-state.json` (see `## Escalation (conditional plan attack)`). Frame owns discovery and enumerates
full-spec and edge-case coverage into the plan the user approves; the builder implements only the
approved plan and must cover every planned criterion; the verifier runs with an adversarial stance,
compares the request/docs with current behavior, runs the real proof layer, and surfaces hidden
requirements. Exact verification outranks reviewer approval. There are no standing critic or fixer
roles: the verifier finds gaps, and the relaunched builder fixes them through `R-LOOP.md` - that
loop-back is the only fix channel. Every gate exits with the app fully functional: Build must return
only on a green suite, Exact Verify/QA proves it, Finalize commits it.

The conditional plan attack is optional gated escalation, never the default. Use it when the task is
under-specified, latent-correctness-heavy, or security/edge/domain-rule-sensitive. Do not use it when
the spec is explicit, behavior is already stated, the harness is single-process/context-limited, or the
eval compares equal-compute vanilla. Production/domain behavior-changing ambiguity needs user feedback.
Generic no-user coding ambiguity uses the most conservative, reversible default and records the choice.

## Run setup - before any file mutation

For any GREENFIELD / DEBUG / LEGACY code edit, first resolve the source/base branch and
target/integration branch. Prefer repo policy or user-provided refs; ask if either is ambiguous. Then
verify both refs exist and create a branch-scoped run worktree:

```bash
git worktree add -b <run_branch> <worktree_path> <source/base branch>
```

Run Build, Exact Verify/QA, any escalation passes, tests, and vault writes inside that worktree; never
edit the original checkout. Treat dirty original-checkout files as user work. Commit or merge only
into the verified target/integration branch after green verification, user acceptance, and only once the
commit gate passes (`reference/delivery-gate.md`; `bash templates/commit-gate.sh <vault> <browser|cli|none>`).
Non-green blocks commit: resolve in-loop; escalate only when stuck.

Before any file mutation, create the run vault's `GOAL.md` from `templates/GOAL.md`, `PLAN.md` from
`templates/PLAN.md`, `QA.md` from `templates/QA.md`, and `run-state.json` from
`templates/run-state.json`, and start the Before/After Eval (`reference/delivery-gate.md`):

- `GOAL.md` is written FIRST: `## Original Request` quotes the user's prompt verbatim; `## Spec` refines
  it into a detailed spec; `## Success Criteria` seeds falsifiable checkboxes, each naming its
  verification method - full-spec coverage plus grounded edge-case and resilience criteria enumerated at
  plan time, so the user reviews them at the plan approval gate instead of paying for separate improve
  passes later; web apps also seed `## QA Cases` (browser scenarios for playwright-cli);
- **Full-spec discovery (Frame owns it, once)**: explore the actual code first (`agents/explore.md`,
  `reference/plan-grounding.md`) - trace the touched paths, existing utilities, and data shapes - then
  re-read the request/ticket, README, design/API docs, and repo/data rules; turn what they require -
  including edge-case and resilience behavior - into Success Criteria and plan steps grounded in
  observed code, not guesses. Discovery happens here, not in the builder;
- GREENFIELD scope gate: if the new app/tool request is broad, foggy, roadmap-shaped, or clearly
  multi-session, keep the mode `GREENFIELD` and use `reference/wayfinder.md` inside this same run vault
  before freezing `PLAN.md`; write `wayfinder/map.md`, write vertical tickets under
  `wayfinder/tickets/`, name the first unblocked frontier ticket, and carry only that ticket's
  acceptance checks into `GOAL.md` / `PLAN.md`; do not build sibling tickets in the same context;
- record eval intent in `PLAN.md` `## Intent`: user goal, constraints, tradeoffs, rejected approaches;
- record the completion promise in `PLAN.md` `## Intent`: promised outcome, required proof, stop
  condition, and `max_iterations` (default 3). `PLAN.md` is canonical for the approved promise and cap;
  `run-state.json` mirrors `max_iterations` for resume and holds mutable `completion_status`;
- `PLAN.md` `## Steps` + `## Tools & Skills` must be self-sufficient: a fresh-context implementer reads
  ONLY `PLAN.md` and builds it; copy the Success Criteria (including the edge-case and resilience
  criteria) into `PLAN.md` `## Acceptance checklist` so the builder needs no other file;
- **Plan approval gate (blocking, unlike the interview's confirms):** after `PLAN.md` freezes and before
  Build is dispatched — interactive session: present `PLAN.md` and WAIT for the user's explicit OK;
  record it in `## Approval` and set `run-state.json` `plan_approval: "user"`. Autonomous run
  (harness-eval arm, scheduled/background, pre-authorized autonomy): set `Status: auto-approved` with the
  reason and `plan_approval: "auto"`, then proceed;
- record the before state in `QA.md` `## Before`: absent feature/red acceptance check for GREENFIELD,
  reproduced symptom for DEBUG, preserve-baseline capture for LEGACY/brownfield, plus neighbor
  characterization baseline for any shared code/state change;
- DEBUG first tries exact live reproduction. If exact reproduction is unavailable, preserve the
  failure-triggering properties in synthetic/similar data and fill `QA.md` `## Reproduction Fidelity` with
  fidelity level, data source, prod-vs-test deltas, residual risk, and post-deploy confirmation plan;
- record the after target and the command manifest (`QA.md` `## Commands`) from repo-owned or
  evaluator-owned proof commands.
- keep `run-state.json` current as the compact mutable/resumable checkpoint: branch/ref safety,
  plan_approval, phase, iteration, `max_iterations`, `completion_status`, unresolved gates, blockers,
  `regression_ledger`, last proof command, next action, forced reflection, and timestamp.
- **Vault language (one vault, one language)**: all vault prose - `GOAL.md`, `PLAN.md`, `QA.md`,
  `R-LOOP.md`, `Z-*.md` - uses the language of the user's original request; a Korean `GOAL.md` means a
  Korean `PLAN.md` too, and every later writer (builder rows, verifier results, R-LOOP items) keeps
  that language. Structural markers stay verbatim as the templates define them (section headings,
  `- [ ]` checkboxes, `Status:`/`Verdict:`/`Backward-trace: clean`/`auto-approved`/`(surfaced: ...)`
  tokens) because gates grep for them; code identifiers, paths, and commands stay in their original
  form.

## LEGACY entry (order)

1. Map first (`agents/explore.md`, `reference/domain-context.md`).
2. Existing API touched: capture its preserve-baseline (`reference/qa.md` "API behavior baseline").
3. Shared code/state changes: capture the neighbor characterization baseline (`reference/qa.md`).
4. Proceed with the default loop; the before state lands in `QA.md` `## Before` (`reference/delivery-gate.md`).

## Completion promise + loop cap

Frame writes the completion promise and `max_iterations` (`PLAN.md` `## Intent`) before Build. Loop only
while the promise is unproven and a fresh, actionable gap remains. `run-state.json` mirrors the approved
cap (default 3) and tracks mutable `completion_status`. Its initial `forced_reflection` is `null`. At
the cap, replace it with an object containing `what_keeps_failing`, `likely_root_cause`,
`unproven_requirement`, and `regressed_previously_green`; store the smallest next action in the existing
top-level `next_action`, then escalate to the user with that state instead of grinding. Each iteration
re-runs `regression_ledger`; if a previously green check turns red, stop, fix it, and record the result
in `forced_reflection.regressed_previously_green`. Ask only for requirement-level blockers or consent.

## Roles (each role = a fresh-context subagent by default)

Dispatch by default: conductor runs each role as a fresh-context subagent so heavy references load inside
that role, not the conductor. A user invoking `supergoal` for GREENFIELD, DEBUG, or LEGACY work is
explicit authorization to spawn the role-loop subagents described here. Do not ask a second "may I use
subagents?" question unless the user limited delegation, tooling is unavailable, or a normal
safety/permission gate requires consent. Return short structured status only:
changed files, proof output, concerns. Parallelize independent units; order dependent roles. Each dispatch's
model tier is the conductor's choice at dispatch time (stronger tier for novel/algorithmic slices).
Build (1) and Exact Verify/QA (2) are the only mandatory dispatches; the conditional plan attack below
is trigger-gated.

1. **Build** (`agents/executor.md`) - before first edit, confirm blast-radius beyond the explicit target
   (`reference/interview.md`). Implementation must run as a separate fresh-context builder subagent; the
   conductor should not implement code inline. The builder is briefed by the approved `PLAN.md` alone
   (on an R-LOOP re-entry, also the LATEST `R-LOOP.md` section); Build does not start before the plan
   approval gate clears. Then smallest correct change; match surrounding style. Bug: failing test first.
   For any shared code/state change, capture a neighbor characterization baseline FIRST
   (`reference/qa.md` "Characterization baseline"). Refactor/integrate an existing API: capture its
   exact-behavior baseline FIRST. Capture run setup in `QA.md` `## Before` and `run-state.json`.
   - **R-LOOP re-entry**: for each listed item or surfaced criterion, reproduce it with a failing test
     first, then fix with the smallest change - the criterion row is updated to name the failing test
     that now covers it. If an item encodes an `ask-user` choice, contradicts current/API behavior, or
     hardens semantics not required by request/docs or safety, stop and report the decision gate instead
     of optimizing source to it.
   - **Planned coverage** - implement every planned criterion from the plan's `## Acceptance
     checklist`, including the edge-case and resilience criteria; the plan is the whole brief, so do
     not re-read spec docs. If production/source-code domain ambiguity would change user-visible
     behavior, data semantics, permissions, migrations, or API compatibility, stop and record an
     `ask-user` decision gate; do not guess business meaning. Generic no-user coding utility/eval
     fixture: choose the most conservative, reversible default and record it in `GOAL.md`
     `## Decision Gates` (resolved). Add or adjust tests only for grounded `must` behavior.
   - **Green exit** - run the local suite and return only on a green suite; the app is left fully
     functional. Keep the diff minimal; no padding, rewrites, or unrelated cleanup.

2. **Exact Verify/QA vs ground truth (mandatory core; Final Verify/QA)** (browser proof:
   `agents/qa-tester.md`; non-browser/artifact verify: `agents/qa-auditor.md`; security:
   `agents/security-reviewer.md`)
   - Adversarial stance first: re-read the request/docs, `GOAL.md`, `PLAN.md`, `QA.md`, the current
     diff, tests, and repo/data rules; try to disprove the change against required behavior, edge cases,
     and execution evidence before ticking anything. The verifier does not edit source and does not
     weaken tests; findings become R-LOOP fixes, `ask-user` decision gates, or residual risk. Reviewer
     approval is not a substitute for exact proof.
   - Surface hidden requirements while disproving: classify each candidate as `must`, `should`, or
     `ask-user`. Only `must` requirements grounded in request/docs, current/API behavior, repo/data
     rules, or platform safety become new criteria: APPEND each as an unchecked criterion to the run
     vault's `GOAL.md` `## Success Criteria` (`docs/changelog/<YYYY-MM>/<DD-topic>/GOAL.md`; format in
     `templates/GOAL.md`) - what request/docs imply, why it is required though the prompt never stated
     it (`(surfaced: ...)` tag; unchecked box = open) - plus a matching `R-LOOP.md` item for the
     relaunched builder to cover red-first. Do not turn silence into stricter semantics (for example
     throwing on degenerate inputs) when multiple reasonable behaviors exist; record that as an
     `ask-user` decision gate or residual risk instead.
   - Re-run REAL tests and report output. Run the command/browser/API/E2E layer promised in
     `PLAN.md` `## Intent`. If the user expected an actual E2E/live/API/browser run, run it; otherwise mark
     that layer not proven with blocker/residual risk. Exact verification outranks reviewer approval.
   - Diff the implementer's changes (git diff in the run worktree) against `GOAL.md`: tick each Success
     Criterion / QA Case proven met (only the verifier ticks); untick a regressed previously-green
     criterion with the regression evidence.
   - Code-change scenarios use `reference/qa.md` "Scenario stencil (code changes)", including regression
     scenarios and metamorphic relations when no exact oracle exists.
   - Browser UI changes require `reference/qa.md` browser evidence: `Tool: playwright-cli`,
     fixed-route as-is/to-be captures, and passing `bash templates/qa-gate.sh <vault> browser`.
   - Re-run every captured neighbor characterization baseline; unnamed drift is red. API refactor:
     re-capture the same call and diff against the pre-refactor baseline; unintended drift is a red to
     resolve.
   - Close `GOAL.md`: every Success Criterion checkbox is ticked with a verifying check, and
     `Backward-trace: clean` in `QA.md` proves no diff hunk is orphan scope.
   - Exact Verify for neighbor baselines and trace closure is fresh-context: self-review is not a
     regression gate. Unchecked criteria, unresolved REVISE items, and stub/placeholder implementations
     block done.
   - Tick each surfaced criterion in `GOAL.md`, or leave it unchecked with why.
   - Any criterion still unchecked: APPEND a timestamped section to the vault's `R-LOOP.md`
     (`templates/R-LOOP.md`) - checklist of missing/broken items (criterion #, expected vs actual,
     evidence path), regression note, smallest next fix - then the conductor relaunches the builder,
     which reads `PLAN.md` plus the LATEST `R-LOOP.md` section. This R-LOOP loop-back is the only fix
     channel, still capped by `max_iterations`.
   - Update `QA.md`: `## Results` checklist sentences (succinct, plain language), `## Commands`, decision
     gates, intentional drift, residual risk, `Verdict:`. Unresolved `ask-user` findings or missing
     trusted commands block a final done claim and commit (`reference/delivery-gate.md` Commit gate).
   - Every `GOAL.md` box checked: write `Z-<YYYY-MM-DD>.md` (`templates/Z-DONE.md`) with the run branch
     and completion timestamp - never earlier.
   - Update `run-state.json` as the final mutable checkpoint: branch/ref safety, plan approval, phase,
     iteration, `max_iterations`, unresolved gates, blockers, regression state, last proof command, next
     action, forced reflection, mutable `completion_status`, and timestamp.

## Escalation (conditional plan attack; the only extra dispatch)

**Adversarial plan attack (conditional, no src edits)** (`agents/code-reviewer.md`,
`agents/security-reviewer.md`) - only for under-specified, wide-blast-radius,
security/data/concurrency, or latent-correctness work; record the named escalation trigger with the
dispatch in `run-state.json` (`unresolved_gates` or `next_action`). No trigger, no extra dispatch.
Before Build, dispatch reviewers for security, scope, correctness, performance, and operability against
the frozen `PLAN.md`. Accept only findings grounded in request/docs, current code/data, or platform
rules; convert required risks into planned criteria, decision gates, or residual risk. It attacks the
plan BEFORE code exists - post-build disproof already belongs to the verifier, and post-verify gaps
already route through `R-LOOP.md`, so no other standalone pass exists.

Every invoked GREENFIELD / DEBUG / LEGACY run still requires red-green evidence, exact REAL tests/E2E
proof, and DB evidence for data-backed bugs (`reference/db-access.md`). DB proves data state; it does
not replace red-green.

Board (optional): if enabled (`reference/observability.md`), conductor may call `sg-emit --phase <P>` at
phase transitions (Frame/PlanApproval/Build/ExactVerify/Finalize; conditional PlanAttack; Done). Opt-in,
best-effort; observes only, never blocks or gates the loop.

## Guardrails (keep it baseline-first, not Goodhart)

- Generated tests are a SIGNAL to surface hidden requirements, not the oracle. Final verification is REAL
  tests + request/docs. Never weaken/delete a real test; never declare done because self-written tests pass.
- Ambiguous edges are not REDs. If a production/domain behavior change has multiple reasonable meanings,
  classify it as `ask-user` or residual risk; do not invent stricter semantics. If generic/no-user, choose
  a conservative, reversible default and record it.
- Characterization baseline is a regression signal, not a correctness oracle. A known-bug snapshot changes
  only when the bug fix is intentional and named.
- Self-review is not a regression gate: generated explanations can approve behavior drift. Require the
  verifier's adversarial stance, execution evidence, exact verification, and no stub done claims.
- Exact verification outranks reviewer approval: no reviewer, summary, or self-grade can replace the
  actual command/browser/API/E2E run promised for the task. Missing exact proof is `not_proven`, not done.
- Derive every generated test from request/docs, not from a guessed rubric; a wrong generated test the
  builder optimizes to is the failure mode - keep them black-box and spec-anchored.
- Escalation is not free rigor: every extra dispatch needs its named trigger recorded; a run that
  escalates without one is ceremony, not safety.
- Stop condition: cap the Build->Verify loop at `max_iterations` (default 3) with forced reflection, then
  hand the user the open reds and the smallest next action instead of grinding.
