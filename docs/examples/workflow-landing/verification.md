# Adversarial Verification — supergoal-v2/index.html

Role: fresh-context QA. Goal: refute "production-ready." Evidence computed by
`_verify_contrast.js` (WCAG 2.x relative-luminance formula, alpha-composited
over opaque backgrounds), not eyeballed.

Authority: taste-skill-v2.md §4.1, §4.2, §4.11, §6.C, §8, §14.

---

## 1. WCAG Contrast (every text/bg pair actually used)

| Element | FG | BG | Ratio | Need | Result |
|---|---|---|---|---|---|
| body text (--text) | #f4efe7 | #16140f | 16.08 | 4.5 | PASS (AAA) |
| lead / --text-muted on --base | #b3aa9b | #16140f | 8.01 | 4.5 | PASS (AAA) |
| --text-muted on --elevated | #b3aa9b | #1d1a14 | 7.55 | 4.5 | PASS (AAA) |
| eyebrow --accent on --base | #d97757 | #16140f | 5.90 | 4.5 | PASS |
| eyebrow --accent on --elevated | #d97757 | #1d1a14 | 5.56 | 4.5 | PASS |
| nav links --text-muted | #b3aa9b | #16140f | 8.01 | 4.5 | PASS (AAA) |
| btn-primary text --accent-ink on --accent | #1a1206 | #d97757 | 5.94 | 4.5 | PASS |
| btn-primary text on hover | #1a1206 | #e08a6c | 7.08 | 4.5 | PASS (AAA) |
| btn-ghost text --text | #f4efe7 | #16140f | 16.08 | 4.5 | PASS (AAA) |
| card p --text-muted on --surface | #b3aa9b | #221e17 | 7.22 | 4.5 | PASS (AAA) |
| card .num --accent on --surface | #d97757 | #221e17 | 5.31 | 4.5 | PASS |
| cell h3 --text on --surface | #f4efe7 | #221e17 | 14.49 | 3 (large) | PASS |
| case .tag --accent on --surface | #d97757 | #221e17 | 5.31 | 4.5 | PASS |
| step .idx --accent on --elevated | #d97757 | #1d1a14 | 5.56 | 3 (large) | PASS |
| step p --text-muted on --elevated | #b3aa9b | #1d1a14 | 7.55 | 4.5 | PASS (AAA) |
| **term-title --text-dim on --surface** | **#8a8275** | **#221e17** | **4.37** | **4.5** | **FAIL** |
| term pre --text-muted on #100e0a | #b3aa9b | #100e0a | 8.39 | 4.5 | PASS (AAA) |
| term .c-dim --text-dim on #100e0a | #8a8275 | #100e0a | 5.08 | 4.5 | PASS |
| term .c-text --text on #100e0a | #f4efe7 | #100e0a | 16.84 | 4.5 | PASS (AAA) |
| term .c-accent --accent on #100e0a | #d97757 | #100e0a | 6.18 | 4.5 | PASS |
| brand "Workflow" --text-dim on --base | #8a8275 | #16140f | 4.85 | 4.5 | PASS |
| footer p --text-dim on --elevated | #8a8275 | #1d1a14 | 4.57 | 4.5 | PASS |
| foot-col h4 --text-dim on --elevated | #8a8275 | #1d1a14 | 4.57 | 4.5 | PASS |
| foot-col a --text-muted on --elevated | #b3aa9b | #1d1a14 | 7.55 | 4.5 | PASS (AAA) |
| foot-base --text-dim on --elevated | #8a8275 | #1d1a14 | 4.57 | 4.5 | PASS |
| term dot (decor) on term-bar surface | #3f3b35 | #221e17 | 1.49 | 3 (non-text) | n/a (decorative) |

### Contrast findings
- **One genuine text FAIL:** `.term-title` ("workflow: security-review.ts" label)
  uses `--text-dim #8a8275` on `--term-bar` background `--surface #221e17` =
  **4.37:1**, below the 4.5:1 AA floor for 13px normal text. Marginal but real.
