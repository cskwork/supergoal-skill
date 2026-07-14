---
name: supergoal
description: Use for "fix this bug", "add/build/plan/spec this feature", "prototype this", "QA / verify", "code review", "improve architecture", "learn codebase", "make skill", or "eval a harness".
---

# About

One objective -> smallest correct change -> verified against ground truth. If invoked, run this skill's
contract instead of downgrading to an inline shortcut. `SKILL.md` is the router; `reference/` carries procedure.

**Standing rules (read first, every mode).** Before classifying the mode, read
`.supergoal/rules/RULES.md` if present. Honor it across phases as top-priority preference, but rules never
weaken safety gates. Create/edit it only when the user explicitly asks (`reference/rules.md`).

## Core principles

- Ground truth beats proxy: re-run REAL tests, re-read request/docs, and do not optimize to self-grading.
- Exact proof beats review; implementation is delegated to a builder subagent.
- Smallest correct change; match surrounding code. Scope-minimalism governs code surface area, not UI
  quality: polished user-facing UI is baseline correctness.
- GREENFIELD / DEBUG / LEGACY code changes use Before/After Eval before Build: prove before, target after, and delta with trusted commands (`reference/delivery-gate.md`).
- Ask only when genuinely ambiguous; resolve code-answerable questions by reading the code.
- Docs language: for persistent repo docs (`docs/**`, run vaults, `.domain-agent/**`, ADR/spec/changelog), match the target repo's dominant prose language; mixed/none -> the user's language. Keep identifiers, paths, commands, and machine-checked anchors in canonical English so checks keep matching.
- Hard stops: a destructive or irreversible step (drop data, force-push, external publish) needs explicit consent; if the real tests cannot pass, report it - never fake a pass.

## Run isolation (GREENFIELD / DEBUG / LEGACY that edits code)

After mode detection, resolve the source/base branch and target/integration branch (repo policy, else
ask). Verify both refs before mutating files, then create a run worktree from the source/base branch. Do
all code work there. Do not mutate the original checkout. Commit or merge only into the verified
target/integration branch after verification and user acceptance. Commit is hard-gated by the Commit gate
(`reference/delivery-gate.md`, backstop `templates/commit-gate.sh`): non-green means fix/ask, never commit
on assumption. Full contract: `reference/role-loop.md`.

## Mode (classify, state it in one line)

| Signal in the objective | Mode | Route |
|---|---|---|
| build / make / ship a new app/tool | GREENFIELD | default loop; broad/foggy builds first use a `wayfinder/` Frontier Map inside the run vault, then deliver one selected frontier ticket |
| fix / broken / failing / crash / why does | DEBUG | default loop; observe live symptom, then failing-test repro (`reference/debugging.md`, driver persona `agents/debugger.md`); web: `reference/qa.md`, `reference/playwright-cli.md` |
| add / integrate / refactor existing code | LEGACY | default loop; map first (`agents/explore.md`, `reference/domain-context.md`); optional DB evidence (`reference/db-access.md`); existing API: capture its exact behavior first as a preserve-baseline; shared code/state changes: characterization baseline (`reference/qa.md`) |
| spec / requirements first / break down / tickets / roadmap / big vague effort / frontier / what should we do first | WAYFINDER | map the destination, optional ticket-depth requirements, ticket graph, blockers, and next frontier; no product code by default (`reference/wayfinder.md`) |
| prototype / spike / try variants / prove approach before build | PROTOTYPE | throwaway proof that answers one question, then delete/quarantine or route to delivery (`reference/prototype.md`) |
| explain / teach / how does X work (no code) | TEACH | stateful `teach/<topic>/` workspace (`reference/teach.md`); lessons must pass `node templates/teach-lesson-gate.mjs` |
| learn / onboard / map this codebase (persist a wiki) | LEARN-DOMAIN | Survey -> Map -> Ground -> Onboard a `.domain-agent/` wiki (`reference/learn-domain.md`; gate `learn-grounding-gate.mjs`) |
| QA / verify / 검증만 / compare data (no code) | QA-ONLY | Impact Matrix QA (`reference/qa-only.md`; gate `templates/qa-only-gate.sh`) |
| review / audit this code/diff/PR (no fixes) | REVIEW-ONLY | `reference/review-only.md` |
| improve the architecture / find refactoring opportunities / 구조 개선 | ARCHITECTURE | friction survey -> candidates -> grill the pick -> route to LEGACY/WAYFINDER (`reference/arch.md`) |
| test harness/skill effectiveness / with vs without / does the skill help / measure skill lift | HARNESS-EVAL | `reference/harness-eval.md` |
| turn repeated work into a reusable skill | SKILL-MINE | `reference/skill-mine.md` |

