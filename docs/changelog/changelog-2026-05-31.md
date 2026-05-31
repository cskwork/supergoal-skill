# 2026-05-31 - Plan grounding cherry-pick recovery

## Decision

Resolve the `75ae012` cherry-pick by keeping the `reference/plan-grounding.md` reference-map entry
in `SKILL.md`, and restore the deleted `feat/supergoal-plan-grounding` branch ref to that commit.

## Reasoning

- The incoming change adds Plan-phase grounding documentation and wiring, so the reference map must
  expose the new file alongside the existing phase references.
- `CHERRY_PICK_HEAD` still pointed at `75ae012`, making branch-ref recovery exact and non-destructive.
- The local `dev` HEAD was verified as `82f1b2b`; earlier `a46d2b2` output was not used as evidence.

---

# 2026-05-31 - Completeness contract (close the false-GREEN failure class)

## Decision

Add a machine-enforced **completeness contract** to the delivery gate and wire three supporting
mechanisms across the references, so a GREEN verdict can no longer pass on an incomplete claim set.

- `templates/delivery-gate.sh`: require `verification.md` to carry a `## Coverage` map, a
  `Not covered:` line, and a `Regression tests:` line; fail if any is missing. Verdict semantics
  re-stated in the header: `verdict: GREEN` = "every *enumerated* claim re-verified", not "safe".
- `reference/quality-gates.md`: new "Completeness" section — coverage map (gated), completeness
  critic before GREEN, a worked SSRF/URL-validation domain checklist (names trailing-dot FQDN,
  IPv4-mapped IPv6, octal/hex IP, NAT64), and a ≥3-lens diverse verifier panel for high-severity claims.
- `reference/{pipeline,experts,vault,domain-rules}.md` and `SKILL.md`: Verify exit gates, the
  completeness-critic role, the `verification.md` format block, the gated coverage checklist, and the
  non-negotiable-gates list + final checklist updated to match.
- `examples/.../{url-shortener-service,legacy-link-expiry,debug-hit-undercount}/verification.md`:
  added honest `## Coverage` blocks so the shipped examples satisfy the tightened gate and model it.
- `tests/gate-scenarios.test.sh`: +4 cases (2.5b/c/d completeness-fail, contract-complete PASS path).
  51/51 green.

## Reasoning

- The skill-vs-no-skill experiment (`docs/experiments/2026-05-31-skill-vs-noskill-ssrf`) showed the
  adversarial Verify gate emitting `verdict: GREEN` on still-vulnerable code: both arms missed a
  trailing-dot FQDN SSRF bypass that was never in the enumerated claim set. A gate is only as complete
  as the claims behind it — so the fix is to bound and audit that set, not to add one SSRF check.
- Evidence the fix closes the class: the experiment's actual false-GREEN `verification.md` (0 Coverage
  sections) is now rejected by the gate (exit 1, "no '## Coverage' section"); the SSRF checklist now
  names the exact missed vector, so a compliant Coverage section cannot omit it by silence.
- Proven against the committed examples and the gate harness (Tier A/F): 51/51 cases green, all
  reference-map files present, no removed-vault-file referenced as current.

---

# 2026-05-31 - QA fallback + static-file rendering made explicit (qa.md)

## Decision

Clarify two QA-phase ambiguities in `reference/qa.md` that let a run improvise a non-sanctioned
renderer:

- **Static file / single HTML (no server):** state that there is nothing to serve — agent-browser
  opens the file directly via its `file://` path from the Verify worktree; do not improvise another
  renderer.
- **agent-browser unavailable:** define the fallback explicitly. A headless Chrome/Edge driver may
  stand in only if install is truly impossible, and then under two rules — (a) it runs inside the
  `qa-tester` subagent, never the orchestrator; (b) it does the QA job (golden + edge + a11y +
  as-is/to-be) and is never folded into Verify, which stays a pure `run-to-prove` re-run with no
  browser.

Scope was limited to A+B (qa.md). The experts.md `qa-tester`-vs-browser-native-agent mapping (C) was
deferred — it depends on the project's agent roster and needs verification before editing.

## Reasoning

- An observed run conflated Verify and QA into one agent and used headless-Chrome screenshots instead
  of agent-browser. Cross-checking the skill confirmed the deviation: `pipeline.md` keeps Verify
  (claim re-run, no browser) and QA (agent-browser, black-box) as separate gates, and `qa.md` already
  forbids running the browser from the orchestrator and prescribes STOP+prompt — not a Chrome fallback.
- Root cause was runtime non-compliance, not a skill defect, but two gaps invited it: the "Web app"
  steps were written server-first (so "no server" read as "section N/A"), and the only escape hatch
  on a blocked install was STOP, with no stated constraints if an agent improvises a fallback anyway.
  The edits close both without changing any gate or the agent-browser-first preference.

---

# 2026-05-31 - Disambiguate the LEGACY Explore dispatch

## Decision

Make the LEGACY Explore phase a distinct **Explorer** role driven by the `explore` agent, separate
from the `architect` (Plan only).

- `reference/experts.md`: split the roster row `Architect (Plan/Explore)` into two —
  `Explorer (LEGACY Explore)` → `explore` (Sonnet), reads `brief.md`, produces the `README.md`
  codebase map with file:line citations; `Architect (Plan)` → `architect` (Opus), reads brief +
  README map, produces `plan.md`. Explorer fans out `Explore` (broad-search) helpers for parallel
  mapping.
- `reference/pipeline.md`: LEGACY Explore row reworded from "use `explore` skill/agent" to
  "driven by the `explore` agent; fan out `Explore` helpers for parallel mapping".

## Reasoning

- The two references disagreed: `pipeline.md` told Explore to "use the `explore` agent" while the
  `experts.md` roster mapped Plan/Explore to a single `architect`. Ambiguous dispatch — unclear which
  agent type and read-scope the phase runs under.
- Reading A (own Explorer role) wins on the skill's own thesis: fresh context + role separation per
  phase, one job per agent. Explore produces a citation map (`README.md`); Plan produces design
  (`plan.md`). Different jobs with different read-sets, so different roles.
- The dedicated `explore` agent type (read-only search specialist) fits codebase mapping; `architect`
  (Read/Grep/Glob) is reserved for the Plan-phase grounding it already owns. Sonnet tier for the
  search/mapping pass; the Opus architect consumes the map downstream.
- `reference/learn.md:12` already lists `explore` first for codebase mapping, so no change there.
