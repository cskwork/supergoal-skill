# 2026-05-30 — research → build → validate → publish → self-review

Context-sharing log for how `/just-do-it` was created. Reasoning lives here; the *what* lives in the
code and [`../../../DESIGN.md`](../../../DESIGN.md). New decision/context docs go under
`docs/changelog/<date>-<title>/`.

## Phases

1. **Research** — a deep-research workflow (18 fact-checked agents) surveyed multi-agent dev
   orchestration, autonomous-coding harnesses, demand validation, code-quality gates, and debugging
   method. Output: [`../../research-brief.md`](../../research-brief.md). One claim was refuted in
   verification and excluded (the "4-6x token overhead / 40-50 lines per child" figures).

2. **Borrow + strip** — adapted [oh-my-symphony](https://github.com/cskwork/oh-my-symphony)'s
   workflow (gated lanes, shared vault, untrusted `claims.md` re-verified by an adversary, literal
   delivery gate) but dropped the Symphony CLI/TUI/worktree infra. Runs self-contained with
   in-session subagents. Closed oh-my-symphony's gap: a market/demand **Validate** front-lane.

3. **Build** — `SKILL.md` spine + `reference/` (pipeline · experts · vault · market-research ·
   quality-gates · debugging) + `templates/` (delivery-gate.sh · state.json).

4. **Live validation (3 modes)** on one real service (`examples/url-shortener/`, 68 tests). Full
   audit trail in [`../../../examples/url-shortener/harness-audit/`](../../../examples/url-shortener/harness-audit/).
   - GREENFIELD — adversarial Verify caught **2 real SSRF bypasses + an unauth 500** that passed the
     builder's own green tests.
   - DEBUG — from a symptom only, reproduced a **lost-update race** (200 concurrent → 1/200),
     root-caused it, fixed it, re-verified 0 lost across 10 trials.
   - LEGACY — added link-expiry (TTL) with **zero regressions**, backward-compatible.

5. **Publish** — this repo + a GitHub Pages landing page (`docs/index.html`).

## Self-review + fixes (this entry)

Dogfooded the skill's own philosophy: a fresh adversarial reviewer audited the skill against its own
docs. It found that the bundled example passed partly by deviating from the documented pipeline.
Fixes applied:

| Severity | Finding | Fix |
|---|---|---|
| CRITICAL | DEBUG mode produced no `plan.md`, but the delivery gate requires it → docs-faithful DEBUG runs fail | DEBUG's Diagnose now writes `plan.md` (root-cause + fix plan); Human Feedback records approval before Fix opens |
| CRITICAL | Gate's NO-GO check matched the word anywhere → a valid GREENFIELD `validation.md` discussing NO-GO criteria falsely failed | Gate now matches an explicit `Decision: GO` / `Decision: NO-GO` line; market-research.md emits exactly that line |
| MAJOR | `verification.md` per-claim `verdict:` vs gate failing on any `^verdict: RED` were incompatible | Contract: per-claim lines use `claim <id>:`, one final aggregate `verdict: GREEN` line; rewrite on re-verify |
| MAJOR | `.gitignore` `*.log` silently excluded the `decisions.log` audit trail | Removed `*.log`; ignore only `.just-do-it/` vault scratch; audit `decisions.log` now tracked |
| MAJOR | `contracts.md` was a Build input no phase wrote | GREENFIELD Plan now writes `contracts.md` |
| MAJOR | `state.json` template had no slot for the human-approval gate | Added an `approval` field; documented mode-specific `cycles` keys |
| MAJOR | Docs claimed the gate runs "in a clean sandbox" — it runs in the CWD | Reworded: gate runs in the workspace; clean-state reproduction is the Verify agent's job |
| MINOR | DESIGN.md cited commit SHAs from the ephemeral `/tmp` working copy | Noted they reference that copy; validated source vendored under `examples/` |
| MINOR | SKILL.md gate-5 under-described the gate's checks | Listed all four checks |

The gate's `Decision:` logic was re-tested across four scenarios after the fix (GO+prose-NO-GO → pass;
`Decision: NO-GO` → fail; prose-only NO-GO → fail; no validation.md → pass).

## Decisions

- Skill is **global** (`~/.claude/skills/just-do-it`) so `/just-do-it` works across projects.
- DEBUG/LEGACY default to **single-driver + read-only Plan Mode + approval before the first write**;
  only GREENFIELD validation/scaffolding fans out (task topology picks the architecture).
- Repo visibility: **public** (a private free-plan repo can't publish GitHub Pages).

## Update — vault relocation + file consolidation

Per request, the harness now writes a run's working docs into **`docs/changelog/<date>-<slug>/`** (a
tracked, browsable changelog committed with the code) instead of a hidden `./.just-do-it/` scratch
dir — so every project the harness touches keeps a permanent decision record (this folder is exactly
that, for building the skill).

Reduced the vault from **10 files to 6** without losing information, merging only where it doesn't
break read-scope (a subagent reads just its slice): `validation.md` → `brief.md`'s `## Validation`;
`architecture.md` + `contracts.md` → `plan.md` sections; `qa-report.md` → `verification.md`'s `## QA`;
`decisions.log` → the folder's `README.md`. Kept separate (load-bearing for builder ≠ verifier):
`plan.md`, `claims.md`, `verification.md`. The delivery gate now reads the `Decision:` line from
`brief.md`. The earlier example run-records under `examples/url-shortener/docs/changelog/` predate
this consolidation and keep their original, more granular file set.
