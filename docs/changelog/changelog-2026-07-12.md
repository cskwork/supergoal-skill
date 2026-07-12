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

## Offer public Vercel hosting for finished prototypes

- Decision: after a browser-viewable prototype is finished, ask whether to publish it to a public, shareable
  Vercel URL. Deploy only after explicit approval.
- Why: a hosted prototype lets other people view, share, and review the actual interaction instead of relying on
  local screenshots or setup instructions.
- Route: approved publishing follows `reference/vercel-host.md` for CLI availability, user-owned authentication,
  isolated project linking, dry-run inspection, production deployment, and signed-out access verification.
- Safety boundary: remove secrets and private or write-capable integrations before publishing; a hosted prototype
  remains quarantined prototype evidence and cannot satisfy delivery `Done`.
- Rejected: deploying automatically at completion. Public visibility is an external side effect and requires a
  clear user decision.
- Rejected: using Vercel CLI's `--public` flag to make the site viewable. That flag exposes source at `/_src` and
  does not configure visitor access.
- Sources: https://vercel.com/docs/cli, https://vercel.com/docs/cli/deploy,
  https://vercel.com/docs/deployment-protection
