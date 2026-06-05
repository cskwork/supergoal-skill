---
name: supergoal
description: Run one objective through a gated build/debug/legacy workflow with subagents, Human Feedback before implementation, adversarial verification, and a delivery gate. Use for "/supergoal", "supergoal", "build X end to end", "fix this bug", "add this feature", or "QA / verify data only, no code change".
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
- Clarifying interview is required before plan freeze for GREENFIELD/DEBUG/LEGACY when the request is
  underspecified; resolve code-answerable questions by reading code, ask at most 3-5 high-leverage
  questions, and gate the freeze on must-have answers. See `reference/interview.md`. LEARN skips it.
- Human Feedback approval is required before Build/Fix.
- Builder != Verifier; Deliver needs hard gates plus architect/security/code-review approval.
- Atomic explanations: visible atom map -> plain definition -> process trace -> composed
  explanation. Use before Human Feedback, LEARN Bridge, or teaching. Use natural user-facing labels
  in the output language; Korean should say `핵심 용어`/`구성 요소`, not literal `원자`.
  A glossary alone is not enough; trace trigger -> read/derive -> decide -> write/call ->
  fallback/stop -> result.
- Output language: write agent-authored prose in the user's language (match the language the user
  writes in; default to English only when it is unknown). This covers `README.md`, `brief.md`,
  `plan.md` (incl. both Human Feedback briefs), `claims.md` and `verification.md` descriptions, run
  audit notes, changelog entries, LEARN journals, and every agent's returned summary. Keep
  machine-checked anchors, structural keys, code, identifiers, file paths, shell commands, and commit
  messages in canonical English so gates keep matching — e.g. `Decision: GO`, `verdict: GREEN`,
  `## Coverage`, `Not covered:`, `Regression tests:`, `Committee:`, `RE-PLAN:`, `APPROVED`,
  `run-to-prove`, and `## Human Feedback` headings stay verbatim; only their surrounding prose is
  translated.

## Step 0 - Mode

Classify first; state the mode to the user in one line.

| Signal in the objective | Mode | Pipeline (see `reference/pipeline.md`) |
|---|---|---|
| "build / make / ship / launch a new app/product/site/tool" | **GREENFIELD** | Intake → **Validate** → **Interview** → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "fix / broken / failing / crash / hang / regression / why does" | **DEBUG** | Intake → Reproduce → Diagnose (+ **Interview**: hypothesis re-rank) → **Human Feedback** → Fix → Verify → Deliver |
| "add / integrate X into existing/legacy codebase" — or "improve / refactor / decouple / clean up / make testable" existing code | **LEGACY** | Intake → Explore → **Interview** → Plan → **Human Feedback** → Build → Verify → QA → Deliver |
| "explain / understand / teach me / how does X work" (learn, no code change) | **LEARN** | Intake → Source → **Bridge** → Teach loop → **Check (explain-back)** → Journal |
| "learn / onboard / map this codebase", "build a domain wiki", "도메인 파악" (learn for the agent, persist a wiki) | **LEARN-DOMAIN** | Intake → Survey → **Scope checkpoint** → Map → Deepen → **Ground** → Persist → **Onboard** → Freshness |
| "QA only / verify / 검증만 / 데이터 정합성 / 데이터 비교 / API 수정 전후 확인 / A/B" (exercise a running app, no code change) | **QA-ONLY** | Intake → Target & Access → **Scenario checkpoint** → Exercise → Cross-check → **Report** → Persist |
| "make a skill / 스킬 만들어 / learn new skill / make skill from history / 이거 자주 하는데 스킬로" (turn repeated work into a reusable skill, no product code) | **SKILL-MINE** | Intake → Window → Mine → Rank → Suggest → **Human pick/reject** → Forge → Verify → Install → Journal |

If ambiguous, ask one question. LEARN writes no code, uses no implementation gates, and uses chat
explain-back instead of persistent goal tools; see `reference/learn.md`.

