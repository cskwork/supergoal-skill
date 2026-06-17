I have a complete, grounded inventory. Compiling the final report.

---

# Supergoal skill — grounded inventory

Repo root: `/Users/danny/Documents/PARA/Resource/supergoal-skill`. The skill is a thin spine (`SKILL.md`) + per-role personas (`agents/*.md`) + per-mode procedures (`reference/*.md`) + machine gates/templates (`templates/`) + contract tests (`tests/`). Prose may be any language; English anchors are load-bearing because shell gates grep them.

## Critical framing: two separate state surfaces

- **`.omx/state/*` is NOT the skill.** It is **oh-my-symphony harness telemetry** — the host runtime that drives Claude/Codex sessions. Files like `subagent-tracking.json`, `session.json`, `current-task-baseline.json`, `native-stop-state.json`, `metrics.json`, `logs/*.jsonl`, and per-session `hud-state.json`/`notify-hook-state.json`/`prompt-routing-state.json` are written by hooks, not by any supergoal mode. Do not treat these as a precedent the skill controls — but they ARE the precedent for "what a TUI/telemetry layer over these runs could read."
- **The skill's own machine-readable emission is almost nonexistent.** The ONLY structured state file any mode writes is QA-ONLY's `state.json` (see below). Every other mode emits human-readable markdown plus evidence files. This is the single biggest grounding fact for a STATE/progress design.

## (a) Run-vault convention

Path: **`docs/changelog/<YYYY-MM>/<DD-topic>/`** — one folder per run, in the TARGET repo (not `$TMPDIR`, not repo root). Defined in `reference/domain-context.md:6`. Topic slug is mode-specific (`<DD-arch-topic>`, `<DD-qa-topic>`, `<DD-review-topic>`). Standard contents:
- `README.md` — run log (also where SPEC-skip is logged, per `spec.md:26`).
- `surfaced-requirements.md` — implicit-requirement trail (template `templates/surfaced-requirements.md`; format: dated heading, one bullet `requirement / why implied / covering test::name / status: open|fixed`).
- verification evidence files (mode-dependent).

Separate from this: **domain context** = durable repo knowledge pack at `.domain-agent/` (config `templates/domain-agent/config.json`), and **model memory** (advisory only). "Current code always wins."

## (b) Existing state/telemetry files the skill actually writes

| File | Where | Shape / fields | Consumed by |
|---|---|---|---|
| `state.json` | QA-ONLY vault | `{ "action_count": <number>, "action_cap": <number=100> }` | `templates/qa-only-gate.sh` (exit 4 if non-numeric `action_count`; fail if `action_count > action_cap`). Tested in `tests/qa-only-contract.test.sh:87,105,107,109`. |
| `qa/contrast-pairs.json` | any UI run's vault | JSON array `[{ "el", "fg":"#hex", "bg":"#hex", "size":"body\|normal\|large\|decorative" }]` | `templates/contrast-gate.mjs` computes WCAG ratio + pass/fail; invoked by `qa-gate.sh` when a `UI-tier:` line or this file exists. |
| `verification.md` | GREENFIELD/LEGACY/DEBUG/QA vault | markdown with a grep-anchored `## QA` section carrying `Tool:` (must be `playwright-cli`) and `UI-tier:` lines | `templates/qa-gate.sh` |
| `harness-eval-result.json` | HARNESS-EVAL | rich JSON: `baseline`/`harness` each with `machine_checks[]`, `cost{tokens,duration_ms,tool_calls}`, `quality.*.by_case.*.dimensions` (10 RevFactory dims 0–10), `winner`, `blind_grading`, `claim_status` | `templates/harness-eval-gate.mjs` (validates dims, `winner ∈ {baseline,harness,tie,not_proven}`) |

So: **two real machine-state precedents exist** — a flat budget counter (`state.json`) and a rich result doc (`harness-eval-result.json`). Neither is a generic cross-mode progress/STATE file.

## (c) Roles → agent personas

