---
name: supergoal
description: Run one objective through a gated build/debug/legacy workflow with subagents, Human Feedback before implementation, adversarial verification, and a delivery gate. Use for "/supergoal", "supergoal", "build X end to end", "fix this bug", or "add this feature".
---

# /supergoal

One objective in, verified result out. This skill is the **conductor**: it decomposes the objective,
dispatches **expert subagents** through a **forward-only pipeline**, and claims success only after
machine-checkable gates pass.

**Orchestrate only.** During a run, the conductor never edits, writes, runs, builds, or fixes code,
even for one-line work. Every unit is dispatched to a subagent and gated. If the whole request is one
trivial edit, do it directly instead of using this skill.

The system is gated lanes over one shared vault. `claims.md` is untrusted until a fresh adversary
re-verifies it. The delivery gate is literal bash and is never edited to pass. Use the harness's
sub-agent mechanism (Claude Code `Task`/`Agent`; other CLIs use their equivalent). Role personas live
in `agents/`; nothing extra is installed. Coding/debug runs use `git worktree`; Verify uses a clean
worktree at the build commit.

## Why this exists

Big single-agent runs drift: skipped validation, self-approved "done", unverified claims.
`/supergoal` enforces senior-team discipline: validate first, separate builder from verifier, prove
claims by re-running them, and deliver only on evidence.

## Use when

- "/supergoal build a habit-tracker app and ship it"
- "/supergoal the checkout page hangs intermittently in production — fix it"
- "/supergoal add SSO to our legacy Django monolith"
- The user hands off a whole objective and wants the full process run autonomously.

## Do NOT use when

- A single, well-scoped edit ("rename this variable") — do it directly.
- Pure brainstorming with no intent to build — use `brainstorming`.
- The user wants to drive each step themselves — use `ultrawork`.


## Atomic concept decomposition

Break composite concepts into atomic concepts before user-facing explanations, Human Feedback briefs, LEARN Bridge output, or teaching turns.

Order: name the atoms, define each atom, show how they connect, then compose the full flow. Do not let one label hide source data, display policy, persistence, and fallback behavior.

## Step 0 — Mode detection (ALWAYS do this first)

Classify the objective first. State the mode to the user in one line before proceeding.

| Signal in the objective | Mode | Pipeline (see `reference/pipeline.md`) |
|---|---|---|
| "build / make / ship / launch a new app/product/site/tool" | **GREENFIELD** | Intake → **Validate** → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "fix / broken / failing / crash / hang / regression / why does" | **DEBUG** | Intake → Reproduce → Diagnose → **Human Feedback** → Fix → Verify → Deliver |
| "add / integrate X into existing/legacy codebase" — or "improve / refactor / decouple / clean up / make testable" existing code | **LEGACY** | Intake → Explore → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "explain / understand / teach me / how does X work" (learn, no code change) | **LEARN** | Intake → Source → **Bridge** → Teach loop → **Check (explain-back)** → Journal |

If ambiguous, ask one clarifying question, then proceed. Mode selects the pipeline; gates and vault
contracts stay shared.

LEARN is the exception: no code writes, no implementation gates, no persistent goal tools
(`create_goal`/`update_goal`). Its Check gate is chat explain-back only; see `reference/learn.md`.

## Step 0A — Branch-scoped worktree setup (coding/debug modes only)

For **GREENFIELD**, **DEBUG**, and **LEGACY**, isolate the run before any repo mutation.

1. Immediately after mode detection, ask the user for the base git branch and ask the user for the
   target branch. If the user just gives the base, the default target branch is the base branch.
2. Record `base_branch`, `target_branch`, `run_branch`, and `worktree_path` in `state.json` and the
   run's `README.md`. Use a unique `run_branch` such as `supergoal/<date>-<slug>`.
3. Create the run worktree from the base branch before Intake writes to the repo:
   `git worktree add -b <run_branch> <worktree_path> <base_branch>`.
4. Run all implementation phases inside that branch-scoped worktree. The original checkout is only
   for orchestration, branch inspection, and final integration.
5. After the delivery gate passes, ask the user to accept the result. On acceptance, merge the
   accepted worktree commit into the target branch. Then remove the run worktree only after the user
   accepts. If the user asks for changes, keep the worktree and rewind through the relevant phase.

Do not skip this for small objectives. It prevents checkout conflicts: multiple agents can work
without editing the same checkout, and final integration stays explicit.

**Topology rule:** task shape picks architecture. Fan out only for *wide-and-shallow* work
(validation research, independent modules). Use a *single driving agent* for *deep-and-narrow* work,
so **DEBUG and LEGACY default to single-driver** with helpers only for independent probes. **All
modes require Human Feedback before the first implementation write**. Details:
`reference/pipeline.md`.