QA-ONLY exercises an already-running app (and a read-only DB) to QA behavior or compare data, writes no
production code, creates no worktree, and runs none of the implementation gates. It produces a
human-friendly `report.md` (what worked / didn't / discovered) and persists a reusable, indexed QA suite
to `.domain-agent/qa/` so the same check re-runs fast. If the request needs a fix or feature, route to
DEBUG/LEGACY instead. See `reference/qa-only.md`.

LEARN vs LEARN-DOMAIN: LEARN teaches a human and writes only a chat-time journal. LEARN-DOMAIN learns
*for the agent* and persists a source-grounded `.domain-agent/` wiki (agentic discovery, no embeddings;
Aider-style repo map; bottom-up summaries; execution-grounded verification) so later build/debug/legacy
runs route fast. Its final Onboard step also renders one self-contained `onboarding.html` handbook for
humans (derived from the pack; the markdown pack stays the agent's source of truth). It writes no
production code; see `reference/learn-domain.md`.

SKILL-MINE turns repeated work into a reusable skill. It mines recent agent session history
(`~/.claude/projects/*.jsonl`, adaptive 7-30 day window), surfaces 3-5 candidate skills ranked by
frequency x payoff, and lets the user pick / reject / name a new one. On approval it forges ONE
cross-agent-portable `SKILL.md` (agentskills.io standard) and installs it to each chosen agent dir
(`~/.claude/skills`, `~/.codex/skills`, `~/.config/opencode/skills`, `~/.hermes/skills`; no auto-sync).
The human pick is a hard gate - it never creates or installs a skill the user did not approve. It writes
no production code and no worktree; see `reference/skill-mine.md`.

## Step 0A - Worktree

For **GREENFIELD**, **DEBUG**, and **LEGACY**, isolate before any repo mutation:

1. Immediately after mode detection, resolve the target repo root, then ask the user for the base git
   branch (the source branch) and ask the user for the target branch unless both are explicitly
   provided. If the user gives only base, the default target branch is the base branch. Before any
   vault write or worktree command, verify both refs exist in the target repo before creating the
   worktree. If either ref is missing, ask for corrected source/target branch names; do not
   substitute nearby branch names or create files.
2. Record `base_branch`, `target_branch`, `run_branch`, `worktree_path`, and
   `worktree_retention` in `state.json` and the run `README.md`.
3. Create the run worktree from the base branch before Intake writes to the repo:
   `git worktree add -b <run_branch> <worktree_path> <base_branch>`.
4. Run implementation phases inside the branch-scoped worktree; original checkout is orchestration
   and final integration only.
5. After the delivery gate passes, ask the user to accept the result. On acceptance, integrate only by
   a merge commit into `target_branch`, normally `git merge --no-ff <run_branch>` from a clean target
   checkout or clean target integration worktree. Never manually port/copy/apply the accepted diff to
   the target branch, never cherry-pick/squash/rebase it, and never replace the merge with direct
   target-branch edits unless the human explicitly overrides the merge-commit policy after being told
   the result will not be a merge commit. If a repo guard, dirty unrelated worktree, missing checkout,
   or permission issue blocks the merge commit, stop and report the blocker; do not invent a fallback.
   Resolve merge conflicts only inside the active merge state, preserving target-branch behavior, then
   commit the merge. Record the merge commit SHA and target branch in the run `README.md` or
   `verification.md`. Keep the three most recent completed run worktrees for this repo; prune only the
   oldest repo-managed completed run worktree when the retained count exceeds three. Never prune the
   active run worktree, original checkout, or manual worktrees outside the repo-managed pool. If the
   user asks for changes, keep the active worktree and rewind through the relevant phase.

Required so multiple agents can work without editing the same checkout.

## Routing Rules

- Topology: fan out only wide-and-shallow work; DEBUG and LEGACY default single-driver. Details:
  `reference/pipeline.md`.
- Domain rules: at Intake, use `ten-rules`; record <=10 `## Priority Rules` in vault `README.md`.
- Domain context: GREENFIELD Plan, DEBUG Reproduce/Diagnose, LEGACY Explore load
  `reference/domain-context.md`; default `.domain-agent/`; if missing, ask where to store it and
  add the chosen path to `.gitignore`.
- UI/UX: user-facing UI loads `reference/ui-ux.md`, which routes to a tier — Expressive (landing/
  marketing) uses `reference/taste-skill-v2.md`; Functional (dashboard/table/admin/internal tool) uses
  `reference/functional-ui.md`. Designer implements to the named tier.
- Interview: before plan freeze, run `reference/interview.md` for GREENFIELD/DEBUG/LEGACY; gated on
  ambiguity, code-answerable questions resolved by reading code first, 3-5 questions max, one round.
- Plan grounding: before freeze, run `reference/plan-grounding.md`; answer from current docs/code
  before asking the human.

## Gates

1. GREENFIELD Validate: `templates/validate-gate.sh <vault>` requires `Decision: GO`.
2. Plan freezes scope; Build/Fix implements, not redesigns.
3. Human Feedback: two briefs + recorded approval; `human-feedback-gate.mjs` must pass.
4. Verify: fresh adversary reruns every `run-to-prove`; completeness critic names gaps; high-risk
   claims need >=3 verifier lenses.
5. Committee: architect + security-reviewer + code-reviewer all approve; recorded as a `Committee:`
   line in `verification.md` that the delivery gate checks.
6. Deliver: `templates/delivery-gate.sh` exits 0 with artifacts, aggregate `verdict: GREEN`,
   `## Coverage`, `Not covered:`, `Regression tests:`, the `Committee:` line (all three APPROVED),
   `plan.md` matching `state.json.plan_hash` (or a `RE-PLAN:` line in `README.md`), and project tests.
7. Retry bound: `cycle-bound.mjs` trips at max 5 cycles/phase (any errors); the same normalized error
   3x trips `circuit-breaker.mjs`.

## Vault

Create `docs/changelog/<date>-<slug>/` with exactly:
`README.md`, `brief.md`, `plan.md`, `claims.md`, `verification.md`, `state.json`.

LEARN writes a journal instead of a vault; QA-ONLY uses a reduced run folder (`brief.md`,
`verification.md`, `report.md`, `qa/`, `state.json` — no `plan.md`/`claims.md`); see
`reference/qa-only.md`. SKILL-MINE writes no vault either — only the generated skill directory, its
install targets, and a `learn/skill-mined-<name>-<date>.md` journal; see `reference/skill-mine.md`.

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
| `reference/learn-domain.md` | LEARN-DOMAIN: agentic discovery + bottom-up summaries + grounded `.domain-agent/` wiki |
| `reference/interview.md` | GREENFIELD/LEGACY Plan start, DEBUG Diagnose end: ambiguity-gated 3-5 question interview / hypothesis re-rank before plan freeze |
| `reference/plan-grounding.md` | Plan: agent-run grounding before freeze |
| `reference/qa.md` | QA: drive running web/CLI app; record as-is/to-be evidence |
| `reference/qa-only.md` | QA-ONLY mode: no-code QA / data-comparison run; report + persisted reusable suite |
| `reference/skill-mine.md` | SKILL-MINE mode: mine history → suggest 3-5 skills → human pick → forge portable SKILL.md → install |
| `reference/db-access.md` | QA cross-check: read-only, DB-independent (mysql/postgres/sqlite) data access |
| `reference/ui-ux.md` | Any user-facing UI: classify surface into Expressive vs Functional tier |
| `reference/taste-skill-v2.md` | Expressive-tier Designer Build + QA pre-flight; large, load only then |
| `reference/functional-ui.md` | Functional-tier (dashboard/table/admin) Designer Build + QA; lighter baseline |

### Template scripts (referenced by the gates above)

| Script | Gate |
|---|---|
| `templates/delivery-gate.sh` | Deliver: hard exit-0 artifact + test gate |
| `templates/validate-gate.sh <vault>` | GREENFIELD Validate: checks `Decision: GO` before Build |
| `templates/qa-gate.sh <vault> <browser\|cli>` | QA: checks `## QA`; browser apps need `as-is`/`to-be`, `Tool:`, non-agent-browser `Fallback:`; UI runs (`UI-tier:`) run the contrast gate on `qa/contrast-pairs.json` |
| `templates/qa-only-gate.sh <vault> <browser\|cli>` | QA-ONLY terminal gate: `report.md` anchors + `qa-gate.sh` evidence + `action_count <= action_cap` + DB read-only |
| `templates/qa-report.md` | QA-ONLY human report skeleton: `What worked` / `What didn't` / `What I discovered` / `How to re-run` |
| `templates/contrast-gate.mjs <pairs.json>` | UI/UX QA: computes WCAG contrast (body AAA, other text AA); no eyeballing |
| `templates/human-feedback-gate.mjs <vault> <Build\|Fix>` | Human Feedback: checks both briefs + recorded approval |
| `templates/circuit-breaker.mjs <state.json> <sig>` | Failed fix cycle: trips after 3 identical normalized error signatures |
| `templates/cycle-bound.mjs <state.json> <phase>` | Failed cycle: trips at `max_cycles_per_phase` (default 5) regardless of error identity |
| `templates/domain-agent/` | Domain context first-run scaffold copied to the target repo knowledge path |
| `templates/learn-grounding-gate.mjs <knowledgePath>` | LEARN-DOMAIN Ground: every load-bearing invariant/flow fact carries a `Grounding: verified\|unverified` marker; `index.md` has a concrete entry point; basic secret scan |
| `templates/domain-onboarding.html` | LEARN-DOMAIN Onboard: self-contained human handbook skeleton, filled only from the persisted pack (no external scripts/CDN) |
| `templates/skill-mine/mine.mjs` | SKILL-MINE Mine: reads `~/.claude/projects/*.jsonl`, adaptive window, emits frequent tool n-grams + Bash signatures + intent hints |
| `templates/skill-frontmatter-gate.mjs` | SKILL-MINE Verify: checks generated `SKILL.md` name/description(+`when_to_use` ≤1536)/body limits; exits 0 only when portable |
| `templates/skill.md.template` | SKILL-MINE Forge: portable `SKILL.md` skeleton (frontmatter + When to use + Steps + Notes) |

## Escalation & stop conditions

- Circuit breaker tripped (`circuit-breaker.mjs` exits 1): stop, root-cause to user.
- Validate finds no demand evidence (GREENFIELD): stop, report; do not build on spec.
- Human rejects or changes the plan: do not Build/Fix; re-open Plan/Diagnose, update vault, ask again.
- Delivery gate cannot pass after fixes: report the failing check; never fake the gate.
- Destructive or irreversible step needed (drop data, force-push, external publish): ask first.

## Final checklist (before claiming done)

- [ ] Mode stated and correct pipeline run
- [ ] Domain Brief created or explicitly skipped, and any first-run `.domain-agent/` path is ignored
- [ ] Clarifying interview run or explicitly skipped (logged in `README.md`) before the plan froze; must-have answers or user-approved assumptions recorded in `plan.md` `## Interview`
- [ ] Plan grounded (`reference/plan-grounding.md`, agent-answered) before the plan froze
- [ ] Human Feedback stage produced the plain-language and technical briefs, and approval was recorded before Build/Fix
- [ ] Every `claims.md` entry has a GREEN verdict in `verification.md` from the adversarial pass
- [ ] `verification.md` carries a `## Coverage` map (acceptance criteria + domain checklist), a `Not covered:` line, and a `Regression tests:` line; a completeness critic found no un-named gap
- [ ] architect + security + code-review all approved
- [ ] `delivery-gate.sh` exited 0; paste the output as evidence
- [ ] Accepted work, if integrated, landed on `target_branch` as an explicit merge commit
- [ ] the run's `README.md` captures the key choices and any escalations
- [ ] Reported what was verified, with command output — no unverified "done"
