# UI/UX overlay - design authority

Load whenever the objective ships user-facing UI. Classify the surface into one tier, then load that
tier's authority. Pure non-visual work (lib, API, CLI without TUI) loads neither.

| Surface | Tier | Authority |
|---|---|---|
| landing, portfolio, marketing site, redesign, "make it look good/premium/on-brand", frontend look-and-feel | **Expressive** | `reference/taste-skill-v2.md` |
| dashboard, data table, admin panel, internal tool, settings, wizard, CRUD form | **Functional** | `reference/functional-ui.md` |

Functional is the default for dense/admin UI: it still needs design system, contrast, consistent
type/spacing/density, and complete UI states - just not marketing aesthetic. A mixed product applies
each tier to its own surface. The rest of this file describes the Expressive tier; Functional defines
its own (lighter) Plan/Build/QA overlay in its file.

The chosen authority overlays the normal mode; phases, gates, vault, and topology stay unchanged. UI
scaffolding may fan out, but one surface's look-and-feel is deep-and-narrow: use one Designer driver
per surface.

| Phase | Overlay |
|---|---|
| Plan | Add one-line **Design Read** and dials `DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY` to `plan.md`. Pick official design system vs aesthetic. If the Design Read vibe names a specialized aesthetic, also pick at most ONE **aesthetic family** from `reference/taste-aesthetics.md` (selection map there) and record it on the Design Read line; no family signal means base taste-skill-v2 alone. For known brands, use existing brand color/type as accent source and record it. |
| Build | Dispatch **Designer** with `plan.md` + `reference/taste-skill-v2.md` + (if a family was chosen) its profile from `reference/taste-aesthetics.md`. Enforce anti-default rules, real/generated images, reduced-motion fallback, hard visual bans, locked accent, no off-brand gradient/glow slop, and no self-approval. With a family: commit to that one, apply its bans; the family overrides base aesthetic defaults where they conflict, base universal rules still hold. |
| QA | Run taste Pre-Flight beside normal QA, plus the chosen family's Pre-Flight delta. Required: a11y, reduced motion, Color Consistency Lock, LILA rule, dark/light or justified single-mode lock. Record `UI-tier: Expressive` (and the family, if any) in `verification.md` `## QA` and enumerate every text/bg pair to `<vault>/qa/contrast-pairs.json`; `qa-gate.sh` runs `node templates/contrast-gate.mjs` on it (completeness critic audits the pair list). Any fail rewinds to Build and blocks Deliver. |

Progressive disclosure:

- Conductor does not load `taste-skill-v2.md` into its own context.
- Plan Architect loads only the sections needed for Design Read/dials/system choice.
- Build Designer loads the full file in its own context, plus the one selected family profile from `taste-aesthetics.md` if the Plan chose one.
- Verify + committee still gate Deliver.

## Source note

`reference/taste-skill-v2.md` is a compressed derivative of the upstream taste-skill v2 source, with
source and commit preserved in its banner. Refresh by re-pulling upstream, then re-compress if context
cost still matters.

`reference/taste-aesthetics.md` holds the optional Expressive aesthetic families (minimalist-ui,
high-end-visual-design, industrial-brutalist-ui), compressed from upstream's specialized sub-skills with
their own source/commit banner. Loaded only when the Plan selects a family.
