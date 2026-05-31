# Example: a UI/UX landing page built by `/supergoal`

A self-contained, single-file landing page promoting Claude Code's Workflow feature, built end-to-end
through `/supergoal`'s **UI/UX overlay** (`reference/ui-ux.md` -> `agents/designer.md` ->
`reference/taste-skill-v2.md`) and gated by the adversarial Verify / QA stage.

- **Live page:** https://cskwork.github.io/supergoal-skill/examples/workflow-landing/
- **Verification report:** [`verification.md`](./verification.md)

## What this demonstrates

The value is not just the page — it is what the gate caught before delivery. On this objective the
independent adversarial QA (builder != verifier) **computed WCAG contrast ratios instead of eyeballing
them** and returned RED with numbers:

- a dim text token at **4.37:1** (below the 4.5:1 AA floor), plus several AA-marginal footer pairs;
- **no `color-scheme` declaration and no light-mode tokens** — a dark-only page shipped as if "dark
  theme acceptable" meant "skip light mode" (violates taste §6.C / §8 / §4.11).

Both were rewound to Build and fixed to GREEN: `--text-dim` raised, a `prefers-color-scheme: light`
warm-paper palette added with a per-mode `--accent-text` (clay coral darkens to clear AA on light), and
every text/background pair re-verified to pass AA with body copy at AAA in both modes.

## Design constraints honored

Single locked accent (Claude clay coral `#d97757`), no gradients, no colored glow shadows, zero
em-dashes, semantic HTML with focus states and `prefers-reduced-motion`, responsive, no CDN / no build.
