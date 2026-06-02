# UI/UX overlay - design authority

Load only when the objective ships user-facing visual UI: landing page, portfolio, marketing site,
redesign, "make it look good/premium/on-brand", or frontend look-and-feel. Skip dashboards, data
tables, and internal tools unless visual polish is explicit.

When active, `reference/taste-skill-v2.md` governs UI decisions. It overlays the normal mode; phases,
gates, vault, and topology stay unchanged. UI scaffolding may fan out, but one page's look-and-feel is
deep-and-narrow: use one Designer driver per surface.

| Phase | Overlay |
|---|---|
| Plan | Add one-line **Design Read** and dials `DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY` to `plan.md`. Pick official design system vs aesthetic. For known brands, use existing brand color/type as accent source and record it. |
| Build | Dispatch **Designer** with `plan.md` + `reference/taste-skill-v2.md`. Enforce anti-default rules, real/generated images, reduced-motion fallback, hard visual bans, locked accent, no off-brand gradient/glow slop, and no self-approval. |
| QA | Run taste Pre-Flight beside normal QA. Required: a11y, reduced motion, Color Consistency Lock, LILA rule, dark/light or justified single-mode lock. Compute contrast from `<vault>/qa/contrast-pairs.json` via `node templates/contrast-gate.mjs <vault>/qa/contrast-pairs.json`; completeness critic audits the pair list. Any fail rewinds to Build and blocks Deliver. |

Progressive disclosure:

- Conductor does not load `taste-skill-v2.md` into its own context.
- Plan Architect loads only the sections needed for Design Read/dials/system choice.
- Build Designer loads the full file in its own context.
- Verify + committee still gate Deliver.

## Source note

`reference/taste-skill-v2.md` is a compressed derivative of the upstream taste-skill v2 source, with
source and commit preserved in its banner. Refresh by re-pulling upstream, then re-compress if context
cost still matters.
