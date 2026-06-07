# /supergoal

**English** | [한국어](README.ko.md)

**One objective in, a verified result out - the smallest correct change, checked against the real tests.**
No extra install: clone the repo, symlink it into your skills directory, then `/supergoal <objective>`.
Landing page: **[cskwork.github.io/supergoal-skill](https://cskwork.github.io/supergoal-skill/)**.

A Claude Code skill that takes a single objective, surfaces the requirements that are not in the prompt,
makes the smallest correct change, and verifies it against the project's own tests and spec - then stops.

## Baseline-first (why the gated machinery is gone)

`/supergoal` used to run a heavy gated multi-agent pipeline (validate gate, Human Feedback gate,
adversarial verifier, multi-expert committee, circuit breaker, literal delivery gate). Seven head-to-head
evals (`log/changelog-2026-06-07.md`, `docs/experiments/2026-06-07-harness-eval-*`) showed that on tasks
with an explicit spec, that machinery costs **2-3x the tokens and never beats a strong baseline** - and a
**generated proxy verifier can make it worse** (Goodhart: the solver overfits the generated checklist and
stops below a baseline that read the real spec).

So the skill is now **baseline-first**. It adds only what a plain baseline cannot do for free: surface
requirements that are not in the prompt, and keep the change minimal and verified against the real
tests/spec. Each role persona is still a bundled file in `agents/`, so dispatch stays harness-agnostic
across Claude Code, Codex, agy, and other CLIs - but dispatch is optional and single-driver by default.

## Principles

- **Verify against ground truth.** Re-run the project's REAL tests and re-read the prose spec for rules
  the tests miss. Never generate a proxy checklist/verifier and optimize to it.
- **Smallest correct change.** Match the surrounding code; no whole-file rewrites to change a few lines.
- **Surface hidden requirements first.** The one place a process beats a plain baseline.
- **Ask only when genuinely ambiguous.** Resolve code-answerable questions by reading the code.
- **Hard stops.** A destructive/irreversible step needs consent; if the real tests cannot pass, report it -
  never fake a pass.

## Modes

`/supergoal` detects the mode from your objective:

| Objective looks like | Mode | Approach |
|---|---|---|
| "build / ship a new app/tool" | **GREENFIELD** | default loop |
| "fix / broken / failing / why does" | **DEBUG** | default loop; reproduce with a failing test first |
| "add X to our existing/legacy code" | **LEGACY** | default loop; map the code first |
| "explain / teach me X" (no code) | **LEARN** | Intake -> Source -> Bridge -> Teach -> Check (explain-back) |
| "learn / map / onboard onto this codebase" | **LEARN-DOMAIN** | Survey -> Map -> Ground -> Persist a `.domain-agent/` wiki |
| "QA only / verify / compare data - no code" | **QA-ONLY** | Exercise app + read-only DB -> evidence -> `report.md` |
| "design / audit a harness or agent team" | **HARNESS-MAKE** | Domain audit -> pattern pick -> agent/skill map -> confirm -> generate |
| "test harness effectiveness / with vs without" | **HARNESS-EVAL** | Cases -> baseline run -> harness run -> machine checks -> quality score -> compare |
| "make a skill from history - no product code" | **SKILL-MINE** | Mine history -> rank -> you pick -> forge portable `SKILL.md` -> install |

**Default loop (GREENFIELD / DEBUG / LEGACY):** 1) frame goal + acceptance criteria; 2) surface hidden
requirements (rules in the repo/data, not the prompt); 3) smallest correct change, test-first (bug ->
failing test first); 4) verify vs the real tests + re-read the spec for uncovered rules; optional code/
security review; 5) stop on green and report what was verified with command output.

```text
/supergoal build a habit-tracker app and ship it
/supergoal the checkout page hangs intermittently in prod. fix it
/supergoal add SSO to our legacy Django monolith
/supergoal learn this codebase and build a domain wiki
/supergoal QA the checkout flow on staging and check the order totals match the DB (no code change)
/supergoal design a Codex/Claude harness for our migration workflow
/supergoal compare this migration harness with and without the harness on 3 cases
```

QA-ONLY, LEARN/LEARN-DOMAIN, HARNESS-MAKE, HARNESS-EVAL, and SKILL-MINE are kept as separate-purpose
utilities (no-code QA, teaching/onboarding, harness design, harness measurement, skill forging). They
write no product code by default and confirm with you before installing anything.

## Install

This repo **is** the skill. Put it where Claude Code finds skills:

```bash
git clone https://github.com/cskwork/supergoal-skill.git
# then either symlink or copy it into your global skills dir:
ln -s "$(pwd)/supergoal-skill" ~/.claude/skills/supergoal
# or: cp -R supergoal-skill ~/.claude/skills/supergoal
```

Then in Claude Code: `/supergoal <your objective>`.

### Windows

The skill runs on Windows; the remaining gate/test scripts are POSIX shell, so run them under **Git Bash**
or **WSL** (`node` must be on `PATH`). The repo pins `.gitattributes eol=lf`. Install by **copy** if
symlinks need admin rights (`cp -R` in Git Bash/WSL, or `mklink /D` from an elevated `cmd`); run the
contract tests under **WSL** bash.

## Layout

```
SKILL.md            thin spine: baseline-first loop, modes, reference map
agents/             one persona file per role (analyst, architect, executor, debugger, explore, designer, qa-*, db-reader, code-reviewer, security-reviewer)
reference/          domain-rules · domain-context · debugging · interview · plan-grounding · market-research · qa · qa-only · db-access · learn · learn-domain · ui-ux · taste-skill-v2 · functional-ui · harness-make · harness-patterns · harness-eval · skill-mine
learn/              LEARN-mode session journals + README template + USER_PREFERENCE(.template).md
templates/          qa-gate.sh · qa-only-gate.sh · contrast-gate.mjs · learn-grounding-gate.mjs · qa-report.md · domain-agent/ · domain-onboarding.html · harness-spec.md · harness-eval-gate.mjs · harness-eval-cases/ · skill-mine/ · skill-frontmatter-gate.mjs · skill.md.template
docs/               DESIGN.md · research-brief.md · experiments/ (the harness evals) · changelog/ · index.html (landing)
examples/url-shortener/   a real service the earlier gated version built/debugged/extended (historical audit trail)
```

## Evidence & history

- **Why baseline-first.** `docs/experiments/2026-06-07-harness-eval-*` and `log/changelog-2026-06-07.md`
  record seven evals (3 cases, 2 models, 4 harness forms) showing the harness matched but never beat a
  strong baseline, cost 2-3x, and could lose via Goodhart on a generated verifier.
- **Earlier gated runs (historical).** The pre-strip pipeline was dogfooded on a zero-dependency URL
  shortener (`examples/url-shortener/`, audit trail in its `docs/changelog/`) and a private-codebase
  benchmark (`docs/experiments/2026-05-30-private-codebase-comparison/`). These predate the baseline-first
  rewrite and describe the removed machinery.

## Harness Eval Reference

HARNESS-EVAL reusable sample cases come from RevFactory's `claude-code-harness`:
https://github.com/revfactory/claude-code-harness/

## Credit

Concept and workflow adapted from **oh-my-symphony** by cskwork
(https://github.com/cskwork/oh-my-symphony). Built for Claude Code.

## License

MIT. See [`LICENSE`](LICENSE).