Role mapping lives in `SKILL.md` (~L83) and `reference/role-loop.md`. The orchestrator is referred to as the **conductor** (every persona says "Honor any Priority Rules the conductor injects (advisory)"; personas run in isolation, cannot see each other's transcripts).

| Loop role | Persona file | Constraint |
|---|---|---|
| Build / Fixer | `agents/executor.md` | edits src, NOT test files |
| Critic | `agents/code-reviewer.md` | writes failing tests, NOT src; never weakens real tests |
| Verify | `agents/qa-auditor.md`, `agents/security-reviewer.md` | re-runs REAL tests; never fixes |
| Explore/map | `agents/explore.md` | `file:line`, current code wins |
| DB evidence | `agents/db-reader.md` | read-only; raw rows/secrets stay out of vault |
| UI work | `agents/designer.md` | implements to conductor-named tier; never self-approves |
| QA-ONLY drive | `agents/qa-auditor.md` + `agents/db-reader.md` | |
| Others | `analyst.md`, `architect.md`, `debugger.md`, `qa-tester.md`, `skill-forger.md`, `skill-miner.md` | |

## (d) Gate / test mechanism

Two layers:
1. **Runtime gates** (`templates/`) — shell/node scripts that convert prose rules into machine-checkable exit conditions, run at a mode's terminal boundary. Key ones: `qa-gate.sh` (in-pipeline QA), `qa-only-gate.sh` (QA-ONLY backstop, wraps qa-gate + action-cap + DB read-only check), `contrast-gate.mjs` (WCAG), `harness-eval-gate.mjs`, `learn-grounding-gate.mjs`, `skill-frontmatter-gate.mjs` (name regex, `COMBINED_CAP=1536`, `BODY_WARN=20000`). All carry a "NEVER edit this gate to pass" banner.
2. **Contract tests** (`tests/*.test.sh`, 13 files) — pure-bash, repo-relative, no target needed. They assert each reference/template keeps its load-bearing anchors (e.g. `role-loop-contract.test.sh` fails if the critic stops recording surfaced requirements). `tests/gate-scenarios.test.sh` runs the gates against synthetic vaults (pass/fail cases). Tests print `PASS/FAIL` counts; run via `bash tests/<x>.test.sh`.

## Per-mode inventory

Mode table source: `SKILL.md` L28–45. Default loop = `reference/role-loop.md` (Build→Critic→Fixer→Verify).

| Mode | One-line purpose | Artifacts / evidence written | Machine-readable STATE? | Biggest reviewer-flag gaps |
|---|---|---|---|---|
| **GREENFIELD** (`role-loop.md`) | build new app/tool | vault `README.md`, `surfaced-requirements.md`, `verification.md` (`## QA`), `qa/` evidence; product code | None except QA-derived `verification.md`/`contrast-pairs.json`. No build/progress/task state. | (1) No per-task progress state — long builds are opaque mid-run. (2) No emitted "what was verified" struct; the "command output" proof is prose only. |
| **DEBUG** (`debugging.md`, `qa.md`, `playwright-cli.md`) | fix broken/failing; observe live boundary before code | failing repro test; vault verification; web bugs add `qa/nav-map.md` (screen→exact API) | None structured; repro is a test file. | (1) No machine record of "symptom boundary observed before fix" (the mode's core discipline is unenforced by any gate). (2) nav-map is markdown, not queryable. |
| **LEGACY** (`role-loop.md`, `domain-context.md`, `explore.md`, `qa.md` "API baseline") | add/integrate/refactor existing code | `.domain-agent/` map; **preserve-baseline** capture of existing API; Verify diffs re-capture | Baseline capture exists but format is per-`qa.md`, not a declared schema. | (1) Baseline-diff is prose-compared, no structured before/after artifact. (2) Heavy reliance on `.domain-agent/` freshness with no staleness signal surfaced to user. |
| **SPEC** (`spec.md`) | requirements→design→tasks before Build | `docs/spec/<feature-slug>/{requirements,design,tasks}.md` (templates in `templates/spec/`); ADRs under `docs/adr/`; `tasks.md` is checkbox plan with `_Requirements: N.N_` refs | `tasks.md` checkboxes are the closest thing to progress — but markdown, not parsed. EARS↔test traceability is convention only. | (1) No machine check that every EARS criterion has a covering test or `_Requirements:_` resolves (verify step is prose). (2) tasks.md checkbox state isn't readable as progress telemetry. |
| **ARCH** (`arch.md`) | survey architectural friction, grill the pick, route out; no edits | `report.md` (per-candidate Files/Problem/Solution/Benefits/strength; `Top recommendation:` + `Not covered:`); optional `CONTEXT.md`/ADR | None. Pure markdown report. | (1) No gate at all — "git status clean except vault" is unenforced. (2) Candidate strength (`Strong/Worth/Speculative`) not machine-captured for tracking across runs. |
| **REVIEW-ONLY** (`review-only.md`) | findings report on diff/PR, no fixes | `report.md` severity-ordered (CRITICAL/HIGH/MEDIUM/LOW, each `file:line`); `Untested behaviors:`, `Not covered:` | None. | (1) No gate enforcing "git clean / no edits" or required headings (unlike QA-ONLY). (2) Findings severity not emitted as structured data. |
| **QA-ONLY** (`qa-only.md`) | drive running app + read-only DB, verify, no code | vault `brief.md`, `verification.md` (`## QA`), `report.md` (4 anchors: What worked/didn't/discovered/How to re-run), `qa/` evidence, **`state.json`**, `.domain-agent/qa/<suite>.md` + `index.md` | **YES — the reference precedent.** `state.json` = `{action_count, action_cap:100}`; gate enforces cap + DB read-only. | (1) `state.json` is only a budget counter — no scenario-level pass/fail or progress structure. (2) Saved-baseline staleness is prose-checked, not flagged. |
| **LEARN / LEARN-DOMAIN** (`learn.md`, `learn-domain.md`) | teach a human / map codebase to `.domain-agent/` wiki | LEARN session journals in `learn/*.md`; LEARN-DOMAIN writes `.domain-agent/` pack | `learn-grounding-gate.mjs` enforces source-grounding; no progress state. | (1) Grounding gate exists but no machine link from claims→`file:line` evidence. (2) `.domain-agent/` `config.json` has `refreshPolicy` (staleAfterDays:5, fullReviewAfterDays:30) but staleness isn't surfaced. |
| **HARNESS-EVAL** (`harness-eval.md`) | measure harness vs baseline, blind-graded | `harness-eval-result.json` (rich), `harness-eval-report.md`; cases in `templates/harness-eval-cases/` (15 RevFactory + authored, with hidden/visible test fixtures) | **YES — richest struct.** Full JSON with cost, 10 quality dims, winner, `claim_status`. | (1) `claim_status:"not_proven"` default is honest but there's no aggregation across runs. (2) Result JSON is per-eval, not a running ledger. |
| **SKILL-MINE** (`skill-mine.md`) | turn repeated work into a reusable skill | runs `templates/skill-mine/mine.mjs --repo/--all/--minsup/--days`; new skill scaffold via `skill.md.template`, validated by `skill-frontmatter-gate.mjs` | mine.mjs emits frequent-pattern output (structured) but not persisted run-state. | (1) No record of which mined patterns became skills. (2) Frontmatter gate checks form, not whether the mined skill is actually reused. |

## Cross-cutting gaps a reviewer would flag (grounding for the improvement pass + TUI)

1. **No unified machine-readable run STATE.** Eight of ten modes emit only markdown. Only QA-ONLY (`state.json`) and HARNESS-EVAL (`harness-eval-result.json`) are parseable, and their schemas are unrelated. A TUI has nothing consistent to read per run.
2. **No progress/phase telemetry.** The loop has explicit phases (Frame→Build→Critic→Fixer→Verify) and SPEC has checkbox tasks, but none of these are written anywhere a TUI could poll. The only live signal available today is the host's `.omx/state/*` (subagent-tracking, hud-state) — which is harness-owned, not skill-owned.
3. **Gate coverage is uneven.** QA/QA-ONLY/UI/harness/learn/skill have gates; **ARCH and REVIEW-ONLY have none** — their "no source edits" discipline is honor-system. SPEC's EARS↔test traceability is unverified.
4. **Vault `README.md` is unstructured.** It is the per-run log but has no template/schema, so there's no reliable place to record mode, phase, verified-commands, or final verdict in machine form.

Key files to anchor any change: spine `SKILL.md`; loop `reference/role-loop.md`; the two state precedents `templates/qa-only-gate.sh` + `templates/harness-eval-result.json`; vault convention `reference/domain-context.md:6`; gate runner `tests/gate-scenarios.test.sh`.