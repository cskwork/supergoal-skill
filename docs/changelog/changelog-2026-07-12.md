# Changelog - 2026-07-12

## Route UI prototypes through SuperDesign

- Decision: make the installed `superdesign` skill mandatory for PROTOTYPE UI/interaction surfaces.
- Why: visual direction is part of the prototype's decision signal, so an unverified rough UI can produce the
  wrong product decision.
- Boundary: SuperGoal retains question framing, isolation, evidence capture, and the delete/quarantine/delivery
  exit. SuperDesign owns the visual brief, direction, UI build, independent critique, and render gates.
- Mode mapping: runnable surfaces and variants use SuperDesign CREATE/REDESIGN; EXPLORE remains no-build.
- Availability: a missing SuperDesign installation blocks the UI prototype instead of enabling a silent fallback.
- Rejected: applying SuperDesign to every prototype. Logic/state and data/API spikes do not benefit from a
  web/mobile design workflow and should remain small.
- Source: https://github.com/cskwork/superdesign-skill
