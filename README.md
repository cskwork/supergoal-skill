# /supergoal

**English** | [한국어](README.ko.md)

**One objective in, a verified result out - the smallest correct change, checked against the real tests.**
No extra install: clone the repo, symlink it into your skills directory, then `/supergoal <objective>`.
Landing page: **[cskwork.github.io/supergoal-skill](https://cskwork.github.io/supergoal-skill/)**.

An agent skill for heavy coding objectives where a normal "just edit it" pass is too easy to fool. It
takes one objective, chooses the right workflow route, surfaces requirements that were not in the prompt,
makes the smallest correct change, verifies against the project's own tests and spec, then stops.

## What `/supergoal` does

`/supergoal` is a routing and verification wrapper around an agent. The useful mental model:

1. **Route the objective.** Classify the request as build, debug, legacy change, spec, QA, review,
   architecture, teaching, domain onboarding, harness eval, or skill mining.
2. **Load only the needed playbook.** The root `SKILL.md` stays small; each route loads its own
   `reference/` and `agents/` files only when needed.
3. **Separate roles.** Heavy work uses fresh-context subagents for build, critic, fixer, and verifier so
   one context does not both invent and grade the answer.
4. **Run Before/After Eval.** Capture the before state, define the after target, and keep a command
   manifest so the final claim proves the delta instead of just saying "tests passed."
5. **Prove against the real project.** Hidden requirements become failing tests or evidence, then the run
   verifies with the repo's real tests, browser checks, DB evidence when load-bearing, and prose spec.
6. **Stop at the verified result.** No open-ended refactor, no proxy checklist, no fake green.

## What it adds over a plain baseline

A strong model with the real spec is the bar. `/supergoal` adds only what a plain baseline cannot do for
free: it surfaces the requirements that are **not in the prompt** - as FAILING tests written by an
independent critic - then makes the smallest correct change and verifies it against the project's real
tests and spec, never a generated proxy. For a trivial single edit, skip the skill and edit directly.

Each role is a bundled file in `agents/`, so dispatch stays harness-agnostic across Claude Code, Codex,
agy, and other agent CLIs. Each role runs in a fresh-context subagent by default - the conductor stays
lean while the role's heavy references load inside the subagent, and independent units run in parallel; a
trivial single edit stays inline.

## Principles

- **Verify against ground truth.** Re-run the project's REAL tests and re-read the prose spec for rules
  the tests miss. Never generate a proxy checklist/verifier and optimize to it.
- **Smallest correct change.** Match the surrounding code; no whole-file rewrites to change a few lines.
- **Surface hidden requirements first.** The one place a process beats a plain baseline.
- **Before/After Eval for real code changes.** GREENFIELD proves what was absent or red before; DEBUG
  reproduces the symptom; LEGACY/brownfield captures behavior to preserve before changing it.
- **Ask only when genuinely ambiguous.** Resolve code-answerable questions by reading the code.
- **Hard stops.** A destructive/irreversible step needs consent; if the real tests cannot pass, report it -
  never fake a pass.
- **Standing rules (read first).** If the target project has `.supergoal/rules/RULES.md`, supergoal reads it before
  every run and honors it across all modes as the highest-priority preferences - never weakening safety
  gates. Created only when you ask, gitignored, and otherwise left untouched (`reference/rules.md`).

## Modes

`/supergoal` detects the mode from your objective:

```mermaid
flowchart TD
    A["/supergoal <one heavy objective>"] --> B["Frame the goal<br/>acceptance criteria<br/>hidden risks"]
    B --> C{"Route by objective"}

    C -->|"build / make / ship"| GREENFIELD["GREENFIELD<br/>new app or tool"]
    C -->|"fix / broken / failing"| DEBUG["DEBUG<br/>reproduce, diagnose, fix"]
    C -->|"add / integrate / refactor"| LEGACY["LEGACY<br/>map existing code first"]
    C -->|"spec / requirements first"| SPEC["SPEC<br/>requirements -> design -> tasks"]
    C -->|"QA / verify only"| QAONLY["QA-ONLY<br/>Impact Matrix + evidence"]
    C -->|"review / audit"| REVIEW["REVIEW-ONLY<br/>findings, no fixes"]
    C -->|"architecture improvement"| ARCHITECTURE["ARCHITECTURE<br/>friction survey -> candidates"]
    C -->|"explain / teach"| TEACH["TEACH<br/>stateful teaching workspace"]
    C -->|"learn / onboard"| LEARN["LEARN-DOMAIN<br/>persist domain wiki"]
    C -->|"harness effectiveness"| HARNESS["HARNESS-EVAL<br/>baseline vs harness"]
    C -->|"make a reusable skill"| SKILLMINE["SKILL-MINE<br/>mine -> forge -> install"]

    GREENFIELD --> LOOP["Default delivery loop<br/>Build -> Critic -> Fixer -> Verify"]
    DEBUG --> LOOP
    LEGACY --> LOOP

    SPEC --> DOCS["Docs first<br/>then tasks route into delivery"]
    ARCHITECTURE --> PICK["Grill chosen candidate<br/>then route to LEGACY or SPEC"]

    QAONLY --> REPORT["No product code by default<br/>report evidence and risk"]
    REVIEW --> REPORT
    TEACH --> REPORT
    LEARN --> REPORT
    HARNESS --> REPORT
    SKILLMINE --> REPORT
```

| Objective looks like | Mode | Approach |
|---|---|---|
| "build / ship a new app/tool" | **GREENFIELD** | default loop |
| "fix / broken / failing / why does" | **DEBUG** | default loop; reproduce with a failing test first |
| "add X to our existing/legacy code" | **LEGACY** | default loop; map the code first; refactoring an existing API: capture its exact behavior first, Verify diffs against that baseline |
| "spec this first - requirements/design/tasks docs" | **SPEC** | grill load-bearing decisions one question at a time; requirements -> design -> tasks crystallize under `docs/spec/`, then the default loop runs against them |
| "explain / teach me X" (no code) | **TEACH** | Mission -> Source -> Bridge -> Teach -> Check (explain-back) |
| "learn / map / onboard onto this codebase" | **LEARN-DOMAIN** | Survey -> Map -> Ground -> Persist a `.domain-agent/` wiki |
| "QA only / verify / compare data - no code" | **QA-ONLY** | Detailed Impact Matrix (feature-impact QA map) + read-only DB -> evidence -> `report.md` |
| "review / audit this code/diff/PR - no fixes" | **REVIEW-ONLY** | Two independent reviewers -> verified findings -> `report.md` |
| "improve the architecture / find refactoring opportunities" | **ARCHITECTURE** | Friction survey -> candidates as a visual `report.html` -> grill the pick -> refactor routes to LEGACY/SPEC |
| "test harness effectiveness / with vs without" | **HARNESS-EVAL** | Cases -> baseline run -> harness run -> machine checks -> quality score -> compare |
| "make a skill from history - no product code" | **SKILL-MINE** | Mine history -> rank -> you pick -> forge portable `SKILL.md` -> install |

**Default loop (GREENFIELD / DEBUG / LEGACY), role-separated:** 1) **Frame** the goal + acceptance
criteria and start `delivery-proof.md` with Before/After Eval; 2) **Build** the smallest correct change,
test-first (bug -> failing test first); 3) an
independent **Critic** re-reads the spec and writes a FAILING test for each required behavior the existing
tests miss; 4) a **Fixer** makes those pass with the smallest change; 5) **Verify** against the real tests
and re-read the spec for uncovered rules - stop only after after-evidence, resolved decision gates, and
residual risk are recorded with command output.

