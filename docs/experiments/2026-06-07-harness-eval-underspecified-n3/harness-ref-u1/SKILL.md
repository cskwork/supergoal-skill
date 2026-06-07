---
name: supergoal
description: Baseline-first delivery for one objective - surface hidden requirements, make the smallest correct change, and verify it against the project's real tests/spec (never a generated proxy). Use for "/supergoal", "supergoal", "build X", "fix this bug", "add this feature", "QA / verify only", "learn this codebase", "make a skill", or "eval a harness".
---

# /supergoal - baseline-first

One objective -> the smallest correct change -> verified against ground truth.

A strong model with the real spec is the bar. This skill adds only what a plain baseline cannot do for
free: surface requirements that are not in the prompt - as FAILING tests written by an independent
critic - then make the smallest correct change and verify it against the project's real tests/spec,
never a generated proxy. For a trivial single edit, skip this skill and edit directly.

## Core principles

- Verify against ground truth: re-run the project's REAL tests and re-read the prose spec for rules the
  tests do not cover. Spec-derived FAILING tests may surface hidden requirements (see the loop), but
  never let them replace ground truth and never optimize to a self-graded proxy.
- Smallest correct change; match the surrounding code; never rewrite a whole file to change a few lines.
- Surface hidden requirements first, as failing tests written by an independent critic - the one place
  a process beats a plain baseline.
- Ask only when genuinely ambiguous; resolve code-answerable questions by reading the code.
- Output language: write prose in the user's language; keep identifiers, file paths, commands, and
  machine-checked anchors in canonical English so checks keep matching.
- Hard stops: a destructive or irreversible step (drop data, force-push, external publish) needs explicit
  consent; genuine ambiguity blocks the freeze; if the real tests cannot pass, report it - never fake a pass.

## Mode (classify, state it in one line)

| Signal in the objective | Mode | Approach |
|---|---|---|
| build / make / ship a new app/tool | GREENFIELD | default loop |
| fix / broken / failing / crash / why does | DEBUG | default loop; reproduce with a failing test first (`reference/debugging.md`) |
| add / integrate / refactor existing code | LEGACY | default loop; map the code first (`agents/explore.md`, `reference/domain-context.md`) |
| explain / teach / how does X work (no code) | LEARN | `reference/learn.md` |
| learn / onboard / map this codebase (persist a wiki) | LEARN-DOMAIN | `reference/learn-domain.md` |
| QA / verify / 검증만 / compare data (no code) | QA-ONLY | `reference/qa-only.md` |
| test harness effectiveness / compare with vs without | HARNESS-EVAL | `reference/harness-eval.md` |
| turn repeated work into a reusable skill | SKILL-MINE | `reference/skill-mine.md` |

## Default loop (GREENFIELD / DEBUG / LEGACY) - role-separated

Run as author-independent roles (a separate agent per role when orchestrated; inline, switch role
deliberately with a fresh re-read). Detail in `reference/role-loop.md`. For a trivial single edit, skip
the loop and edit directly.

1. **Frame.** Restate the goal + acceptance criteria in one line. If underspecified, ask <=3
   high-leverage questions (`reference/interview.md`); resolve code-answerable ones by reading code.
2. **Build.** Smallest correct change, test-first; match surrounding style; preserve existing comments
   and structure; no whole-file rewrites; minimal diff. For a bug, reproduce with a failing test first
   (`reference/debugging.md`).
3. **Critic (independent; no src edits).** Re-read the prose spec + repo/data rules
   (`reference/domain-context.md`, `domain-rules.md`; legacy `reference/learn-domain.md`). For each
   required behavior the existing tests do NOT exercise, write a FAILING test (black-box/property,
   derived strictly from the spec); do not weaken or delete existing tests. These SURFACE hidden
   requirements - a signal, not the acceptance oracle.
4. **Fixer (no test edits).** Make the failing tests pass with the smallest change; no padding (no code
   not tied to a failing test or a listed defect); do not break passing tests.
5. **Verify vs ground truth.** Re-run the project's REAL tests; re-read the prose spec for uncovered
   rules; never weaken/delete a real test or optimize to a generated proxy. For user-facing UI, route
   the tier (`reference/ui-ux.md` -> `taste-skill-v2.md` / `functional-ui.md`) and QA it
   (`reference/qa.md`). Loop critic->fixer only while a fresh red appears; stop on green and report what
   was verified, with command output.

Roles map to personas: critic=`agents/code-reviewer.md`, fixer=`agents/executor.md`,
verify=`agents/qa-auditor.md`/`security-reviewer.md` (other personas in `agents/<role>.md`). Isolate
risky work in a branch or `git worktree` (optional).

## No-code & utility modes

- **QA-ONLY** drives an already-running app (and a read-only DB), records as-is/to-be evidence, produces a
  human `report.md`, and persists a reusable suite under `.domain-agent/qa/`. No code change.
  `reference/qa-only.md`, `db-access.md`; terminal gate `templates/qa-only-gate.sh`.
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
| `reference/interview.md` | Ambiguity-gated 3-5 question interview before the freeze |
| `reference/plan-grounding.md` | Ground the approach from docs/code before committing |
| `reference/qa.md`, `qa-only.md`, `db-access.md` | QA / no-code verify |
| `reference/learn.md`, `learn-domain.md` | Teach a human / onboard the agent |
| `reference/ui-ux.md`, `taste-skill-v2.md`, `functional-ui.md` | User-facing UI tier |
| `reference/harness-eval.md` | HARNESS-EVAL |
| `reference/skill-mine.md` | SKILL-MINE |
| `reference/market-research.md` | GREENFIELD: validate demand (optional) |

## Final checklist (before claiming done)

- [ ] Mode stated; hidden requirements surfaced or explicitly none
- [ ] Smallest change; surrounding style matched; no whole-file rewrite
- [ ] Verified against the project's REAL tests + prose spec (not a generated proxy)
- [ ] Reported what was verified, with command output - no unverified "done"
- [ ] Any destructive step had explicit consent
