---
name: supergoal
description: supergoal - baseline-first delivery. Use for "/supergoal", "supergoal", "build X", "fix this bug", "add this feature", "spec this feature", "QA / verify only", "review this code/PR", "improve the architecture", "learn this codebase", "make a skill", or "eval a harness".
---

# /supergoal - baseline-first

One objective -> smallest correct change -> verified against ground truth. Trivial single edit: skip this
skill and edit directly. `SKILL.md` is the router; `reference/` carries procedure.

**Standing rules (read first, every mode).** Before classifying the mode, read
`.supergoal/rules/RULES.md` if present. Honor it across phases as top-priority preference, but rules never
weaken safety gates. Create/edit it only when the user explicitly asks (`reference/rules.md`).

## Core principles

- Ground truth beats proxy: re-run REAL tests, re-read the prose spec, and do not optimize to self-grading.
- Smallest correct change; match surrounding code. Scope-minimalism governs code surface area, not UI
  quality: polished user-facing UI is baseline correctness.
- Non-trivial code changes use Before/After Eval before Build: prove before, target after, and delta with
  trusted commands (`reference/delivery-gate.md`).
- Ask only when genuinely ambiguous; resolve code-answerable questions by reading the code.
- Docs language: for persistent repo docs (`docs/**`, run vaults, `.domain-agent/**`, ADR/spec/changelog),
  match the target repo's dominant prose language; mixed/none -> the user's language. Keep identifiers,
  paths, commands, and machine-checked anchors in canonical English so checks keep matching.
- Hard stops: a destructive or irreversible step (drop data, force-push, external publish) needs explicit
  consent; if the real tests cannot pass, report it - never fake a pass.

## Run isolation (GREENFIELD / DEBUG / LEGACY that edits code)

After mode detection, resolve the source/base branch and target/integration branch (repo policy, else
ask). Verify both refs before mutating files, then create a run worktree from the source/base branch. Do
all code work there. Do not mutate the original checkout. Commit or merge only into the verified
target/integration branch after verification and user acceptance. Commit is hard-gated by the Commit gate
(`reference/delivery-gate.md`, backstop `templates/commit-gate.sh`): non-green means fix/ask, never commit
on assumption. Full contract: `reference/role-loop.md`.

## IntentGate (classify before routing, state it in one line)

Before the mode table, write: `IntentGate: intent=<work kind>; confidence=<high|medium|low>;
mode=<route>; capability_refs=<refs/tools needed>`. Category is the work kind; capability refs are the
skill files/tools to load after routing. High confidence -> route immediately. Medium confidence -> route
to the safest narrow mode and name the uncertainty. Low confidence or conflicting intent -> ask one
blocking question. Do not load a heavy reference just to classify.

Near-miss rule: if the words mention a capability but the real task is no-code, route to the no-code mode
first (QA-ONLY/REVIEW-ONLY/TEACH/LEARN/HARNESS-EVAL/SKILL-MINE). If the user asks to edit code, route to
GREENFIELD/DEBUG/LEGACY only after the edit target is clear.

## Mode (classify, state it in one line)

| Signal in the objective | Mode | Route |
|---|---|---|
| build / make / ship a new app/tool | GREENFIELD | default loop |
| fix / broken / failing / crash / why does | DEBUG | default loop; observe live symptom, then failing-test repro (`reference/debugging.md`); web: `reference/qa.md`, `reference/playwright-cli.md` |
| add / integrate / refactor existing code | LEGACY | default loop; map first (`agents/explore.md`, `reference/domain-context.md`); optional DB evidence (`reference/db-access.md`); existing API: capture its exact behavior first as a preserve-baseline; shared code/state past *very easy*: characterization baseline (`reference/qa.md`) |
| spec / requirements first / 스펙 문서로 구조화 | SPEC | spec-first prefix: requirements -> design -> tasks under `docs/spec/`, then tasks drive Build (`reference/spec.md`) |
| explain / teach / how does X work (no code) | TEACH | stateful `teach/<topic>/` workspace (`reference/teach.md`); lessons must pass `teach-lesson-gate.mjs` |
| learn / onboard / map this codebase (persist a wiki) | LEARN-DOMAIN | Survey -> Map -> Ground -> Onboard a `.domain-agent/` wiki (`reference/learn-domain.md`; gate `learn-grounding-gate.mjs`) |
| QA / verify / 검증만 / compare data (no code) | QA-ONLY | Impact Matrix QA (`reference/qa-only.md`; gate `templates/qa-only-gate.sh`) |
| review / audit this code/diff/PR (no fixes) | REVIEW-ONLY | `reference/review-only.md` |
| improve the architecture / find refactoring opportunities / 구조 개선 | ARCHITECTURE | friction survey -> candidates -> grill the pick -> route to LEGACY/SPEC (`reference/arch.md`) |
| test harness/skill effectiveness / with vs without / does the skill help / measure skill lift | HARNESS-EVAL | `reference/harness-eval.md` |
| turn repeated work into a reusable skill | SKILL-MINE | `reference/skill-mine.md` |

The no-code/utility modes - **QA-ONLY**, REVIEW-ONLY, ARCHITECTURE, TEACH, LEARN-DOMAIN, HARNESS-EVAL,
SKILL-MINE - write no product code by default and confirm before installing anything.

**UI/UX overlay (any mode shipping user-facing UI).** Load `reference/ui-ux.md` at Frame; apply the
Expressive/polished baseline by default (`reference/taste-skill-v2.md` is the authority for ALL
user-facing UI), through Build and Verify. GREENFIELD frontend: always; LEGACY: only new UI (else reuse
the existing design system); non-visual work (lib, API, backend, CLI): skip.

