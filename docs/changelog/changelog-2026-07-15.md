# Changelog - 2026-07-15

## README default loop rendered as an ordered list

**Change**: reformatted the English README's five-gate default loop from one continuous paragraph into
a Markdown ordered list. The workflow wording and behavior are unchanged.

- Decision: mirror the already-correct Korean README structure so each gate is independently scannable
  and the five-step sequence is exposed to Markdown renderers and assistive technology.
- Rejected: manual line breaks or `<br>` tags. They change appearance without restoring list semantics.
- Touch: `README.md` only; `README.ko.md` already used the intended 1-5 list format.

## "draw / diagram / 그려" routes to archify, folded into ARCHITECTURE (no new router row)

**Change**: a bare draw/diagram/그려 request (arch, flow, sequence, state) now renders a
self-contained HTML diagram via archify (`reference/archify.md`) and stops. The trigger is attached to
the existing ARCHITECTURE mode row with a draw-only branch: draw-only ask -> render + deliver `.html`;
otherwise the normal friction survey runs.

- Decision: fold into ARCHITECTURE rather than add a `DIAGRAM` mode row. archify is already the shared
  renderer for ARCHITECTURE and LEARN-DOMAIN, and "draw arch" overlaps the ARCHITECTURE keyword — a new
  row would add router ceremony for a tool that already exists (baseline-first: no ceremony without lift).
- Rejected: new `DIAGRAM` mode + entry in the no-code modes list. More surface, same behavior.
- Touch: `SKILL.md` ARCHITECTURE row (+draw keywords, draw-only branch); `reference/archify.md` When list
  (+direct-draw bullet); `README.md` ARCHITECTURE row (mirror). No renderer/template change.

## Landing page synced to the lean five-gate loop (v0.6.3 prep)

**Change**: `docs/index.html` still advertised the removed loop (Critic/Fixer + Improve spec/Improve
edges passes, "4 core roles", a 7-step route-map). Synced every surface to the current core
`Frame -> Plan approval -> Build -> Verify -> Finalize` with one builder + one verifier per iteration.

- Touch: route-map (7 steps -> 5 gates), principle #3, hero copy, meta description, run-telemetry mock
  (`improve_spec` -> `plan` gap discovery), roles metric (4 -> 2), DEBUG/LEGACY mode-pipes, `role-loop.md`
  file-chip, proof-map canvas node labels (Escalate/Done -> Verify/Finalize).
- Scope: landing carried the removed loop because it was last updated 2026-07-12, before the 07-14 lean
  five-gate change. Vercel hosting and draw/diagram deliberately left off the landing (per request);
  draw/diagram documented in README only.

## Compact resumable run state

**Change**: `templates/run-state.json` schema v2 now stores the compact conductor checkpoint. Static
mode routing remains in the router; `PLAN.md` owns the approved completion promise and loop cap, while
the checkpoint mirrors that cap for resume and tracks mutable fulfillment state.

- Decision: preserve branch/ref safety, approval, loop cap, gate/blocker separation, regression state,
  proof checkpoint, next action, forced reflection, and timestamp while removing duplicated context.
- Rejected: minifying JSON only; it saves whitespace but not duplicated state. Also rejected merging
  branch, gate, or blocker safety state; those fields answer distinct resume and safety questions.
- Touch: `templates/run-state.json`, `reference/role-loop.md`, `reference/delivery-gate.md`, and
  `tests/delivery-gate-contract.test.sh`.

## v0.6.4 gate and skill simplification

**Change**: tightened final proof while removing duplicated agent-facing and test-facing text.

- `QA.md` is now the only commit-verdict source and must contain exactly one literal
  `- Verdict: PASS`. Missing, duplicate, placeholder, unknown, FAIL, and PARTIAL values block commit.
- `run-state.json` schema v3 keeps only mutable resume/safety state. Approval remains in `PLAN.md`,
  proof commands remain in `QA.md`, and final completion is enforced by `run-state-gate.mjs`.
- `Z-DONE.md` remains the completion receipt but no longer claims a future commit-gate result.
- `SKILL.md` is the thin router/invariant spine; `reference/role-loop.md` is the sole detailed default-loop
  authority. This removes 52 lines and preserves the direct-collaboration negative route.
- Repeated shell assertions now use `tests/support/contract.sh`. HARNESS tests clone the shipped valid
  result fixture and apply narrow deltas, and the validator is reusable without spawning its CLI.
- `tests/run-all.sh` reports independent failures and recursively syntax-checks all template JavaScript.
- Mode IDs are checked across `SKILL.md`, both READMEs, and the landing page. The already-documented
  draw/diagram landing omission remains the only content-level exception.

**Why**: canonical ownership makes failures unambiguous and reduces drift. The state file should answer
only "where can this run safely resume?"; stable intent and evidence belong in their existing documents.

**Rejected alternatives**:

- Merge verifier and code reviewer in this release. Their current proof responsibilities differ, and the
  browser path needs a separate role-boundary decision before changing behavior.
- Merge `GOAL.md` and `PLAN.md`. One records the falsifiable contract; the other is the approved build brief.
- Introduce a generated central mode registry. Twelve stable rows do not justify another source format;
  a parity test catches drift with less machinery.
- Parallelize the full suite. Several shell contracts use process-global temporary state, so aggregation is
  safe now while parallel execution needs explicit isolation first.

**Verification note**: canonical fixture reuse reduced HARNESS contract duplication, but the focused suite
did not get faster (17.95s baseline, 19.12s final). The value is maintainability, not a speed claim; repeated
CLI startups and the U3 validation remain the measured runtime cost.
