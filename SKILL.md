---
name: supergoal
description: Baseline-first delivery - surface hidden requirements, make the smallest correct change, verify against real tests/spec. Use for "/supergoal", "supergoal", "build X", "fix this bug", "add this feature", "spec this feature", "QA / verify only", "review this code/PR", "improve the architecture", "learn this codebase", "make a skill", or "eval a harness".
---

# /supergoal - baseline-first

One objective -> the smallest correct change -> verified against ground truth. For a trivial single edit, skip this skill and edit directly.

## Core principles

- Verify against ground truth: re-run the project's REAL tests and re-read the prose spec for rules tests
  do not cover. Spec-derived FAILING tests surface hidden requirements, but never replace ground truth and
  never optimize to a self-graded proxy.
- Smallest correct change; match surrounding code; never rewrite a whole file for a few lines.
  Scope-minimalism governs code surface area, NOT visual quality: for user-facing UI a polished result is
  baseline correctness, not padding to defer until asked.
- Surface hidden requirements first, as failing tests written by an independent critic.
- Ask only when genuinely ambiguous; resolve code-answerable questions by reading the code.
- Output language: write prose in the user's language; keep identifiers, file paths, commands, and
  machine-checked anchors in canonical English so checks keep matching.
- Hard stops: a destructive or irreversible step (drop data, force-push, external publish) needs explicit
  consent; genuine ambiguity blocks the freeze; if the real tests cannot pass, report it - never fake a pass.

## Mode (classify, state it in one line)

| Signal in the objective | Mode | Approach |
|---|---|---|
| build / make / ship a new app/tool | GREENFIELD | default loop |
| fix / broken / failing / crash / why does | DEBUG | default loop; runtime-symptom bugs -> observe the live flow at the symptom's boundary BEFORE code/git, report the broken boundary early; then reproduce with a failing test (`reference/debugging.md` Observe-first triage) |
| add / integrate / refactor existing code | LEGACY | default loop; map the code first (`agents/explore.md`, `reference/domain-context.md`); optional DB evidence (`reference/db-access.md`) |
| spec / requirements first / 스펙 문서로 구조화 | SPEC | spec-first prefix to the default loop: grill load-bearing decisions one question at a time, crystallize requirements -> design -> tasks under `docs/spec/<feature-slug>/`, then tasks.md drives Build and EARS criteria feed the critic (`reference/spec.md`) |
| explain / teach / how does X work (no code) | LEARN | `reference/learn.md` |
| learn / onboard / map this codebase (persist a wiki) | LEARN-DOMAIN | `reference/learn-domain.md` |
| QA / verify / 검증만 / compare data (no code) | QA-ONLY | `reference/qa-only.md` |
| review / audit this code/diff/PR (no fixes) | REVIEW-ONLY | `reference/review-only.md` |
| improve the architecture / find refactoring opportunities / 구조 개선 | ARCH | survey-first, no fixes: depth/seam friction report in the run vault, grill the picked candidate, route the refactor to LEGACY/SPEC (`reference/arch.md`) |
| test harness effectiveness / compare with vs without | HARNESS-EVAL | `reference/harness-eval.md` |
| turn repeated work into a reusable skill | SKILL-MINE | `reference/skill-mine.md` |

**UI/UX overlay (any mode).** If the objective ships user-facing UI, load `reference/ui-ux.md` at
**Frame** and apply the **Expressive/polished baseline** by default - `reference/taste-skill-v2.md` is the
authority for ALL user-facing UI, carried through Build and Verify. No "Functional" path ships a plainer
result; `reference/functional-ui.md` is only a density add-on (more density + complete UI states) on top of
the Expressive baseline for dense admin/dashboard surfaces, never a reason to lower polish. GREENFIELD
frontend: always. LEGACY: only for new UI - else reuse the existing design system. Non-visual work (lib,
API, backend, CLI without TUI): skip.

## Default loop (GREENFIELD / DEBUG / LEGACY) - role-separated

Author-independent roles (separate agent per role when orchestrated - the dispatching agent is the
"conductor" named in role files; inline, switch role with a fresh re-read). Detail in
`reference/role-loop.md`. Trivial single edit: skip the loop.

**Difficulty gate.** *Very easy* (trivial edit) -> skip the loop. *Harder* -> red-green is REQUIRED
(reproduce red -> fix green -> real suite); and if persisted data is load-bearing, DB evidence too. Both,
not either/or - DB proves the data state, the test proves the code; neither substitutes for the other.

1. **Frame.** Restate the goal + acceptance criteria in one line. If underspecified, ask <=5
   high-leverage questions (`reference/interview.md`); resolve code-answerable ones by reading code.
   If the work ships user-facing UI, load `reference/ui-ux.md` now and commit to the Expressive/polished
   baseline (see the UI/UX overlay above) so strong design drives Build from the start, not just QA.
2. **Build.** Smallest correct change, test-first; match surrounding style; preserve existing comments
   and structure; no whole-file rewrites; minimal diff. For a bug, reproduce with a failing test first
   (`reference/debugging.md`).