- **Fragile pass band:** every other `--text-dim` use lands 4.57–4.85:1 — barely
  over AA, well under the AAA 7:1 the spec wants for body-grade copy. The footer
  paragraph, footer column headings, and footer base line all sit at 4.57:1. Any
  future darkening of the token or lightening of opacity tips them to fail.
- Decorative terminal dots are 1.49:1 — not a WCAG text violation (non-text
  decorative element), noted for completeness only.
- Accent `#d97757` on every surface clears AA but never AAA; acceptable for an
  accent, not for body.

---

## 2. Dark / Light Mode (§6.C mandatory, §8 Protocol, §4.11)

- `color-scheme` declaration: **absent** (0 occurrences). The browser is never
  told the page is dark, so form controls, scrollbars, and `<input>` UA styling
  render light-on-dark mismatched.
- `@media (prefers-color-scheme: light)`: **absent** (0). No light token set.
- `@media (prefers-color-scheme: dark)`: **absent** (0). The dark palette is
  hard-coded into `:root`, not gated on system preference.
- Result: the page is **dark-only, hard-locked, with no system-preference
  respect and no light token set.**

**Verdict against authority:** VIOLATION.
- §6.C: "Design for both modes from the start. Never ship light-only or dark-only
  without explicit user instruction... Respect `prefers-color-scheme`."
- §8 / §8.C / §8.D: dual-mode by default; respect `prefers-color-scheme`; test in
  both modes before finishing.
- §4.11 allows a single-mode lock, but as a **deliberate, declared** choice. The
  page neither declares `color-scheme: dark` nor provides any justification
  comment for single-mode. It is an undeclared lock, not an intentional one.

**Required:** either (a) add a tested `prefers-color-scheme: light` token block
plus `color-scheme: light dark`, OR (b) explicitly justify and declare the
single-mode lock with `color-scheme: dark` on `:root`/`html`. Doing neither is
the failure.

---

## 3. Font / Readability (§4.1)

- Font stack (body): `ui-sans-serif, system-ui, -apple-system, "Segoe UI",
  Roboto, Helvetica, Arial, sans-serif` — system sans, not Inter. Compliant with
  §4.1 (Inter discouraged; system stack acceptable for Linear-clean read).
- Body: **17px / line-height 1.6** — above the 16px floor, healthy leading. Good.
- Line length: longest constrained block is **64ch** (`.step p`, `.section-head`);
  `.lead` 60ch, footer 44ch. All **under the 75ch limit**. Good.
- Smallest text on page: **12px** (`.eyebrow`, `.foot-col h4`) — both uppercase
  tracked labels, not body copy. 12.5–13px on `.case .tag`, `.cell .num`, term
  labels. Nothing below 12px; no body copy under 14px. Acceptable.
- Mono usage: confined to terminal transcripts, code showcase, and small numeric
  labels (`.num`, `.idx`, `.tag`, `.term-title`). **Not used for long body copy.**
  Compliant.

### Readability findings
- No readability failures on size, leading, or measure.
- Only readability-adjacent issue is the contrast of the 13px `.term-title` mono
  label (see §1) — small text at sub-AA contrast is the worst-case readability
  combination.

---

## 4. §14 Spot-Check

- **Em-dashes (`—`/`–`):** 0 occurrences. PASS (§9.G non-negotiable ban met).
- **Accent lock (§4.2):** single accent `#d97757` (clay coral) used on eyebrows,
  nums, tags, idx, buttons, fan tiles, selection, focus ring. No second accent
  anywhere. PASS.
- **Glow / colored gradient (§9.A):** shadows are neutral black-alpha only
  (`rgba(0,0,0,...)`); `--accent-soft` is a flat tint, no neon glow, no AI-purple
  gradient. PASS.
- **Shape lock (§4.4):** one radius scale (14px cards, 999px pills). PASS.

---

## VERDICT: RED