The no-code/utility/planning modes - **QA-ONLY**, REVIEW-ONLY, ARCHITECTURE, WAYFINDER, PROTOTYPE, TEACH,
LEARN-DOMAIN, HARNESS-EVAL, SKILL-MINE - write no product code by default and confirm before installing
anything. PROTOTYPE may write throwaway sandbox code; it cannot ship until routed back through delivery.

**UI/UX overlay (any mode shipping user-facing UI).** Load `reference/ui-ux.md` at Frame; apply the
Expressive/polished baseline by default (`reference/taste-skill-v2.md` is the authority for ALL
user-facing UI), through Build and Verify. GREENFIELD frontend: always; LEGACY: only new UI (else reuse
the existing design system); non-visual work (lib, API, backend, CLI): skip.

**Board overlay (optional).** If the live dashboard is enabled, the conductor calls `sg-emit` at each
phase transition; it observes only, never gates (`reference/observability.md`).

## Default loop (GREENFIELD / DEBUG / LEGACY) - five gates, fresh context per gate

Work runs in fresh-context subagents by default; the dispatching agent is the conductor. When the user
invokes `supergoal` for GREENFIELD, DEBUG, or LEGACY work, that invocation is explicit authorization
to use the role-loop subagents. Do not ask a second "may I spawn agents?" question unless the user
limited delegation, tooling is unavailable, or a safety/permission gate requires consent. Parallelize
independent QA shards/review dimensions. Implementation/debug/legacy runs require red-green, plus DB
evidence when persisted data is load-bearing. Full contract: `reference/role-loop.md`.

Mandatory core: Frame -> Plan approval -> Build -> Exact Verify/QA -> Finalize. Default cost envelope:
one builder + one verifier dispatch per iteration; the only extra dispatch is the conditional plan
attack, trigger-gated with the trigger recorded (`reference/role-loop.md`). There are no standing
critic, fixer, improver, or standalone-review roles: Frame owns full-spec and edge-case discovery
(into the plan the user approves), Build implements only the approved plan, the verifier surfaces gaps
with its adversarial stance, and the relaunched builder fixes them through `R-LOOP.md`. Every gate
exits with the app fully functional: Build returns only on a green suite, Exact Verify/QA proves it
against ground truth, Finalize commits it.

1. **Frame.** Write `GOAL.md` FIRST from `templates/GOAL.md`: `## Original Request` (user prompt
   verbatim), refined `## Spec`, falsifiable `## Success Criteria` checkboxes each naming its
   verification - full-spec coverage plus grounded edge-case and resilience criteria enumerated at plan
   time, so the user reviews them at the approval gate - and web apps' `## QA Cases`. Discovery happens
   here, once: explore the actual code (`agents/explore.md`, `reference/plan-grounding.md`), re-read
   the request/ticket, README, design/API docs, and repo/data rules, and copy the criteria into
   `PLAN.md` `## Acceptance checklist` (the builder reads no other file).
   GREENFIELD
   broad/foggy build requests use `reference/wayfinder.md` as an internal scope gate: preserve the
   destination in `wayfinder/map.md`, write vertical tickets under `wayfinder/tickets/`, select one
   frontier ticket, and carry only that ticket's acceptance checks into the delivery `GOAL.md` /
   `PLAN.md`. Write a completion promise in `PLAN.md` `## Intent`: outcome, proof, stop condition,
   `max_iterations` (default 3). Ask <=5 high-leverage questions only when needed; confirm
   wide/destructive/behavior-changing blast radius after grounding (`reference/interview.md`); deep
   requirements interviews may dispatch `agents/analyst.md`, and architecture calls
   `agents/architect.md`. UI: load `reference/ui-ux.md`. Code-mode runs: create `QA.md` and
   `run-state.json` from templates and record the Before/After Eval.
