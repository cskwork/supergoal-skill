# Changelog - 2026-07-15

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

