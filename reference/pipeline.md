# Pipeline — phases & exit gates per mode

Forward-only lanes. A phase opens only when the prior
phase's **exit gate** passed. Gates are machine-checkable, not vibes. Backward edges exist only as
explicit rewinds (Verify/QA can re-open Build).

The vault for a run is `docs/changelog/<date>-<slug>/` in the target repo (a tracked, browsable
changelog — not hidden scratch); every phase reads/writes there. Six files only — see `vault.md`.

## Topology rule (apply before dispatching any phase)

Research consensus (Cognition + Anthropic, mid-2025; LangChain "how/when to build multi-agent
systems"): **the task topology, not preference, picks the architecture.**

- **Wide-and-shallow** (independent threads: research, market scans, scaffolding several modules) →
  **fan out** parallel subagents.
- **Deep-and-narrow** (one coherent feature, one bug, a long refactor) → **single driver** + isolated
  helper subagents only for genuinely independent sub-investigations.

Therefore: **GREENFIELD** Validate/Plan/scaffold phases fan out; **DEBUG** and **LEGACY** default to a
**single driving agent** and open in **read-only Plan Mode** through their investigation phases.
All modes pause at **Human Feedback** and require explicit human approval before the first
implementation write (antstack.com; developersdigest.tech Plan Mode guidance).

## Domain rules (advisory, all modes)

At Intake, route the objective to its `ten-rules` domain(s) and record a `## Priority Rules` digest
(≤10 abstract rules) in `README.md`. Plan/Build honor it; the committee checks the diff against it.
It is **not a gate** — it never blocks or overrides the hard gates. Mechanism: `domain-rules.md`.

## UI/UX overlay (when the deliverable is visual UI)

On objectives that ship user-facing look-and-feel, layer the taste-skill v2 overlay onto whichever
mode is running: a Design Read + three dials at **Plan**, a Designer at **Build**, and the taste
Pre-Flight Check as an added **QA** gate. It does not change phases or gates — see `reference/ui-ux.md`.

## Plan grounding (GREENFIELD & LEGACY)

Between Plan and Human Feedback, the planner grounds `plan.md` against the project's own
domain/architecture — **agent-run**: it answers each grill challenge itself from the explored docs,
with no human round-trip. Feature/novel work uses a `grill-with-docs`-style self-grill; "improve /
refactor" objectives use an `improve-codebase-architecture`-style deepening pass. The human's one
approval stays the later Human Feedback gate. Full method: `reference/plan-grounding.md`.

## Artifact-skip gates (from autopilot)

Before running a phase, check the vault for an upstream artifact that already satisfies it and skip:
- A `brainstorming`/`deep-interview` spec present → skip Intake elaboration.
- A `ralplan`/`writing-plans` plan present → treat as `plan.md`, skip Plan (still freeze it).
- An existing PRD / issue with acceptance criteria → seed `brief.md` directly.
Log every skip to `README.md`.

---

## GREENFIELD — Intake → Validate → Plan → Human Feedback → Build → Verify → QA → Deliver

| Phase | Goal | Reads | Writes | Exit gate (must pass to advance) |
|---|---|---|---|---|
| **Intake** | Turn objective into a brief (goal, audience, done-criteria, non-goals) | objective | `brief.md`, `state.json` | `brief.md` has explicit, machine-checkable acceptance criteria |
| **Validate** | Prove real demand + scope an MVP (see `market-research.md`) | `brief.md` | `brief.md` (`## Validation`) | `templates/validate-gate.sh <vault>` exits 0 — the script checks that `brief.md` contains a line-start or `## `-prefixed `Decision: GO`; **NO-GO or no GO line exits non-zero, Build does not open**. Machine-checkable parallel to `delivery-gate.sh`. |
| **Plan** | Ground the plan (see Plan grounding), then decompose into independently-testable slices; choose stack; define contracts | `brief.md` | `plan.md` (frozen; incl. Architecture + Contracts sections) | `plan.md` task table exists, every slice ≤5 files / ≤~500 lines, each has an acceptance check. On exit, orchestrator records `shasum -a 256 plan.md` into `state.json.plan_hash`. |
| **Human Feedback** | Ask the human to approve, revise, or stop before implementation | `brief.md`, `plan.md` | `plan.md` (`## Human Feedback`), `state.json.approval` | `plan.md` has the required two briefs; human explicitly approves `Build`; `node templates/human-feedback-gate.mjs <vault> Build` exits 0. No source-tree write before this. |
| **Build** | Implement each slice (architect→editor split); write a claim per slice | `plan.md` | code, `claims.md` (append-only) | local tests for the slice pass + a `claims.md` entry with a `run-to-prove` command |
| **Verify** | Adversary re-runs every claim from clean state (see `quality-gates.md`) | `claims.md`, code | `verification.md` | every claim GREEN + a `## Coverage` map (acceptance criteria + domain checklist) with `Not covered:` and `Regression tests:` lines + a completeness-critic pass that found no un-named gap, ending in one aggregate `verdict: GREEN` line (no line-start `verdict: RED`); any RED rewinds to Build |
| **QA** | Black-box exercise the running app (`reference/qa.md`; conditional on app type) | running app | `verification.md` (`## QA`) + `qa/` evidence | golden + edge + a11y pass for browser apps; CLI/lib: integration smoke passes; **`bash templates/qa-gate.sh <vault> <browser\|cli>` exits 0** — browser apps must carry `qa/as-is-*` + `qa/to-be-*` evidence and a `## QA` `Tool:` line, and any non-agent-browser driver needs a `Fallback:` justification (a silent headless-Chrome fallback fails) |
| **Deliver** | Run the literal gate; package | all | commit / PR | plan-hash matches (see `reference/vault.md`). Then `templates/delivery-gate.sh` exits 0 — paste output. |

---

## DEBUG — Intake → Reproduce → Diagnose → Human Feedback → Fix → Verify → Deliver

Single-driver topology. Open in Plan Mode (read-only) through Human Feedback; get approval before Fix.

| Phase | Goal | Reads | Writes | Exit gate |
|---|---|---|---|---|
| **Intake** | Capture symptom, environment, expected vs actual | objective | `brief.md` | symptom + expected behavior stated |
| **Reproduce** | Get a deterministic, **failing** reproduction | repo, logs | a failing test / repro script, `claims.md` | repro **fails** on current code in a clean sandbox (red proven) |
| **Diagnose** | Hypothesis-driven root cause (run the `diagnose` skill; see `debugging.md`) | repo, repro | `README.md` (hypotheses + evidence), `plan.md` (root-cause + minimal-fix plan, frozen) | one hypothesis confirmed by evidence; minimal fix plan written |
| **Human Feedback** | Explain the bug cause and fix plan, then wait for human approval | `README.md`, `plan.md` | `plan.md` (`## Human Feedback`), `state.json.approval` | `plan.md` has the required two briefs; human explicitly approves `Fix`; `node templates/human-feedback-gate.mjs <vault> Fix` exits 0. No source-tree write before this. |
| **Fix** | Smallest change at the root cause | confirmed cause | code patch | the previously-failing repro now **passes** |
| **Verify** | Re-run repro + full suite in clean sandbox; regression review | patch, suite | `verification.md` | repro GREEN + full suite GREEN + no new failures + a `## Coverage` map with `Not covered:` and `Regression tests:` (the failing-before/passing-after repro is the regression test) + completeness-critic pass; ends in one aggregate `verdict: GREEN` line |
| **Deliver** | Gate + package | all | commit / PR | `delivery-gate.sh` exits 0 |

A "fixed" claim is only valid as **failing-before → passing-after in a clean sandbox** (arxiv
2509.16941 on flawed tests; Anthropic verification practice).

DEBUG's Diagnose writes `plan.md` (the root-cause + minimal-fix plan). Human Feedback turns it into
an approved plan before Fix opens. The delivery gate
requires `brief.md` + `plan.md` + `verification.md` in **every** mode, so `plan.md` is universal: the
slice plan in GREENFIELD/LEGACY, the fix plan in DEBUG.

---

## LEGACY — Intake → Explore → Plan → Human Feedback → Build → Verify → QA → Deliver

Single-driver with targeted helper subagents for parallel codebase mapping. Plan Mode (read-only)
through Human Feedback; approval before Build.

| Phase | Goal | Reads | Writes | Exit gate |
|---|---|---|---|---|
| **Intake** | Feature spec + acceptance criteria | objective | `brief.md` | acceptance criteria stated |
| **Explore** | Map the affected code with file:line evidence (driven by the `explore` agent; fan out `Explore` helpers for parallel mapping) | repo | `README.md` (codebase map + citations) | entry points, call paths, blast radius documented with citations |
| **Plan** | Ground the plan (see Plan grounding), then a surgical change plan: smallest blast radius, reuse existing utilities | map | `plan.md` (frozen) | plan touches only what the feature requires; reuse noted. On exit, orchestrator records `shasum -a 256 plan.md` into `state.json.plan_hash`. |
| **Human Feedback** | Explain the implementation plan, then wait for human approval | `README.md`, `plan.md` | `plan.md` (`## Human Feedback`), `state.json.approval` | `plan.md` has the required two briefs; human explicitly approves `Build`; `node templates/human-feedback-gate.mjs <vault> Build` exits 0. No source-tree write before this. |
| **Build** | Implement matching existing style; no unrelated refactors | plan | code, `claims.md` | slice tests pass; no formatting/rename churn in unrelated files |
| **Verify** | Adversary re-runs claims; full existing suite must stay green | claims, suite | `verification.md` | all claims GREEN + pre-existing suite still GREEN (no regressions) + a `## Coverage` map with `Not covered:` and `Regression tests:` lines + completeness-critic pass; ends in one aggregate `verdict: GREEN` line |
| **QA** | Exercise the new feature + smoke the surrounding flows (`reference/qa.md`) | running app | `verification.md` (`## QA`) + `qa/` evidence | feature works + adjacent flows unbroken; **`bash templates/qa-gate.sh <vault> <browser\|cli>` exits 0** (browser apps: `qa/as-is-*` + `qa/to-be-*` evidence + a `## QA` `Tool:` line; non-agent-browser driver needs a `Fallback:` justification) |
| **Deliver** | Gate + package | all | commit / PR | plan-hash matches (see `reference/vault.md`). Then `delivery-gate.sh` exits 0. |

---

## Rewinds & circuit breaker

- Verify RED or QA fail → rewind to Build/Fix with the specific failure.
- Human rejects or changes the Human Feedback packet → rewind to Plan/Diagnose, update the vault,
  and ask again. Never treat silence as approval.
- **Max 5 fix cycles per phase.** Same error signature 3× → STOP, write root cause to the run's
  `README.md`, escalate to user. Mechanism: `reference/vault.md` (`error_signatures` + `circuit_breaker_threshold`).
- Each phase runs as a **fresh subagent context** that reads only its allowed vault files
  (role separation by read-scope) and returns a **compressed summary**, never its raw transcript
  (the converged 2026 orchestrator pattern — flowhunt.io; LangChain; Anthropic multi-agent system).
