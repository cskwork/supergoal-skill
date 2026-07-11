# 2026-07-11

## Archify diagram toolchain for ARCHITECTURE and LEARN-DOMAIN

**Change**: Vendored tt-a1i/archify v2.10 (MIT) into `templates/archify/` and added the thin router
`reference/archify.md`. ARCHITECTURE reports now render the survey-level current-state system diagram
(plus an optional target-state twin for the Top recommendation) into `diagrams/` beside `report.html`;
LEARN-DOMAIN Onboard renders the architecture overview and top key-flow diagrams into
`<knowledgePath>/diagrams/` and inlines the extracted overview `<svg>` in `onboarding.html`.

- Decision: vendor the full toolchain (bin, renderers, schemas, assets, examples, SKILL.md, LICENSE)
  rather than instruct agents to install it from GitHub.
  Why: supergoal artifacts are offline-by-rule (no CDN/network); a vendored zero-dependency Node
  toolchain keeps runs reproducible and permission-free. `test/` and `package-lock.json` were dropped -
  the skill runs without them and reference material stays lean.
- Decision: put the executable under `templates/` and only a terse wrapper under `reference/`.
  Why: repo convention - executables live in `templates/` (`commit-gate.sh`, `harness-eval-runner.mjs`),
  `reference/` files are agent-read procedure and must stay succinct. The JSON IR spec is NOT duplicated
  into the wrapper; agents read `templates/archify/SKILL.md` + schema + worked example per type.
- Decision: archify replaces hand-placed SVG only at the survey/overview level; per-candidate
  before/after visuals in ARCHITECTURE reports stay inline SVG/CSS boxes.
  Why: shallow->deep glyphs are tiny; a full typed-IR render per candidate is ceremony without lift.
- Decision: LEARN-DOMAIN handbook stays single-file - interactive archify HTML lives as sibling
  self-contained files under `<knowledgePath>/diagrams/`, the handbook inlines an extracted static
  `<svg>` snapshot.
  Why: preserves the existing "no external scripts, single file" constraint while still shipping the
  theme-toggle/export interactive copies.
- Rejected: wiring archify into TEACH.
  Why: user scoped the integration to the improve-architecture and learn phases; TEACH lessons already
  have their own gate and format.
- Fallback contract: Node unavailable or render+check still failing after two JSON fixes -> hand-placed
  inline SVG (pre-archify default), noted in the run note. Diagrams never block a phase.
- Verified: `node templates/archify/bin/archify.mjs doctor` passes from the vendored path;
  `render workflow examples/agent-tool-call.workflow.json` + `check` produce a clean 56K self-contained
  HTML on Node v22.

## Subagent test run of the archify integration (same day, follow-up)

A fresh subagent ran the new-version skill end-to-end: ARCHITECTURE mode on a synthetic inventory
service. It loaded `reference/archify.md` -> `templates/archify/SKILL.md` + schema + example, rendered
current-state and target-state `architecture` diagrams into the run vault's `diagrams/`, hit one layout
validation failure (label overlap), applied the renderer's printed `labelDy` suggestion verbatim, and
both diagrams passed `check`. Loop confirmed followable without guesswork.

Fixes applied from its feedback:

- `reference/archify.md`: documented that `render` itself layout-validates and prints numeric fixes
  (`validate` is schema-shape only); added the >=110px gap hint for labeled horizontal edges - the one
  render failure was predictable from missing that budget.
- `reference/arch.md`: split the ambiguous "no Node -> archify fallback" clause into two sentences
  (per-candidate visuals never escalate to archify; Node-missing fallback lives in archify.md).
- `templates/arch-report.html`: added a "System diagrams" slot (arch.md required linking diagrams but
  the template had no slot, so runs invented their own markup); removed the duplicated
  "Top recommendation" heading (`.top-anchor` outer h2 had no CSS and rendered the title twice).

Reported, not fixed (pre-existing, out of this change's scope): arch.md's read-only rule vs
runtime-verifying Strong candidates (test run used a disposable repo copy - worth codifying); no
autonomous-run branch at the Report step's "open and ask" closing move.
