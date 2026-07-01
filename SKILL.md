---
name: supergoal
description: supergoal - baseline-first delivery. Use for "/supergoal", "supergoal", "build X", "fix this bug", "add this feature", "spec this feature", "QA / verify only", "review this code/PR", "improve the architecture", "learn this codebase", "make a skill", or "eval a harness".
---

# /supergoal - baseline-first

One objective -> the smallest correct change -> verified against ground truth. Trivial single edit: skip
this skill and edit directly. This file is a router; each phase loads only the reference it needs.

**Standing rules (read first, every mode).** Before classifying the mode, read `.supergoal/rules/RULES.md`
in the project if present and honor it across all phases as the top-priority preferences - but rules never
weaken safety gates. Create or edit it only when the user explicitly asks (`reference/rules.md`).

## Core principles

- Verify against ground truth: re-run the project's REAL tests and re-read the prose spec for rules the
  tests miss; never optimize to a self-graded proxy.
- Smallest correct change; match surrounding code; never rewrite a whole file for a few lines.
  Scope-minimalism governs code surface area, NOT visual quality: for user-facing UI a polished result is
  baseline correctness, not padding.
- Surface hidden requirements first, as FAILING tests written by an independent critic.
- For non-trivial code changes, run a Before/After Eval before Build: prove the before state, the after
  target, and the delta with trusted repo/evaluator commands (`reference/delivery-gate.md`).
- Ask only when genuinely ambiguous; resolve code-answerable questions by reading the code.
- Docs language: for persistent repo docs (`docs/**`, run vaults, `.domain-agent/**`, ADR/spec/changelog),
  match the target repo's dominant prose language; mixed or none -> the user's language. Keep identifiers,
  paths, commands, and machine-checked anchors in canonical English so checks keep matching.
- Hard stops: a destructive or irreversible step (drop data, force-push, external publish) needs explicit
  consent; if the real tests cannot pass, report it - never fake a pass.

## Run isolation (GREENFIELD / DEBUG / LEGACY that edits code)

Right after mode detection, resolve the source/base branch and target/integration branch (repo policy,
else ask). Verify both refs before mutating files, then create a run worktree from the source/base branch
and do all work there. Do not mutate the original checkout. Commit or merge only into the verified
target/integration branch after verification and user acceptance. Commit is hard-gated by the Commit gate
(`reference/delivery-gate.md`, backstop `templates/commit-gate.sh`): a non-green run does not commit -
resolve it in the loop or ask the user about the requirement, never commit on an assumption. Full contract:
`reference/role-loop.md`.

## Mode (classify, state it in one line)

| Signal in the objective | Mode | Route |
|---|---|---|
| build / make / ship a new app/tool | GREENFIELD | default loop |
| fix / broken / failing / crash / why does | DEBUG | default loop; observe the live symptom boundary first, then reproduce with a failing test (`reference/debugging.md`); web: `reference/qa.md`, `reference/playwright-cli.md` |
| add / integrate / refactor existing code | LEGACY | default loop; map first (`agents/explore.md`, `reference/domain-context.md`); optional DB evidence (`reference/db-access.md`); existing-API refactor: capture its exact behavior first as a preserve-baseline (`reference/qa.md`) |
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

## Default loop (GREENFIELD / DEBUG / LEGACY) - role-separated, subagent-default

Each role runs in a fresh-context subagent by default (the dispatching agent is the "conductor"); a
trivial single edit skips the loop and edits inline. Independent units (QA scenario shards, review
dimensions) run in parallel. Difficulty gate: *very easy* -> skip; harder -> red-green is REQUIRED, plus
DB evidence when persisted data is load-bearing. Full contract: `reference/role-loop.md`.

1. **Frame.** Restate goal + falsifiable acceptance criteria in one line. If underspecified, ask <=5
   high-leverage questions; and once the approach is grounded, if the fix's blast radius reaches past
   its target, confirm it before Build - tiered, hard-gated when wide/destructive/behavior-changing
   (`reference/interview.md`). Resolve code-answerable questions by reading code. UI work: load
   `reference/ui-ux.md` now. Non-trivial code work: start `delivery-proof.md` from
   `templates/delivery-proof.md` and record the Before/After Eval (`reference/delivery-gate.md`).
2. **Build.** Smallest correct change, test-first; match surrounding style; minimal diff. Bug: reproduce
   with a failing test first (`reference/debugging.md`).
3. **Critic (independent; no src edits).** Re-read the prose spec + repo/data rules
   (`reference/domain-context.md`, `domain-rules.md`). For each required behavior the existing tests miss,
   write a FAILING test and log it in the run vault's `surfaced-requirements.md`. A signal, not the oracle.
4. **Fixer (no test edits).** Make the failing tests pass with the smallest change; no padding; do not
   break passing tests.
5. **Verify vs ground truth.** Re-run the project's REAL tests; re-read the spec for uncovered rules.
   Browser UI: complete browser app verification with `qa-gate.sh <vault> browser` (lint, typecheck,
   build, and screenshots do not substitute). Data load-bearing past *very easy*: DB evidence too. Stop
   on green only after updating `delivery-proof.md` with after evidence, resolved decision gates, and
   residual risk; report what was verified, with command output.

Roles -> personas: critic=`agents/code-reviewer.md`, fixer=`agents/executor.md`,
verify=`agents/qa-auditor.md`/`security-reviewer.md` (others in `agents/<role>.md`).

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
| `reference/delivery-gate.md`, `templates/delivery-proof.md`, `templates/commit-gate.sh` | Before/After Eval + commit gate for non-trivial GREENFIELD / DEBUG / LEGACY code changes |
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

**Done =** mode stated; smallest diff in surrounding style; Before/After Eval complete for non-trivial
code changes; REAL tests + prose spec green (not a proxy) - a runtime MUST is proven only by exercising its real behavior, never by a test that just checks a method was called or re-asserts current behavior;
past *very easy* -> red-green test + DB evidence if data load-bearing; user-facing UI at the Expressive
baseline; destructive steps consented; commit/merge only after the commit gate passes
(`reference/delivery-gate.md`); report what was verified with command output.
