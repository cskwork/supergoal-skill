# Archify - architecture/flow diagrams as self-contained HTML

Vendored diagram toolchain at `templates/archify/` (upstream tt-a1i/archify v2.10, MIT; zero runtime
deps, Node >= 18). Typed JSON IR -> validated render -> one standalone HTML diagram: inline SVG,
dark/light theme toggle, PNG/JPEG/WebP/SVG export. Offline by construction, so it satisfies the
no-CDN/no-network rule for run-vault and knowledge-pack artifacts.

## When

- ARCHITECTURE Report: the survey-level current-state system diagram (plus a target-state twin for the
  Top recommendation when it clarifies) next to `report.html` (`reference/arch.md`).
- LEARN-DOMAIN Onboard: the architecture overview and top key-flow diagrams next to `onboarding.html`
  (`reference/learn-domain.md`).
- Direct "draw / diagram / 그려" ask (ARCHITECTURE draw-only branch): pick a type, render, deliver the `.html` (+ JSON IR) as the artifact; no survey.
- TEACH lesson: the default visual for system structure, workflow, call sequence, data movement, or
  lifecycle teaching; keep its JSON + HTML under `teach/<topic>/diagrams/` and embed/link it from the
  lesson (`reference/teach.md`).
- Any phase that must show structure or flow to a human: pick a type below instead of hand-writing SVG.

| Type | Use for |
|---|---|
| `architecture` | components, services, boundaries (<=12 nodes) |
| `workflow` | process/approval/CI-CD/runbook flows, swimlanes, exception paths |
| `sequence` | call chains, request lifecycles, auth/cache fallback |
| `dataflow` | pipelines, ETL, lineage, PII boundaries |
| `lifecycle` | state machines, retries, terminal states |

## Loop (all types)

`<archify>` = this skill's `templates/archify`; input/output paths may live anywhere (run vault,
knowledge path).

1. Read `<archify>/SKILL.md` for the chosen type, `<archify>/schemas/<type>.schema.json`, and the worked
   `<archify>/examples/*.<type>.json` - copy field shapes, don't guess.
2. Write `<name>.<type>.json`. Plan one main path first (left->right or lane->column); label only
   cross-boundary/non-obvious edges; side branches connect up/down from the main path; detail goes in
   summary cards, not extra arrows. Labeled horizontal edges need room: allow >=110px gap between the
   nodes they join, or expect a `labelDy`/`labelAt` fix after the first render.
3. `node <archify>/bin/archify.mjs render <type> <name>.<type>.json <name>.html` - render also
   layout-validates (node/label overlap, label AND sublabel width vs node, legend clearance) and on
   failure prints concrete numeric fixes (`Suggested fix: labelAt [...] or labelDy ...`); apply them to
   the JSON as-is. Tags are not width-checked - keep them ~2 words.
4. `node <archify>/bin/archify.mjs check <name>.html`. For schema-shape errors only, use
   `validate <type> <input> --json`. Either way: fix the JSON, never the renderer.
5. Keep the `.json` IR beside the HTML so later edits re-render instead of redrawing.

`node <archify>/bin/archify.mjs doctor` verifies the toolchain; `examples` lists worked inputs.

## Embedding

- Diagram HTML files are self-contained: put them in a `diagrams/` dir beside the host document and link
  them from `report.html`, `onboarding.html`, or a TEACH lesson.
- When the host document must stay single-file (LEARN-DOMAIN handbook), extract the `<svg>...</svg>`
  element from the rendered HTML and inline it (static snapshot); the sibling HTML stays the interactive
  copy.

## Fallback

Node unavailable, or render+check still failing after two JSON fixes: hand-placed inline SVG / CSS boxes
(the pre-archify default) and note the fallback in the run note. Diagrams never block the phase.