Coding/debug runs use a run worktree by default: resolve and verify the source/base branch plus the
target/integration branch before editing, create the run worktree from source/base, and only commit or
merge into the verified target/integration branch after green verification and user acceptance. Browser UI
changes also require real browser QA: `Tool: playwright-cli` evidence and `qa-gate.sh <vault> browser`.

```text
/supergoal build a habit-tracker app and ship it
/supergoal the checkout page hangs intermittently in prod. fix it
/supergoal add SSO to our legacy Django monolith
/supergoal learn this codebase and build a domain wiki
/supergoal QA the checkout flow on staging and check the order totals match the DB (no code change)
/supergoal compare this migration harness with and without the harness on 3 cases
```

QA-ONLY, REVIEW-ONLY, ARCHITECTURE, TEACH/LEARN-DOMAIN, HARNESS-EVAL, and SKILL-MINE are kept as separate-purpose
utilities (detailed no-code QA, findings-only review, teaching/onboarding, harness measurement, skill
forging). QA-ONLY is the broad regression lane. Its Impact Matrix is a QA map of everything the feature can
affect: displayed data consistency, direct behavior, adjacent surfaces, complex multi-step scenarios,
before/during/after actions, and explicit not-covered risk within the action cap. Independent QA surfaces
can run as scenario shards, merged by the conductor through `qa/scenario-ledger.md`.
They write no product code by default and confirm with you before installing anything.

