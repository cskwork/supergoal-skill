# Functional UI baseline - design authority for dense/admin surfaces

Load when the deliverable is a dashboard, data table, admin panel, internal tool, settings, wizard, or
CRUD form. These need design discipline, not marketing aesthetic. For landing/portfolio/marketing
surfaces use `reference/taste-skill-v2.md` instead. Mixed product: apply each file to its own surface.

Lighter than taste-skill-v2: no hero, marquee, scroll-choreography, anti-slop landing rules. Phases,
gates, vault, topology unchanged. One Designer driver per surface.

## Non-negotiable baseline

- **Design system.** Pick exactly one and do not hand-roll or mix. Map the brief:
  enterprise SaaS -> Fluent; analytics/B2B -> Carbon; Material product -> Material 3;
  Shopify admin -> Polaris; Atlassian/Jira -> Atlaskit; accessible React base -> Radix Themes;
  owned modern SaaS -> shadcn/ui. (Same table as taste-skill-v2 section 2.)
- **Contrast computed, not eyeballed.** Body AAA (>=7:1), all other text AA (>=4.5 normal, >=3 large)
  on its actual background. Enumerate pairs to `<vault>/qa/contrast-pairs.json`; gate computes them.
- **One accent, one type scale, one spacing scale, one radius system.** Consistent across every view.
- **All UI states implemented.** loading (skeleton), empty, error, focus, hover, active, disabled.
  Tables also need: empty state, loading state, error state, pagination/sort affordance.
- **Density first.** `VISUAL_DENSITY` high (7-10): tight rows, mono/tabular numbers, lines over cards.
  Cards only when elevation conveys hierarchy.
- **Motion minimal.** `MOTION_INTENSITY` low (1-3): hover/active/feedback only. No choreography,
  parallax, or perpetual loops. Any motion above 3 honors `prefers-reduced-motion`.
- **Theme declared.** Set `color-scheme`; ship both light/dark tokens or a justified single-mode lock.
- **No empty decoration.** Every element carries data or a labeled control. No placeholder panels.

## Plan overlay

Add a one-line **Design Read** (surface kind + chosen design system) and the three dials
(`DESIGN_VARIANCE` low/symmetric, `MOTION_INTENSITY` 1-3, `VISUAL_DENSITY` 7-10) to `plan.md`.

## Build overlay

Dispatch **Designer** with `plan.md` + this file as the authority. Enforce the baseline above.
No self-approval.

## QA overlay

Run beside normal QA: a11y (keyboard focus, labels), reduced motion, all UI states present, density
matches dials, `color-scheme` declared. Record `UI-tier: Functional` in `verification.md` `## QA` and
enumerate every text/bg pair to `<vault>/qa/contrast-pairs.json`; `qa-gate.sh` runs
`node templates/contrast-gate.mjs` on it (completeness critic audits the pair list). Any fail rewinds
to Build, blocks Deliver.
