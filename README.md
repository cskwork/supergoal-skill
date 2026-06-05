# /supergoal

**English** | [한국어](README.ko.md)

**One objective in, a verified result out.**
Give it a goal; it runs the full gated pipeline with expert subagents and refuses to declare success until a machine-checkable gate passes.
No extra install: clone the repo, symlink it into your skills directory, then `/supergoal <objective>`.
Best starting point: the **[landing page](https://cskwork.github.io/supergoal-skill/)** (bilingual English / 한국어, 3-step quickstart).

A Claude Code skill that takes a single objective
through a full, gated development process using expert subagents, then refuses to declare success
until a machine-checkable gate passes.

Gated lanes, a single shared vault, an untrusted `claims.md` re-verified by an adversary, and a
literal-bash delivery gate that is never edited to pass. Each role's persona is a bundled file in
`agents/`, so dispatch is **harness-agnostic**: it runs the same under Claude Code, Codex, agy, and
other coding CLIs (the orchestrator spawns the persona via the harness's sub-agent mechanism, or runs
it inline where none exists). **Nothing to install but the skill itself.** (Workflow inspired by
[oh-my-symphony](https://github.com/cskwork/oh-my-symphony).)

> **New here? Start with the landing page** -> **[cskwork.github.io/supergoal-skill](https://cskwork.github.io/supergoal-skill/)**
> A bilingual (English / 한국어) walkthrough with a 3-step quickstart, the modes, how the
> builder-vs-verifier split catches real bugs, and the evidence it produces. Best onboarding path before you clone.

## Modes

`/supergoal` detects the mode from your objective:

| Objective looks like | Mode | Pipeline |
|---|---|---|
| "build / ship a new app/tool" | **GREENFIELD** | Intake -> **Validate (market/demand)** -> Plan -> **Human Feedback** -> Build -> Verify -> QA -> Deliver |
| "fix / broken / failing / why does" | **DEBUG** | Intake -> Reproduce -> Diagnose -> **Human Feedback** -> Fix -> Verify -> Deliver |
| "add X to our existing/legacy code" | **LEGACY** | Intake -> Explore -> Plan -> **Human Feedback** -> Build -> Verify -> QA -> Deliver |
| "explain / understand / teach me X" (learn, no code) | **LEARN** | Intake -> Source -> Bridge -> Teach loop -> Check (explain-back) -> Journal |
| "learn / map / onboard onto this codebase" (build a domain wiki for the agent) | **LEARN-DOMAIN** | Intake -> Survey -> Scope checkpoint -> Map -> Deepen -> **Ground** -> Persist -> **Onboard (human handbook)** -> Freshness |
| "QA only / verify / compare data — no code change" | **QA-ONLY** | Intake -> Target & Access -> Scenario checkpoint -> Exercise -> Cross-check -> **Report** -> Persist |
| "make a skill / learn new skill / make skill from history — no product code" | **SKILL-MINE** | Intake -> Window -> Mine -> Rank -> Suggest -> **Human pick/reject** -> Forge -> Verify -> Install -> Journal |

QA-ONLY exercises an already-running app (and a read-only, DB-independent database) to QA behavior or
compare data — it writes no code, creates no worktree, and runs no implementation gates. It produces a
human-friendly `report.md` (what worked / what didn't / what it discovered) and persists a reusable,
indexed QA suite under `.domain-agent/qa/` so the same check re-runs fast. Browser driving uses
`agent-browser` by default, attach-to-browser (Playwright CLI) for authenticated sessions; app-driving
and DB-reading run in separate read-only subagents so raw rows never mix into the browser context.

LEARN-DOMAIN learns a codebase *for the agent* and persists a source-grounded, execution-verified
`.domain-agent/` wiki so later runs route fast. Its final **Onboard** step also renders one self-contained
`onboarding.html` handbook **for humans** (what the domain is, key terms, architecture, flows, and the
rules that must not break) - the markdown pack stays the agent's source of truth.

SKILL-MINE turns repeated work into a reusable skill. It mines recent agent session history
(`~/.claude/projects/*.jsonl`, adaptive 7-30 day window), surfaces 3-5 candidate skills ranked by
frequency x payoff, and lets you pick / reject / name a new one. On your pick it forges ONE
cross-agent-portable `SKILL.md` (the agentskills.io standard) and installs it to each chosen agent
(`~/.claude/skills`, `~/.codex/skills`, `~/.config/opencode/skills`, `~/.hermes/skills`). The human pick
is a hard gate - it never creates or installs a skill you did not approve. It writes no product code and
no worktree.

```text
/supergoal build a habit-tracker app and ship it
/supergoal the checkout page hangs intermittently in prod. fix it
/supergoal add SSO to our legacy Django monolith
/supergoal learn this codebase and build a domain wiki
/supergoal QA the checkout flow on staging and check the order totals match the DB (no code change)
```

## Why it exists

A single agent given a big objective drifts: it skips validation, trusts its own "done", and leaves
unverified claims. `/supergoal` imposes the discipline a senior team would (see [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/research-brief.md`](docs/research-brief.md)):

- **Topology, not preference, picks the architecture.** Fan out for wide-and-shallow work
  (validation, scaffolding); single-driver for deep-and-narrow work (one bug, one feature).
- **Branch-scoped worktree isolation.** Coding/debug runs ask for a base branch and target branch,
  build in a dedicated `git worktree`, merge accepted work into the target branch, then keep the
  three most recent completed run worktrees so parallel agents do not edit the same checkout. Older
  repo-managed completed run worktrees are pruned only when the retained count exceeds three.
- **Builder != Verifier.** The agent that writes code never approves it. A fresh adversarial Verify
  agent re-runs every `run-to-prove` from a clean state. (`claims.md` is untrusted.)
- **Human Feedback before implementation.** After intake/repro/diagnosis/planning, the skill pauses
  with two briefs: plain language first, then a novice-dev-friendly technical brief with term definitions.
- **Two-layer done-gate.** Hard gate (tests/lint/build, deterministic) plus a soft committee
  (architect + security + code-review). The rubric can never override a failing test.
- **Gate on the project's own suite** (run in the workspace; the Verify agent independently re-runs from a clean state). Never benchmarks, never self-report.
- **Bounded retry + circuit breaker.** Same error 3x trips the circuit breaker: stop, root-cause, escalate. No infinite loops.

## The non-negotiable gates

1. Validate-before-build (GREENFIELD).  2. Plan freezes scope.  3. Human Feedback approval.
4. Builder != Verifier.  5. Multi-expert review before deliver.
6. Literal delivery gate (`templates/delivery-gate.sh` exits 0).  7. Bounded retry + circuit breaker.

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

The skill runs on Windows; the gate and test scripts are POSIX shell, so run them under **Git Bash**
or **WSL** (both ship bash; `node` must be on `PATH`). The repo pins `.gitattributes eol=lf`, so a
Windows checkout keeps scripts as LF and bash parses them cleanly. Two notes:

- Install by **copy** if symlinks need admin rights: `cp -R supergoal-skill "$HOME/.claude/skills/supergoal"` (Git Bash/WSL) or `mklink /D` from an elevated `cmd`.
- Run the contract tests under **WSL** bash. Git Bash's bundled `grep` can abort on piped input, which
  makes the suites mis-report; WSL avoids it.

## Layout

```
SKILL.md            thin spine: mode detection, gates, reference map
agents/             one persona file per role (system prompt), harness-agnostic dispatch source of truth
reference/          pipeline · experts · vault · market-research · quality-gates · debugging · qa · qa-only · db-access · domain-rules · plan-grounding · interview · learn · learn-domain · skill-mine
reference/ui-ux.md  UI/UX overlay -> routes to Expressive (taste-skill-v2, vendored) or Functional (functional-ui) tier
learn/              LEARN-mode session journals (one file per session) + README template + USER_PREFERENCE(.template).md
templates/          delivery-gate.sh · validate-gate.sh · qa-gate.sh · qa-only-gate.sh · human-feedback-gate.mjs · skill-mine/ · skill-frontmatter-gate.mjs · qa-report.md · state.json
docs/               DESIGN.md (research -> decision mapping, cited) · research-brief.md · e2e-test-plan.md · changelog/ · index.html (landing)
examples/url-shortener/   a real service the harness built/debugged/extended (audit trail in docs/changelog/)
```

## Proof it works (live validation)

All three modes were run end-to-end on a real, production-grade service (a zero-dependency URL
shortener, see [`examples/url-shortener/`](examples/url-shortener/), 68 tests). The audit trail for
each run is in [`examples/url-shortener/docs/changelog/`](examples/url-shortener/docs/changelog/) (these early run records predate the file-set consolidation).

- **GREENFIELD.** The adversarial Verify caught **2 real SSRF bypasses** (`[::ffff:127.0.0.1]`,
  `localhost.`) and an unauth-500 that all passed the builder's own green tests, before shipping.
- **DEBUG.** Given only a symptom ("hits undercount under load"), it reproduced (200 concurrent ->
  1/200), root-caused a **lost-update race**, stopped at Human Feedback for approval, fixed, and re-verified
  with anti-flake concurrency runs (0 lost across 10 trials).
- **LEGACY.** Added link-expiry (TTL) with **zero regressions** (backward-compatible with records
  that predate the field), committee-approved, gate-green.

Adversarial verification caught a real defect in 2 of 3 runs.

**QA-ONLY** was separately dogfooded against a live, Cloudflare-protected site. The mode tried
`agent-browser`, hit the bot challenge, and recorded an honest **BLOCKED** verdict (no fabricated pass)
with as-is/to-be evidence, recommended **attach-to-browser** as the remediation, and its terminal gate
(`qa-only-gate.sh`) passed on the truthful evidence — the same no-fake-pass discipline, applied to a
no-code run.

A separate evidence-only private-codebase benchmark compared plain Codex CLI, `/supergoal`, and
Codex Goal mode on the same hard backend task with the same hidden scorer. See
[`docs/experiments/2026-05-30-private-codebase-comparison/`](docs/experiments/2026-05-30-private-codebase-comparison/).

- **`/supergoal`:** passed all hidden checks, focused regressions, neighbor checks, `git diff --check`,
  and the delivery gate.
- **Codex Goal mode:** fixed the main code path and passed focused checks, but missed one hidden
  fallback/preservation coverage check.
- **Plain Codex CLI:** produced no usable result: idle run, no solution diff, no final output.

## Credit

Concept and workflow adapted from **oh-my-symphony** by cskwork
(https://github.com/cskwork/oh-my-symphony). Built for Claude Code.

## License

MIT. See [`LICENSE`](LICENSE).