3. **Critic (independent; no src edits).** Re-read the prose spec + repo/data rules
   (`reference/domain-context.md`, `domain-rules.md`; legacy `reference/learn-domain.md`). For each
   required behavior the existing tests do NOT exercise, write a FAILING test (black-box/property,
   derived strictly from the spec) and log it in the run vault's `surfaced-requirements.md`
   (`docs/changelog/<YYYY-MM>/<DD-topic>/`) (what the spec implies,
   why, covering test); do not weaken or delete existing tests. These SURFACE hidden requirements - a
   signal, not the acceptance oracle.
4. **Fixer (no test edits).** Make the failing tests pass with the smallest change; no padding (no code
   not tied to a failing test or a listed defect); do not break passing tests.
5. **Verify vs ground truth.** Re-run the project's REAL tests; re-read the prose spec for uncovered
   rules; never weaken/delete a real test or optimize to a proxy. For user-facing UI, QA against the
   baseline from Frame (`reference/qa.md`). If persisted data is load-bearing (and issue past *very easy*),
   DB evidence is REQUIRED alongside the red-green test - via `db-reader` + `templates/db-access/`; if
   `.env` is missing, ask or skip. Loop
   critic->fixer only while a fresh red appears; stop on green and report what was verified, with command
   output.

Roles map to personas: critic=`agents/code-reviewer.md`, fixer=`agents/executor.md`,
verify=`agents/qa-auditor.md`/`security-reviewer.md` (other personas in `agents/<role>.md`). Isolate
risky work in a branch or `git worktree` (optional).

## No-code & utility modes

- **QA-ONLY** drives an already-running app (and a read-only DB), records as-is/to-be evidence, produces a
  human `report.md`, and persists a reusable suite under `.domain-agent/qa/`. No code change.
  `reference/qa-only.md`, `db-access.md`; terminal gate `templates/qa-only-gate.sh`.
- **REVIEW-ONLY** reviews a diff/PR/module and delivers an evidence-backed findings `report.md` -
  findings, not fixes; no source or test edits (`reference/review-only.md`).
- **ARCH** surveys the codebase for architectural friction (shallow modules, missing seams), delivers
  a candidates `report.md` with recommendation strengths, grills the picked candidate, and routes the
  refactor to LEGACY/SPEC - no source edits (`reference/arch.md`).
- **LEARN / LEARN-DOMAIN** teach a human (`reference/learn.md`) or persist a source-grounded
  `.domain-agent/` wiki for the agent (`reference/learn-domain.md`; gate
  `templates/learn-grounding-gate.mjs`).
- **HARNESS-EVAL / SKILL-MINE** measure a harness with vs without on the same snapshot
  (`reference/harness-eval.md`), or forge a portable `SKILL.md` from history (`reference/skill-mine.md`).
  Each confirms with the user before installing anything.

## Reference map (load only what the current phase needs)

| Read this | When |
|---|---|
| `reference/role-loop.md` | The default critic->fixer->verify loop (GREENFIELD / DEBUG / LEGACY) |
| `agents/<role>.md` | Dispatch a role persona; one file per role |
| `reference/domain-rules.md` | Frame: distill <=10 priority rules |
| `reference/domain-context.md` | Surface requirements: repo-local Domain Brief |
| `reference/debugging.md` | DEBUG: hypothesis-ledger diagnose loop |
| `reference/interview.md` | Ambiguity-gated <=5 question interview before the freeze |
| `reference/spec.md`, `templates/spec/` | SPEC: requirements -> design -> tasks under `docs/spec/` before Build |
| `reference/plan-grounding.md` | Ground the approach from docs/code before committing |
| `reference/db-access.md`, `templates/db-access/` | Read-only DB evidence (required past *very easy* when data load-bearing) - GREENFIELD / DEBUG / LEGACY / QA-ONLY |
| `reference/qa.md`, `qa-only.md`, `db-access.md` | QA / no-code verify |
| `reference/review-only.md` | REVIEW-ONLY: findings report, no fixes |
| `reference/arch.md` | ARCH: friction survey -> candidates report -> grill the pick -> route out |
| `reference/learn.md`, `learn-domain.md` | Teach a human / onboard the agent |
| `reference/ui-ux.md`, `taste-skill-v2.md`, `functional-ui.md`, `taste-aesthetics.md` | User-facing UI tier |
| `reference/harness-eval.md` | HARNESS-EVAL |
| `reference/skill-mine.md` | SKILL-MINE |
| `reference/market-research.md` | GREENFIELD: validate demand (optional) |

## Final checklist (before claiming done)

- [ ] Mode stated; hidden requirements surfaced or explicitly none
- [ ] If user-facing UI: `reference/ui-ux.md` loaded at Frame, Expressive/polished baseline applied through Build + QA from the start - not a plain first draft (skip only for non-visual or existing-design legacy work)
- [ ] Smallest change; surrounding style matched; no whole-file rewrite
- [ ] Verified against the project's REAL tests + prose spec (not a generated proxy)
- [ ] If past *very easy*: red-green test (red -> green) AND, if data load-bearing, DB evidence - both, not either/or
- [ ] Reported what was verified, with command output - no unverified "done"
- [ ] Any destructive step had explicit consent