The page is strong on typography, accent discipline, em-dash hygiene, and most
contrast, but it ships **one sub-AA text pair** and **violates the mandatory
dark-mode protocol** (no `color-scheme`, no `prefers-color-scheme` handling, no
declared/justified single-mode lock). Both are mandatory-rule failures, so the
page is not production-ready.

### Required fixes
1. **Raise `--text-dim` to clear AA 4.5:1 on its darkest text background.** It
   currently fails on `--surface` (4.37:1) and only scrapes by elsewhere. Set
   `--text-dim` to **at least `#8d8577`** (4.5:1 on `--surface #221e17`; also
   clears `--base`, `--elevated`, and term `#100e0a`). For comfortable AAA-leaning
   margin on these label uses, prefer `#9a9081`+. This single token change fixes
   `.term-title` and hardens the four 4.57:1 footer pairs.
2. **Resolve the dark-mode protocol violation** — do ONE of:
   a. Add `color-scheme: light dark;` to `:root`/`html` AND a tested
      `@media (prefers-color-scheme: light) { :root { ... } }` block that re-maps
      `--base/--elevated/--surface` to light values and `--text/--text-muted/
      --text-dim` to dark values, preserving the `#d97757` accent and AA/AAA
      contrast in light mode; OR
   b. If single-mode is intended, add `color-scheme: dark;` to `:root` AND a code
      comment justifying the dark-only lock per §4.11 (e.g. "dark-tech brief,
      single-mode by design").
   Shipping neither (current state) is the failure.
3. (Recommended, not blocking) Body copy already hits AAA, but `--text-dim` label
   text never will at these sizes; keep `--text-dim` for decorative/label use only
   and never apply it to paragraph-length copy.

---

## RE-VERIFICATION (Designer fix pass, recomputed by `_verify_contrast.js`)

### Fixes applied
1. `--text-dim` raised `#8a8275` -> `#9a9081` (dark). Fixes `.term-title`
   (4.37 -> 5.28) and hardens all footer/brand dim pairs (4.57 -> 5.52).
2. Added `color-scheme: light dark;` to `:root` + a full
   `@media (prefers-color-scheme: light)` block (warm paper palette, same clay
   coral accent identity).
3. Added `--accent-text` token: light coral `#d97757` in dark mode, darker coral
   `#a8472a` in light mode. Applied to all accent-as-TEXT uses (`.eyebrow`,
   `.cell .num`, `.case .tag`, `.step .idx`, `.btn-ghost:hover`,
   `.foot-col a:hover`). `--accent` retained for fills/borders/focus rings.
   `--accent-ink` keeps button-fill text readable in both modes (5.94:1).
4. Terminal pinned dark in both modes via `--term-bg`; its inner tokens
   (`--term-*`) are mode-independent so code keeps high contrast on light pages.
   Nav background tokenised (`--nav-bg`) so the sticky bar matches each mode.
5. Light `--text-muted` set to `#4d4438` so body copy clears AAA (>=7:1) on the
   lightest `--elevated` band.

### Previously-failing / fragile pairs, now
| Pair | Dark | Light | AA | 
|---|---|---|---|
| term-title (was 4.37 FAIL) | 5.28 | 5.28 | PASS |
| footer p / h4 / base --text-dim | 5.52 | 4.68 | PASS |
| brand "Workflow" --text-dim | 5.85 | 5.15 | PASS |
| eyebrow / num / tag / idx accent-text | 5.31-5.90 | 4.75-5.46 | PASS |
| body --text on --base | 16.08 (AAA) | 15.28 (AAA) | PASS |

Full computed table: run `node _verify_contrast.js`. Result both modes:
**0 AA failures, 0 body-AAA misses.** Spot-check: 0 em-dashes, 0 external/CDN
URLs, `color-scheme` present (2), light media block present (1), all sections +
responsive breakpoints + reduced-motion retained.

## RE-VERIFICATION VERDICT: GREEN
Both mandatory failures resolved. Every text/background pair passes WCAG AA in
both dark and light modes; all body copy passes AAA. Production-ready.
