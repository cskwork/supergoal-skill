---
name: supergoal
description: Run one objective through a gated build/debug/legacy workflow with subagents, Human Feedback before implementation, adversarial verification, and a delivery gate. Use for "/supergoal", "supergoal", "build X end to end", "fix this bug", or "add this feature".
---

# /supergoal

One objective -> gated subagents -> verified delivery.

Use only for whole-objective build/debug/legacy work, or explicit `/supergoal`. For a trivial
single edit, skip this skill and edit directly.
Do not use for pure brainstorming; use `brainstorming`. Do not use for user-driven step-by-step
work; use normal direct collaboration.

## Core Contract

- Conductor orchestrates only: do not write production code, run the build, fix failures, or approve
  your own work. Dispatch role agents from `agents/` and consume compressed evidence summaries.
- Shared state is only the vault: `docs/changelog/<date>-<slug>/`; see `reference/vault.md`.
- `claims.md` is untrusted until a fresh adversarial Verify agent proves it from a clean worktree.
- Never weaken, skip, or edit gate scripts to pass.
- Human Feedback approval is required before Build/Fix.
- Builder != Verifier; Deliver needs hard gates plus architect/security/code-review approval.
- Atomic explanations: name atoms -> define -> connect -> compose. Use before Human Feedback, LEARN
  Bridge, or teaching.

## Step 0 - Mode

Classify first; state the mode to the user in one line.

| Signal in the objective | Mode | Pipeline (see `reference/pipeline.md`) |
|---|---|---|
| "build / make / ship / launch a new app/product/site/tool" | **GREENFIELD** | Intake → **Validate** → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "fix / broken / failing / crash / hang / regression / why does" | **DEBUG** | Intake → Reproduce → Diagnose → **Human Feedback** → Fix → Verify → Deliver |
| "add / integrate X into existing/legacy codebase" — or "improve / refactor / decouple / clean up / make testable" existing code | **LEGACY** | Intake → Explore → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "explain / understand / teach me / how does X work" (learn, no code change) | **LEARN** | Intake → Source → **Bridge** → Teach loop → **Check (explain-back)** → Journal |

If ambiguous, ask one question. LEARN writes no code, uses no implementation gates, and uses chat
explain-back instead of persistent goal tools; see `reference/learn.md`.

## Step 0A - Worktree

For **GREENFIELD**, **DEBUG**, and **LEGACY**, isolate before any repo mutation:

1. Immediately after mode detection, ask the user for the base git branch and ask the user for the
   target branch. If the user gives only base, the default target branch is the base branch.
2. Record `base_branch`, `target_branch`, `run_branch`, `worktree_path`, and
   `worktree_retention` in `state.json` and the run `README.md`.
3. Create the run worktree from the base branch before Intake writes to the repo:
   `git worktree add -b <run_branch> <worktree_path> <base_branch>`.
4. Run implementation phases inside the branch-scoped worktree; original checkout is orchestration
   and final integration only.
5. After the delivery gate passes, ask the user to accept the result. On acceptance, merge the
   accepted worktree commit into the target branch. Keep the three most recent completed run
   worktrees for this repo; prune only the oldest repo-managed completed run worktree when the
   retained count exceeds three. Never prune the active run worktree, original checkout, or manual
   worktrees outside the repo-managed pool. If the user asks for changes, keep the active worktree
   and rewind through the relevant phase.

Required so multiple agents can work without editing the same checkout.

## Routing Rules

- Topology: fan out only wide-and-shallow work; DEBUG and LEGACY default single-driver. Details:
  `reference/pipeline.md`.
- Domain rules: at Intake, use `ten-rules`; record <=10 `## Priority Rules` in vault `README.md`.
- Domain context: GREENFIELD Plan, DEBUG Reproduce/Diagnose, LEGACY Explore load
  `reference/domain-context.md`; default `.domain-agent/`; if missing, ask where to store it and
  add the chosen path to `.gitignore`.
- UI/UX: visual UI loads `reference/ui-ux.md`; Designer uses `reference/taste-skill-v2.md`.
- Plan grounding: before freeze, run `reference/plan-grounding.md`; answer from current docs/code
  before asking the human.

## Gates

1. GREENFIELD Validate: `templates/validate-gate.sh <vault>` requires `Decision: GO`.
2. Plan freezes scope; Build/Fix implements, not redesigns.
3. Human Feedback: two briefs + recorded approval; `human-feedback-gate.mjs` must pass.
4. Verify: fresh adversary reruns every `run-to-prove`; completeness critic names gaps; high-risk
   claims need >=3 verifier lenses.