2. **Plan approval (user review of the goal plan).** Freeze `PLAN.md` (self-sufficient: steps, tools &
   skills, verification strategy), then clear the plan approval gate - interactive: the user's explicit
   OK; autonomous run: auto-approved, recorded in `## Approval`. Build never starts before this gate.
3. **Build.** Implementation runs in a separate fresh-context builder subagent briefed by the approved
   `PLAN.md` alone (on an R-LOOP re-entry, also the latest `R-LOOP.md` section). Smallest correct
   change, test-first, surrounding style. Bug: failing test first (`reference/debugging.md`). Shared
   code/state changes: capture neighbor characterization baseline before editing. The builder covers
   every planned criterion in the plan's `## Acceptance checklist`, including the edge-case and
   resilience criteria - discovery already happened at Frame, so it re-reads no spec docs.
   Production/domain ambiguity that changes behavior stops as `ask-user`; generic no-user coding
   ambiguity uses a conservative, reversible default and records it. Build returns only on a green
   suite.
4. **Exact Verify/QA.** One fresh-context verifier with an adversarial stance: re-read request/docs,
   `GOAL.md`, `PLAN.md`, `QA.md`, current diff, and tests to disprove completeness - findings become
   fixes, decision gates, or residual risk. Re-run REAL tests plus the proof layer promised in Frame.
   Runtime-facing or user-expected proof: run the actual E2E/live/API/browser run; exact verification
   outranks reviewer approval. Browser UI: complete browser app verification with `qa-gate.sh <vault>
   browser`. Diff the implementer's changes against `GOAL.md` and tick each criterion proven met; re-run
   neighbor baselines, keep `Backward-trace: clean`, and record results as plain checklist sentences in
   `QA.md`. Criteria still unmet: append a timestamped checklist section to `R-LOOP.md` and relaunch the
   builder (reads `PLAN.md` + latest section; capped by `max_iterations`). If the exact layer cannot
   run, mark it not proven with blocker/residual risk.
5. **Finalize.** Every `GOAL.md` box checked: write `Z-<YYYY-MM-DD>.md` (run branch + completion
   timestamp) - never earlier. Pass the commit gate (`reference/delivery-gate.md`), commit/merge into
   the verified target branch after user acceptance, and report the verified commands.

**Escalation (trigger-gated, off by default).** The adversarial plan attack - reviewers against the
frozen `PLAN.md`, before Build - runs only on a named trigger: under-specified / latent-correctness
work, or a security/data/concurrency-sensitive or wide-blast-radius change (`reference/role-loop.md`).
Post-build disproof belongs to the verifier; post-verify gaps route through `R-LOOP.md`.

Roles -> personas: builder/improver=`agents/executor.md`, escalation reviewer=`agents/code-reviewer.md`,
browser QA=`agents/qa-tester.md`, non-browser/artifact verify=`agents/qa-auditor.md`,
security=`agents/security-reviewer.md` (others in `agents/<role>.md`).

## Reference map (load only what the current phase needs)