## Board (optional live dashboard)

Watch progress across concurrent agents in real time. `bash tui/launch.sh &` opens an in-browser
dashboard (Textual) showing each agent's mode + workflow stage (Frame -> Build -> Critic -> Fixer ->
Verify) and a Jira-like task board, grouped by repo / branch / worktree. Branch is advisory - never
locked, so multiple agents can share a branch freely.

It is pure observability: opt-in, best-effort, and it never gates or blocks a run - if no agent emits,
every mode still passes unchanged. When enabled, the conductor calls `sg-emit`
(`templates/observability/`) at each phase transition, writing one atomically-replaced heartbeat JSON
per agent under `~/.supergoal/runs/agents/`; the dashboard (`tui/`) polls and renders them. Correctness
is just one writer per file + atomic rename - no lock anywhere. In-browser serving needs
`pip install textual-serve`; without it, run the local TUI with `python -m tui.app`. Full spec:
[`reference/observability.md`](reference/observability.md).

## Install

This repo **is** the skill. Put it where your agent CLI finds skills:

```bash
git clone https://github.com/cskwork/supergoal-skill.git
cd supergoal-skill
SRC="$(pwd)"
mkdir -p ~/.agents/skills ~/.codex/skills ~/.claude/skills

# Recommended: one canonical source checkout, symlinked into each active agent.
# If a target already exists, audit it first and preserve any local edits before replacing it.
ln -s "$SRC" ~/.agents/skills/supergoal
ln -s "$SRC" ~/.codex/skills/supergoal
ln -s "$SRC" ~/.claude/skills/supergoal

# Read-only drift check for active installs:
node templates/skill-install-audit.mjs "$SRC"

# Canonical repo verification:
bash tests/run-all.sh
```

Then in your agent CLI: `/supergoal <your objective>`.

### Windows

The skill runs on Windows; the remaining gate/test scripts are POSIX shell, so run them under **Git Bash**
or **WSL** (`node` must be on `PATH`). The repo pins `.gitattributes eol=lf`. Install by **copy** if
symlinks need admin rights (`cp -R` in Git Bash/WSL, or `mklink /D` from an elevated `cmd`); run
`node templates/skill-install-audit.mjs <source-skill-dir>` after copying, then run the contract tests
under **WSL** bash.

## Layout

```
SKILL.md            thin spine: baseline-first loop, modes, reference map
agents/             one persona file per role (analyst, architect, executor, debugger, explore, designer, qa-*, db-reader, code-reviewer, security-reviewer)
reference/          domain-rules · rules (project standing rules) · domain-context · debugging · interview · delivery-gate · plan-grounding · market-research · qa · qa-only · db-access · teach · learn-domain · ui-ux · taste-skill-v2 · functional-ui · harness-eval · skill-mine · observability
teach/              TEACH-mode format guides + per-topic teaching workspaces
templates/          delivery-proof.md · rules.md · qa-gate.sh · qa-only-gate.sh · contrast-gate.mjs · learn-grounding-gate.mjs · qa-report.md · db-access/ · domain-agent/ · domain-onboarding.html · arch-report.html · harness-eval-gate.mjs · harness-eval-cases/ · skill-mine/ · skill-frontmatter-gate.mjs · skill-install-audit.mjs · skill.md.template · observability/ (sg-emit board state)
tests/              contract tests + run-all.sh canonical verifier
tui/                optional live Board: state.py (reader) · app.py (Textual UI) · serve.py (in-browser) · launch.sh
docs/               DESIGN.md · research-brief.md · experiments/ (the harness evals) · changelog/ · index.html (landing)
examples/url-shortener/   a worked example service exercised across the build / debug / extend modes
```

## Evidence

The design is grounded in head-to-head evals - `docs/experiments/2026-06-07-harness-eval-*` and
`log/changelog-2026-06-07.md` (3 cases, 2 models, 4 harness forms). The result that shapes the skill: on
tasks with an explicit spec, a strong baseline that reads the real spec is the bar to beat, and optimizing
to a generated-proxy verifier can score worse via Goodhart. `examples/url-shortener/` is a worked example
service exercised across the build, debug, and extend modes.

## Harness Eval Reference

HARNESS-EVAL reusable sample cases come from RevFactory's `claude-code-harness`:
https://github.com/revfactory/claude-code-harness/

## Credit

Concept and workflow adapted from **oh-my-symphony** by cskwork
(https://github.com/cskwork/oh-my-symphony). Built as a portable agent skill.

## License

MIT. See [`LICENSE`](LICENSE).