5. Committee: architect + security-reviewer + code-reviewer all approve.
6. Deliver: `templates/delivery-gate.sh` exits 0 with artifacts, aggregate `verdict: GREEN`,
   `## Coverage`, `Not covered:`, `Regression tests:`, and project tests.
7. Retry bound: max 5 cycles; same normalized error 3x trips `circuit-breaker.mjs`.

## Vault

Create `docs/changelog/<date>-<slug>/` with exactly:
`README.md`, `brief.md`, `plan.md`, `claims.md`, `verification.md`, `state.json`.

## Dispatch

Use harness subagents when available (`Task`/`Agent`, Codex equivalent, etc.). Otherwise run a fresh
isolated pass. Load exactly one `agents/<role>.md`, give minimal vault reads, and collect decisions +
evidence + file refs only. Full procedure: `reference/experts.md`.

## Reference map (load only what the current phase needs)

| Read this | When |
|---|---|
| `reference/pipeline.md` | Always: phase definitions and exit gates |
| `reference/experts.md` | Dispatch: role -> persona -> model tier + harness-agnostic procedure |
| `agents/<role>.md` | Role dispatch: bundled persona prompt; one file per role |
| `reference/vault.md` | At Intake (create vault) and whenever a phase passes state |
| `reference/domain-rules.md` | Intake: route to `ten-rules`; distill <=10 priority rules |
| `reference/domain-context.md` | GREENFIELD Plan, DEBUG Reproduce/Diagnose, LEGACY Explore: repo-local Domain Brief |
| `reference/market-research.md` | GREENFIELD Validate: demand validation |
| `reference/quality-gates.md` | Verify, Review, Deliver: production-readiness gates |
| `reference/debugging.md` | DEBUG Diagnose: `diagnose` feedback-loop method |
| `reference/learn.md` | LEARN: teach/check flow + journaling |
| `reference/plan-grounding.md` | Plan: agent-run grounding before freeze |
| `reference/qa.md` | QA: drive running web/CLI app; record as-is/to-be evidence |
| `reference/ui-ux.md` | Visual UI jobs: taste-skill overlay |
| `reference/taste-skill-v2.md` | UI/UX Designer Build + QA pre-flight; large, load only then |

### Template scripts (referenced by the gates above)

| Script | Gate |
|---|---|
| `templates/delivery-gate.sh` | Deliver: hard exit-0 artifact + test gate |
| `templates/validate-gate.sh <vault>` | GREENFIELD Validate: checks `Decision: GO` before Build |
| `templates/qa-gate.sh <vault> <browser\|cli>` | QA: checks `## QA`; browser apps need `as-is`/`to-be`, `Tool:`, and non-agent-browser `Fallback:` |
| `templates/contrast-gate.mjs <pairs.json>` | UI/UX QA: computes WCAG contrast (body AAA, other text AA); no eyeballing |
| `templates/human-feedback-gate.mjs <vault> <Build\|Fix>` | Human Feedback: checks both briefs + recorded approval |
| `templates/circuit-breaker.mjs <state.json> <sig>` | Failed fix cycle: trips after 3 identical normalized error signatures |
| `templates/domain-agent/` | Domain context first-run scaffold copied to the target repo knowledge path |

## Escalation & stop conditions

- Circuit breaker tripped (`circuit-breaker.mjs` exits 1): stop, root-cause to user.
- Validate finds no demand evidence (GREENFIELD): stop, report; do not build on spec.
- Human rejects or changes the plan: do not Build/Fix; re-open Plan/Diagnose, update vault, ask again.
- Delivery gate cannot pass after fixes: report the failing check; never fake the gate.
- Destructive or irreversible step needed (drop data, force-push, external publish): ask first.

## Final checklist (before claiming done)

- [ ] Mode stated and correct pipeline run
- [ ] Domain Brief created or explicitly skipped, and any first-run `.domain-agent/` path is ignored
- [ ] Plan grounded (`reference/plan-grounding.md`, agent-answered) before the plan froze
- [ ] Human Feedback stage produced the plain-language and technical briefs, and approval was recorded before Build/Fix
- [ ] Every `claims.md` entry has a GREEN verdict in `verification.md` from the adversarial pass
- [ ] `verification.md` carries a `## Coverage` map (acceptance criteria + domain checklist), a `Not covered:` line, and a `Regression tests:` line; a completeness critic found no un-named gap
- [ ] architect + security + code-review all approved
- [ ] `delivery-gate.sh` exited 0; paste the output as evidence
- [ ] the run's `README.md` captures the key choices and any escalations
- [ ] Reported what was verified, with command output — no unverified "done"