| Read this | When |
|---|---|
| `reference/role-loop.md` | default loop + run isolation contract |
| `agents/<role>.md` | dispatch a role persona |
| `reference/domain-rules.md` | Frame: distill <=10 priority rules |
| `reference/rules.md` | read project standing rules (`.supergoal/rules/RULES.md`) first, before any mode |
| `reference/domain-context.md` | repo-local Domain Brief |
| `reference/debugging.md` | DEBUG: hypothesis-ledger diagnose loop |
| `reference/interview.md` | interview: ambiguity (what) + blast-radius confirm (approach, tiered) |
| `reference/delivery-gate.md`, `templates/GOAL.md`, `templates/PLAN.md`, `templates/QA.md`, `templates/R-LOOP.md`, `templates/Z-DONE.md`, `templates/run-state.json`, `templates/commit-gate.sh` | run vault file set + Before/After Eval + resumable run state + commit gate for GREENFIELD / DEBUG / LEGACY code changes |
| `reference/wayfinder.md` | WAYFINDER: issue map -> vertical tickets -> optional EARS/user-story depth -> blockers -> next frontier; also GREENFIELD internal Frontier Map for broad/foggy new builds |
| `reference/research.md` | WAYFINDER research-needed tickets; docs/API/source facts that need high-trust cited evidence |
| `reference/prototype.md` | PROTOTYPE: throwaway logic/UI proof -> capture answer -> delete/quarantine or route to delivery; UI/interaction prototypes must also load the installed `superdesign` skill |
| `reference/vercel-host.md` | PROTOTYPE: after explicit approval, publish an isolated browser prototype to a public Vercel URL and verify anonymous access |
| `reference/plan-grounding.md` | ground the approach before committing |
| `reference/db-access.md`, `templates/db-access/` | read-only DB evidence (required when persisted data is load-bearing) |
| `reference/qa.md`, `qa-only.md`, `playwright-cli.md` | QA / no-code verify; single browser driver = playwright-cli |
| `reference/review-only.md` | REVIEW-ONLY: findings, no fixes |
| `reference/arch.md` | ARCHITECTURE: friction survey -> route out |
| `reference/archify.md`, `templates/archify/` | diagrams as self-contained HTML (typed JSON IR -> validated render): ARCHITECTURE report system diagram, LEARN-DOMAIN onboard architecture/flow diagrams |
| `reference/teach.md`, `learn-domain.md` | teach a human / onboard the agent |
| `reference/ui-ux.md`, `taste-skill-v2.md`, `functional-ui.md`, `taste-aesthetics.md`, `engagement.md` | user-facing UI tier |
| `reference/harness-eval.md`, `templates/harness-eval-runner.mjs`, `templates/harness-eval-external/deepswe/run-default-suite.mjs` | HARNESS-EVAL; the runner is the DEFAULT portable eval driver (adapters + preflight + fallback + retry, serial by default). Difficult SWE/harness-effectiveness claims default to the forced five-task DeepSWE suite (measured-difficult tasks) - use it, don't hand-roll a single-CLI run.mjs |
| `reference/skill-mine.md` | SKILL-MINE |
| `reference/market-research.md` | GREENFIELD: validate demand (optional) |
| `reference/observability.md`, `tui/` | Board: opt-in live dashboard |

**Done =** mode stated; smallest diff; Before/After Eval complete for code-mode changes; REAL
tests + request/docs green (not proxy); runtime MUST proven by real behavior; code-mode runs use
red-green test + DB evidence if data load-bearing; neighbor snapshots re-run with unnamed drift resolved; every
`GOAL.md` Success Criterion checked, with no orphan scope; `Z-<date>.md` written with run branch +
completion timestamp; DEBUG prod issue has reproduction fidelity and, if
non-exact, residual risk + post-deploy confirmation plan; user-facing UI at the Expressive baseline;
destructive steps consented; commit/merge only after the commit gate passes (`reference/delivery-gate.md`);
verified commands reported.

## Credit

Workflow lineage: cskwork's **oh-my-symphony**. WAYFINDER and research-depth concepts also draw from
Matt Pocock's public skills, especially the research and skill-writing patterns. UI/interaction prototype
craft and gates route through cskwork's **superdesign-skill** (https://github.com/cskwork/superdesign-skill).
