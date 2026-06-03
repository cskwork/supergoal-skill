# Quality gates - production-ready means verified

Gate on project evidence, not benchmark scores or agent claims. A fresh Verify agent re-runs proof from
clean state.

## Two-layer done gate

### 1. Hard gate - deterministic correctness

Build, lint, and project tests must pass. `templates/delivery-gate.sh` is literal bash and must exit 0.
Never edit a gate to pass; paste real output. It runs in the current workspace; clean-state proof is
Verifier's job.

- **GREENFIELD Validate:** `templates/validate-gate.sh <vault>` passes only with `Decision: GO` in
  `brief.md`; NO-GO or missing GO blocks Build.
- **Human Feedback:** `templates/human-feedback-gate.mjs <vault> <Build|Fix>` passes only with the
  two-part packet in `plan.md` and `state.json.approval.status = APPROVED` for the target phase.
- **Plan freeze:** Deliver requires `plan.md` hash to match `state.json.plan_hash`, unless `README.md`
  logs `RE-PLAN:`. `delivery-gate.sh` recomputes the hash (CR-stripped sha256) and fails on mismatch.
- **UI contrast:** UI/UX runs record `UI-tier:` in `verification.md` `## QA` and enumerate pairs to
  `qa/contrast-pairs.json`; `qa-gate.sh` runs `contrast-gate.mjs` and blocks Deliver on any
  sub-threshold pair. Same gate for both Expressive and Functional tiers.
- **Cycle bound:** `templates/cycle-bound.mjs <state.json> <phase>` trips at `max_cycles_per_phase`
  (default 5), bounding retries that fail with a *different* error each cycle (which the
  identical-signature circuit breaker would never catch).

### 2. Soft gate - quality committee

Architect, security reviewer, and code reviewer check maintainability, security, and correctness beyond
tests. Soft approval never overrides failing hard tests. `delivery-gate.sh` requires a `Committee:`
line in `verification.md` naming all three reviewers as APPROVED (no reject/changes-requested).

## Adversarial Verify

`claims.md` is untrusted. A fresh `verifier`/`critic` re-runs every `run-to-prove` from a clean
`git worktree` at the build commit, then writes `verdict: GREEN|RED` to `verification.md`. Any RED
rewinds to Build/Fix. Remove clean worktrees after use.

## Completeness: GREEN is not "safe"

Verify proves only enumerated claims. Bound false-GREEN risk with:

### 1. Coverage map (machine-gated)

Before aggregate verdict, `verification.md` must include `## Coverage`, mapping required items to
evidence. Required list = brief acceptance criteria + domain property/risk checklist from
`reference/domain-rules.md`. It must also include:

- `Not covered:` naming unverified required items with justification, or `none`.
- `Regression tests:` naming permanent tests for fixed REDs, or `none`.

`delivery-gate.sh` fails if these lines are missing.

### 2. Completeness critic

Fresh `completeness-critic` names omitted vectors, flows, and assumptions. Each gap becomes a RED or a
justified `Not covered:` entry.

### 3. Domain-derived checklist

The checklist is per objective, never fixed:

| Domain | Example coverage classes |
|---|---|
| UI/front-end | keyboard, contrast, labels, responsive, empty/error/loading, RTL |
| Data/ETL | idempotency, schema evolution, partial failure, backfill, PII, ordering |
| API/service | statuses, error paths, auth ordering, rate limit, pagination bounds |
| Concurrency/state | lost update, ordering, reentrancy, cleanup on failure |
| CLI/tool | exit codes, stdio/stderr, flags, missing args |
| Security/input | full bypass families, not one case |

Omitted active-domain classes must appear under `Not covered:` with justification.

### 4. High-risk panel

High-severity claims (security, data loss, concurrency/ordering, auth) require >=3 distinct verifier
lenses. Majority RED means RED.

## Validate tests

- For bug fixes/new behavior, the test must fail before and pass after.
- Sanity-check the test path by temporarily breaking the implementation or equivalent; note the check in
  `verification.md`.

## Maintainability

Before Deliver, enforce repo standards: small functions/files, nesting limits, no secrets, specific
types, no dead code, no speculative abstractions, no unrelated reformat churn.

## Cost

Minimize subagent boilerplate and fan-out only behind the topology rule; deep-narrow work should not pay
wide multi-agent cost.
