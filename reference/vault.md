# Vault — the only cross-phase state

Every run creates a folder under the target repo's changelog: **`docs/changelog/<date>-<slug>/`**
(e.g. `docs/changelog/2026-05-30-add-sso/`). Because each phase runs as a fresh subagent context, this
folder is the **single blackboard** they communicate through (oh-my-symphony `vault.md`; shared-
blackboard finding arxiv 2510.01285 — 13-57% gains, stops discoveries being lost at task boundaries).

Unlike a hidden scratch dir, the vault **is the run's permanent, browsable changelog** — it is
committed with the code, so every project the harness touches gets a tracked decision record (matches
the "write reasoning to a dated changelog" house rule). `<slug>` = kebab-case of the objective;
`<date>` = ISO date. If the target has no `docs/`, create it.

## Files (6 — kept deliberately small)

Files are merged wherever it does not break **read-scope** (a subagent reads only its slice). The
three that stay separate are load-bearing for builder ≠ verifier; the rest are consolidated.

| File | Written by | Mutability | Holds |
|---|---|---|---|
| `README.md` | any (orchestrator owns) | append-only | the run narrative + decisions, hypotheses, skips, escalations — the **audit log** and the folder's rendered index |
| `brief.md` | Analyst | frozen per section | goal, audience, acceptance criteria, non-goals + a **`## Validation`** section (demand evidence ending in one `Decision: GO`/`Decision: NO-GO` line — greenfield) |
| `plan.md` | Architect (DEBUG: from Diagnose) | **frozen once written** | the slice plan with per-slice acceptance checks, plus **Architecture** and **Contracts** sections (stack, codebase map, interfaces). DEBUG: the approved root-cause + fix plan. **Required by the gate in every mode.** |
| `claims.md` | Builder | **append-only, UNTRUSTED** | one entry per slice: what was done + a `run-to-prove` command |
| `verification.md` | Verifier (+ QA) | append-only | per-claim lines `claim <id>: GREEN\|RED` + evidence, then ONE aggregate `verdict: GREEN` (or `verdict: RED`); plus a **`## QA`** section with black-box results. The gate reads the aggregate; on re-verify, rewrite so no line-start `verdict: RED` lingers |
| `state.json` | orchestrator | live (machine) | mode, current phase, per-phase cycle counters (keys vary by mode), error signatures, `go_decision`, `approval` (set when a human approves the fix/build plan — required before the first write in DEBUG/LEGACY). See `templates/state.json` |

Merged in (no information lost): `validation.md` → brief's `## Validation`; `architecture.md` +
`contracts.md` → plan sections; `qa-report.md` → verification's `## QA`; `decisions.log` → `README.md`.

## Two rules that make the vault trustworthy

1. **`claims.md` is untrusted.** The Builder asserts; it does not prove. Only the Verifier — a fresh
   adversarial context that reads **only `claims.md` + the code** and re-runs each `run-to-prove` from
   a clean state — writes a verdict. A self-reported "done" is never sufficient. (This is why
   `claims.md` and `verification.md` stay separate from `plan.md`/`brief.md`: the Verifier must not
   see the plan's rationale.)
2. **Frozen files are frozen.** `plan.md` is written once; Build implements it, does not redesign it.
   Scope creep mid-build is the most common drift; freezing kills it.

## `claims.md` entry format

```
## CLAIM <slice-id>
what: <one line — what this slice implements>
files: <paths touched>
run-to-prove: <exact shell command that exits 0 iff the claim holds, e.g. `npm test -- auth.spec`>
expected: <what a passing run prints>
```

## Resumption

On re-invocation with the same objective, read `state.json` → resume at `current_phase` (don't redo
completed phases). The vault folder + git history reconstruct everything; no in-memory state needed.
