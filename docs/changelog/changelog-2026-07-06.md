# 2026-07-06 - run vault restructured to GOAL / PLAN / QA / R-LOOP / Z-<date>

## Decision

Replace the scattered run-vault artifacts (`delivery-proof.md`, `surfaced-requirements.md`,
`verification.md`, `plan.md`, vault `README.md`) with a fixed, goal-centric file set inside the unchanged
`docs/changelog/<YYYY-MM>/<DD-topic>/` vault:

- `GOAL.md` - written FIRST at Frame: the user's prompt verbatim, refined spec, falsifiable Success
  Criteria checkboxes (each naming its verification), browser QA Cases for web apps, and the Decision
  Gates table. Single source of "done"; only the verifier ticks boxes; surfaced requirements are
  appended as unchecked `(surfaced: ...)` criteria.
- `PLAN.md` - self-sufficient frozen plan (steps, tools & skills, verification strategy, grounding
  ledger, `## Intent` with the completion promise). A fresh-context implementer is briefed by this file
  alone. New `## Approval` section records the plan-approval gate.
- `QA.md` - all testing results as succinct plain-language checklist sentences, plus `## Before`,
  `## Commands`, `Backward-trace:`, `## Reproduction Fidelity`, `## Residual Risk`, and the literal
  `## QA` browser-evidence anchor (gate greps unchanged).
- `R-LOOP.md` - append-only verifier->implementer channel: one timestamped section per failed
  verification pass (missing criteria, regression note, smallest next fix); the relaunched implementer
  reads PLAN.md + the latest section only.
- `Z-<YYYY-MM-DD>.md` - mechanical completion marker (run branch + completion timestamp), created ONLY
  when every GOAL.md box is checked; the commit gate requires exactly one.
- `run-state.json` kept (+ `plan_approval: pending|user|auto`); `qa/` evidence dir kept.

New behavior: a **blocking plan-approval gate** at Frame exit - interactive sessions wait for the user's
explicit OK on PLAN.md; autonomous runs (harness-eval, background, pre-authorized) auto-approve and
record the reason. `commit-gate.sh` grew to 10 checks (adds approval status and Z-marker
presence/uniqueness/content; unchecked-criterion replaces the old requirement-trace and
surfaced-requirements checks).

## Why

- User request (2026-07-06): make the vault more structured around the goal - original prompt captured
  verbatim, spec + checklist with clear success criteria up front, implementation only after explicit OK,
  verifier ticking GOAL.md off the implementer's diff, R-LOOP file for the fix loop, Z file only at full
  completion. Mid-run amendment: drop the vault `README.md` entirely.
- The old set had grown by accretion (proof ledger vs trace vs surfaced trail vs verification) and the
  example/templates naming had drifted (`brief.md`/`claims.md`/`state.json` vs
  `delivery-proof.md`/`run-state.json`). One file per question - what is done (GOAL), how to build it
  (PLAN), what was proven (QA), what is still missing (R-LOOP), when it finished (Z) - is easier for
  fresh-context subagents to consume and for the gate to parse.

## Guardrails respected (baseline-first)

- No new agent phases and no always-on agent ceremony: the approval gate is a user-facing checkpoint at
  the existing Frame exit; the R-LOOP relaunch is the existing phase-3/4 loop-back carried through a
  file; the verifier is the existing Exact Verify/QA role. HARNESS-MAKE stays removed.
- Historical contract string `Build -> Improve full spec -> Improve edge cases -> Final Verify`
  preserved verbatim in SKILL.md and role-loop.md.
- Past vaults, `examples/`, and `docs/experiments/` keep their old file names (history, not rewritten).

## Relocations (vault README.md removed)

- run-to-prove slice lines (executor/designer) -> `QA.md` `## Commands` rows (`agent_detected` until the
  verifier promotes them).
- Debugger hypothesis ledger, Domain Brief, Priority Rules, interview record, skip logs -> `PLAN.md`.
- Explore's codebase map -> `PLAN.md` grounding notes (the implementer's single brief now carries it).
- Eval intent + completion promise (old delivery-proof) -> `PLAN.md` `## Intent`; requirement trace ->
  `GOAL.md` Success Criteria; before/after evidence, command manifest, fidelity, residual risk ->
  `QA.md`; decision gates -> `GOAL.md`.

## Rejected alternatives

- Keeping old files alongside the new ones - more files per vault, directly against the "more structured"
  goal.
- Moving the vault path (e.g. docs/runs/) - 10+ reference points, examples, and gate usage strings for no
  behavioral gain.
- Always-blocking approval gate - would break harness-eval and background runs; autonomous auto-approve
  with a recorded reason keeps the audit trail instead.
- Failing-word scan on QA.md Results rows (old After-Evidence check) - free-text sentences make word
  scans false-positive-prone ("no errors observed"); the checkbox is the status signal, and the
  Verdict scan + qa-gate delegation still catch failures.

## Verification

- `bash tests/run-all.sh`: 654 checks passed, 0 failed (contract suites + gate scenarios + node --check).
- Gate-scenario 13 rebuilt on GOAL/PLAN/QA/Z fixtures: 22 block/pass cases incl. new 13.13 pending
  approval, 13.18-13.21 Z-marker matrix.
- Stale-name grep over SKILL.md/reference/agents/templates/READMEs: empty.
- Live proof on the dogfood vault `docs/changelog/2026-07/06-vault-restructure/`: commit gate PASS on the
  green vault; unchecked criterion, missing Z, and pending approval each block with the expected message.