**Board overlay (optional).** If the live dashboard is enabled, the conductor calls `sg-emit` at each
phase transition; it observes only, never gates (`reference/observability.md`).

## Default loop (GREENFIELD / DEBUG / LEGACY) - verification-first, subagent-default

Work runs in fresh-context subagents by default; the dispatching agent is the conductor. Trivial single
edit: skip and edit inline. Parallelize independent QA shards/review dimensions. *Very easy* can skip the
loop; harder work requires red-green, plus DB evidence when persisted data is load-bearing. Full contract:
`reference/role-loop.md`.

Mandatory core: Build -> Improve full spec -> Improve edge cases -> Final Verify. Critic/Fixer is not part
of the default loop; use it only when hidden requirements are the value being tested.

1. **Frame.** Restate goal + falsifiable acceptance criteria. Seed numbered requirements in
   `## Requirement Trace`. Write a completion promise: outcome, proof, stop condition, `max_iterations`
   (default 8). Ask <=5 high-leverage questions only when needed; confirm wide/destructive/behavior-
   changing blast radius after grounding (`reference/interview.md`). UI: load `reference/ui-ux.md`.
   Non-trivial code: start `delivery-proof.md` from `templates/delivery-proof.md`, create
   `run-state.json` from `templates/run-state.json`, and record the Before/After Eval.
2. **Build.** Smallest correct change, test-first, surrounding style. Bug: failing test first
   (`reference/debugging.md`). Shared code/state past *very easy*: capture neighbor characterization
   baseline before editing.
3. **Improve full spec.** Fresh-context improver re-reads the full prose spec, `## Requirement Trace`,
   code, tests, and repo/data rules; fix the smallest stated-or-implied behavior gap.
   Production/source-code domain ambiguity that changes behavior stops as `ask-user`; generic no-user
   coding ambiguity uses a conservative, reversible default and records it.
4. **Improve edge cases.** Separate fresh-context improver attacks degenerate values, error/recovery,
   state/protocol, concurrency, compatibility, security, and cleanup. Test only grounded `must` behavior;
   route product/domain choices to the user.
5. **Final Verify/QA.** Re-run REAL tests and disprove against spec; route fresh gaps back to Improve.
   Browser UI: complete browser app verification with `qa-gate.sh <vault> browser`. Re-run neighbor
   baselines, close `## Requirement Trace`, and keep `Backward-trace: clean`. DEBUG prod issue: record
   reproduction fidelity. Stop only after `delivery-proof.md` has after evidence, resolved decision gates,
   and residual risk; report command output.
6. **Critic escalation (opt-in; no src edits).** For under-specified / latent-correctness work, an
   independent critic classifies inferred behavior as `must`, `should`, or `ask-user`; only grounded
   `must` becomes FAILING tests. Log each in the run vault's `surfaced-requirements.md`; fixer clears reds
   without editing tests. Ambiguous/product-changing semantics are decision gates, not generated REDs.
   Reserve for the under-specified frontier and keep within the critic->fixer cap.

Roles -> personas: builder/improver/fixer=`agents/executor.md`, critic=`agents/code-reviewer.md`,
verify/QA=`agents/qa-auditor.md`/`security-reviewer.md` (others in `agents/<role>.md`).

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
| `reference/delivery-gate.md`, `templates/delivery-proof.md`, `templates/run-state.json`, `templates/commit-gate.sh` | Before/After Eval + resumable run state + commit gate for non-trivial GREENFIELD / DEBUG / LEGACY code changes |
| `reference/spec.md`, `templates/spec/` | SPEC: requirements -> design -> tasks |
| `reference/plan-grounding.md` | ground the approach before committing |
| `reference/db-access.md`, `templates/db-access/` | read-only DB evidence (required past *very easy* when data load-bearing) |
| `reference/qa.md`, `qa-only.md`, `playwright-cli.md` | QA / no-code verify; single browser driver = playwright-cli |
| `reference/review-only.md` | REVIEW-ONLY: findings, no fixes |
| `reference/arch.md` | ARCHITECTURE: friction survey -> route out |
| `reference/teach.md`, `learn-domain.md` | teach a human / onboard the agent |
| `reference/ui-ux.md`, `taste-skill-v2.md`, `functional-ui.md`, `taste-aesthetics.md`, `engagement.md` | user-facing UI tier |
| `reference/harness-eval.md`, `templates/harness-eval-runner.mjs` | HARNESS-EVAL; the runner is the DEFAULT portable eval driver (adapters + preflight + fallback + retry, serial by default) - use it, don't hand-roll a single-CLI run.mjs |
| `reference/skill-mine.md` | SKILL-MINE |
| `reference/market-research.md` | GREENFIELD: validate demand (optional) |
| `reference/observability.md`, `tui/` | Board: opt-in live dashboard |

**Done =** mode stated; smallest diff; Before/After Eval complete for non-trivial code changes; REAL
tests + prose spec green (not proxy); runtime MUST proven by real behavior; past *very easy* -> red-green
test + DB evidence if data load-bearing; neighbor snapshots re-run with unnamed drift resolved; all
requirements met and traced, with no orphan scope; DEBUG prod issue has reproduction fidelity and, if
non-exact, residual risk + post-deploy confirmation plan; user-facing UI at the Expressive baseline;
destructive steps consented; commit/merge only after the commit gate passes (`reference/delivery-gate.md`);
verified commands reported.