**Domain routing** (advisory): right after mode detection, route the objective through the
`ten-rules` skill and distill **<=10 abstract priority rules** for the detected domain(s). Record
them once in the run's `README.md` (`## Priority Rules`) and carry them into every phase. They guide
quality; they never replace gates. Mechanism:
`reference/domain-rules.md`.

**Domain context overlay**: for GREENFIELD Plan, DEBUG Reproduce/Diagnose, and LEGACY Explore, load
`reference/domain-context.md`. It retrieves or initializes repo-local knowledge at the target repo
root, default `.domain-agent/`, then writes a compact `## Domain Brief` to the run `README.md`.
If no knowledge pack exists, ask where to store it and add the chosen path to `.gitignore` before
writing local knowledge. Saved context routes exploration; current docs/code remain authoritative.

**UI/UX overlay**: if the objective ships user-facing visual UI (landing page, redesign, "make it
look good", frontend look-and-feel), load `reference/ui-ux.md`. It makes
`reference/taste-skill-v2.md` the design authority and adds Designer + pre-flight QA. Load only on
demand; modes and gates do not change.

**Plan grounding**: before `plan.md` freezes, the planner grounds it in the project's own
domain/architecture. This is agent-run; the human approval remains the later Human Feedback gate.
Feature/novel work runs a decision-tree pressure test: resolve dependent choices one branch at a
time, challenge terminology against selected knowledge, stress concrete scenarios, and answer from
explored docs/code before asking the human. Improve/refactor work self-runs an
`improve-codebase-architecture`-style pass.
Method: `reference/plan-grounding.md`.

## The non-negotiable gates

Never weaken, skip, or edit these gates to pass (`reference/quality-gates.md`).

1. **Validate-before-build** (GREENFIELD): Build won't open until `templates/validate-gate.sh <vault>` exits 0 (requires `Decision: GO` in `brief.md`). Details: `reference/quality-gates.md`.
2. **Plan freezes scope**: `plan.md` is written once and frozen; Build/Fix implements it, does not redesign.
3. **Human Feedback before implementation**: after the brief, reproduction/diagnosis, and plan are ready, pause for explicit human approval. `plan.md` must contain a top plain-language brief and a lower technical novice-dev brief; `templates/human-feedback-gate.mjs <vault> <Build|Fix>` must pass before Build/Fix opens.
4. **Builder != Verifier**: the coding agent never approves its own work. A fresh **adversarial
   Verify** agent re-runs every `run-to-prove` in `claims.md` from a clean worktree at the build
   commit, never the builder's dirty tree. Before GREEN, a **completeness critic** names omissions;
   **high-severity claims get a >=3-lens verifier panel** (majority RED -> RED).
   `reference/quality-gates.md`.
5. **Multi-expert review before deliver**: architect + security-reviewer + code-reviewer run in parallel; ALL must approve (`reference/experts.md`).
6. **Literal delivery gate**: `templates/delivery-gate.sh` must exit 0: required artifacts present,
   aggregate `verdict: GREEN`, `## Coverage` map with `Not covered:` + `Regression tests:` lines,
   `Decision: GO` for greenfield, project tests pass. GREEN means *every enumerated claim was
   re-verified*, not *safe*. No "done" without this.
7. **Bounded retry + circuit breaker**: max 5 fix cycles per phase; the same normalized error
   signature 3x trips `templates/circuit-breaker.mjs` -> stop and root-cause to user. Mechanism:
   `reference/vault.md`.

## The vault (only cross-phase state)

Every run creates `docs/changelog/<date>-<slug>/` in the target repo. This is the only cross-phase
blackboard and the permanent changelog. Fresh subagent contexts communicate through it. Six files:
`README.md`, `brief.md`, `plan.md`, `claims.md`, `verification.md`, `state.json`. Full contract:
`reference/vault.md`.

## Expert roster

Dispatch roles as fresh subagents with the minimum vault read-set. Each persona is bundled in
`agents/<role>.md`, making dispatch harness-agnostic: Claude Code, Codex, agy, or any CLI selects the
file, spawns a fresh sub-context (or isolated pass if no sub-agent mechanism exists), and collects
only its summary. Claude Code plugin wrapping is optional. Verifier read scope is harness-enforced
where available (`claims.md` + source only). Full table/procedure: `reference/experts.md`. UI/UX jobs
also dispatch **Designer** with `reference/taste-skill-v2.md` (see `reference/ui-ux.md`).

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
