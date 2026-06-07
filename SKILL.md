---
name: supergoal
description: Baseline-first delivery for one objective - surface hidden requirements, make the smallest correct change, and verify it against the project's real tests/spec (never a generated proxy). Use for "/supergoal", "supergoal", "build X", "fix this bug", "add this feature", "QA / verify only", "learn this codebase", "make a skill", or "design/eval a harness".
---

# /supergoal - baseline-first

One objective -> the smallest correct change -> verified against ground truth.

A strong model with the real spec is the bar. Seven head-to-head evals
(`log/changelog-2026-06-07.md`, `docs/experiments/2026-06-07-harness-eval-*`) showed that on tasks with
an explicit spec, heavy gated/multi-agent ceremony costs 2-3x and never beats that bar - and a generated
proxy verifier can make it worse (Goodhart: the solver overfits the generated checklist and stops below a
baseline that read the real spec). So this skill adds only what a plain baseline cannot do for free:
surface requirements that are not in the prompt, and keep the change minimal and verified against the
real tests/spec. For a trivial single edit, skip this skill and edit directly.

## Core principles

- Verify against ground truth: re-run the project's REAL tests and re-read the prose spec for rules the
  tests do not cover. NEVER generate a proxy checklist/verifier and optimize to it.
- Smallest correct change; match the surrounding code; never rewrite a whole file to change a few lines.
- Surface hidden requirements first - the one place a process beats a plain baseline.
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
| design / build / audit a harness, agent team, skill system | HARNESS-MAKE | `reference/harness-make.md`, `harness-patterns.md` |
| test harness effectiveness / compare with vs without | HARNESS-EVAL | `reference/harness-eval.md` |
| turn repeated work into a reusable skill | SKILL-MINE | `reference/skill-mine.md` |

## Default loop (GREENFIELD / DEBUG / LEGACY)

1. **Frame.** Restate the goal + acceptance criteria in one line. If underspecified, ask <=3
   high-leverage questions (`reference/interview.md`); resolve code-answerable ones by reading code.
2. **Surface hidden requirements.** Distill the rules that live in the repo/data, not the prompt
   (`reference/domain-context.md`, `domain-rules.md`; for legacy/onboarding `reference/learn-domain.md`).
   Record <=10 priority rules. This is the only place the skill beats a plain baseline.
3. **Solve.** Smallest correct change, test-first. For a bug, add the failing test first. No whole-file
   rewrites; preserve existing comments and structure; keep the diff minimal.
4. **Verify vs ground truth.** Re-run the project's real tests; re-read the prose spec for uncovered
   rules. For user-facing UI, route the tier (`reference/ui-ux.md` -> `taste-skill-v2.md` /
   `functional-ui.md`) and QA it (`reference/qa.md`). Optional: an independent code/security review pass
   (`agents/code-reviewer.md`, `security-reviewer.md`).
5. **Stop on green.** Report what was verified, with command output - no unverified "done".

Optional: isolate risky work in a branch or `git worktree`; not required. Default is single-driver; dispatch
a fresh agent only for genuinely parallel, wide-and-shallow work. Personas: `agents/<role>.md` (analyst,
architect, executor, debugger, explore, designer, qa-auditor, qa-tester, db-reader, code-reviewer,
security-reviewer).

## No-code & utility modes

- **QA-ONLY** drives an already-running app (and a read-only DB), records as-is/to-be evidence, produces a
  human `report.md`, and persists a reusable suite under `.domain-agent/qa/`. No code change.
  `reference/qa-only.md`, `db-access.md`; terminal gate `templates/qa-only-gate.sh`.
- **LEARN / LEARN-DOMAIN** teach a human (`reference/learn.md`) or persist a source-grounded
  `.domain-agent/` wiki for the agent (`reference/learn-domain.md`; gate
  `templates/learn-grounding-gate.mjs`).
- **HARNESS-MAKE / HARNESS-EVAL / SKILL-MINE** design a harness (`reference/harness-make.md`,
  `harness-patterns.md`), measure a harness with vs without on the same snapshot
  (`reference/harness-eval.md`), or forge a portable `SKILL.md` from history (`reference/skill-mine.md`).
  Each confirms with the user before installing anything.

## Reference map (load only what the current phase needs)

| Read this | When |
|---|---|
| `agents/<role>.md` | Dispatch a role persona; one file per role |
| `reference/domain-rules.md` | Frame: distill <=10 priority rules |
| `reference/domain-context.md` | Surface requirements: repo-local Domain Brief |
| `reference/debugging.md` | DEBUG: hypothesis-ledger diagnose loop |
| `reference/interview.md` | Ambiguity-gated 3-5 question interview before the freeze |
| `reference/plan-grounding.md` | Ground the approach from docs/code before committing |
| `reference/qa.md`, `qa-only.md`, `db-access.md` | QA / no-code verify |
| `reference/learn.md`, `learn-domain.md` | Teach a human / onboard the agent |
| `reference/ui-ux.md`, `taste-skill-v2.md`, `functional-ui.md` | User-facing UI tier |
| `reference/harness-make.md`, `harness-patterns.md` | HARNESS-MAKE |
| `reference/harness-eval.md` | HARNESS-EVAL |
| `reference/skill-mine.md` | SKILL-MINE |
| `reference/market-research.md` | GREENFIELD: validate demand (optional) |

## Final checklist (before claiming done)

- [ ] Mode stated; hidden requirements surfaced or explicitly none
- [ ] Smallest change; surrounding style matched; no whole-file rewrite
- [ ] Verified against the project's REAL tests + prose spec (not a generated proxy)
- [ ] Reported what was verified, with command output - no unverified "done"
- [ ] Any destructive step had explicit consent
