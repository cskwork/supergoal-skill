# Changelog 2026-06-04

## LEARN-DOMAIN Onboard: Step 7 spec + Functional-tier handbook + contract tests

### Decision

Complete the LEARN-DOMAIN **Onboard** step (pipeline row, phase table, and `domain-onboarding.html`
template already landed in `0ff5ef0`) by adding the full Step 7 spec, dispatch wiring, a stop condition,
the Functional-tier visual binding, and contract tests.

`reference/learn-domain.md` now carries `## Step 7 - Onboard (human handbook, HTML)`: render the grounded
pack into one self-contained `<knowledgePath>/onboarding.html` for humans only (default
`.domain-agent/onboarding.html`, gitignored). Seven sections, plain summary first then expert detail in
`<details>`: Orientation, Key terms, Architecture (+ one inline diagram), Key flows, Rules that must not
break (with grounding status), Get hands-on (`test-map.md` commands), Trust & freshness
(verified/unverified legend + `lastUpdated`). Rendered from the pack only - no new facts, never upgrade
`unverified` to verified; each load-bearing fact carries a visible verified/unverified badge; the
markdown pack stays the agent's source of truth and the HTML is a derived snapshot regenerated on every
Freshness run. Dispatch row added (`explore` renders to the Functional tier); stop condition added
(never invent facts or upgrade grounding to make the page read fuller).

Per the follow-up question, the handbook is bound to the **Functional tier**
(`reference/functional-ui.md`), not the Expressive taste tier: one accent + one type/spacing/radius
scale, computed WCAG-AA contrast (body AAA), information density, minimal motion honoring
`prefers-reduced-motion`, declared `color-scheme` with light+dark tokens, no empty decoration. Because the
file must stay self-contained and offline (inline CSS, no external scripts/fonts/CDN/network, inline SVG
for diagrams), that baseline is implemented with a small inline token set rather than a named external
design system (Fluent/Carbon/shadcn) - the offline/no-CDN constraint overrides functional-ui's "adopt one
named system" rule. LEARN-DOMAIN runs no implementation gates, so the render deliberately does not pull
the product Designer's `claims.md` / QA contrast gate / committee apparatus; the agent self-applies the
functional-ui baseline. The `templates/domain-onboarding.html` header comment now names the tier so the
reconciliation travels with the artifact.

### Reasoning

The agent-facing pack (terse markdown, signatures, grounding markers) is not a good human onboarding
read; the Onboard step closes that gap as a derived rendering, not a second source of truth, so it
inherits the pack's grounding discipline and shows each fact's verification status instead of presenting
everything as fact. Self-contained/offline matches the mode's existing security posture (it rejects
embeddings partly because they "double the security surface") and the harness-agnostic, no-network
constraint of the pack. An onboarding handbook is an internal documentation tool - a Functional surface,
never Expressive - so functional-ui.md is the correct authority. The step is procedural like the
clarifying interview, so no new machine gate was added; `learn-grounding-gate.mjs` still validates the
markdown pack only and is unaffected by the new `.html`.

### Verification

Full contract suite passes with no regressions: domain-context, gate-scenarios, interview, learn,
learn-domain (29/0, +12 new Onboard assertions covering the SKILL pipeline/template wiring, the
human-only + self-contained + Functional-tier + source-of-truth reference rules, and the template's
no-external-scripts / verified-badge / color-scheme markers), ui-ux, worktree. Template confirmed
self-contained: a grep for `https?://|src=|<script|cdn\.|@import|<link|url\(` matches only the in-comment
instruction forbidding scripts, no real external reference.

### Files

`reference/learn-domain.md` (Step 7 + dispatch row + stop condition), `templates/domain-onboarding.html`
(Functional-tier header comment), `tests/learn-domain-contract.test.sh` (+12 assertions).

## Root cleanup: move DESIGN.md + user-preference files into subfolders

### Decision

Keep the repo root to `SKILL.md`, `README.md`, `LICENSE` only. Moved the three stray root files:
`DESIGN.md` -> `docs/DESIGN.md` (joins the other docs), `USER_PREFERENCE.template.md` ->
`learn/USER_PREFERENCE.template.md`, and the git-ignored runtime profile `USER_PREFERENCE.md` ->
`learn/USER_PREFERENCE.md` (grouped with the LEARN-mode artifacts it belongs to).

### Reasoning

The root mixed the skill entrypoint/readme/license with design docs and LEARN runtime files. Grouping
by purpose: design rationale lives under `docs/`, all LEARN preference state lives under `learn/`
alongside the session journals (which `.gitignore` already special-cases). The live profile is the
LEARN flow's persistent state, so its home is the LEARN folder, not root.

### Path updates

- `.gitignore`: dropped the root `USER_PREFERENCE.md` rule (now covered by `learn/*.md`); added
  `!learn/USER_PREFERENCE.template.md` so the tracked template survives the `learn/*.md` ignore.
- `reference/learn.md`: 4 path references -> `learn/USER_PREFERENCE.md` and
  `learn/USER_PREFERENCE.template.md` (the LEARN flow now reads/writes/seeds from `learn/`).
- `README.md`: DESIGN.md link -> `docs/DESIGN.md`; Layout block folds DESIGN.md into the `docs/` row
  and notes `USER_PREFERENCE(.template).md` under `learn/`.
- `docs/changelog/2026-05-30-research-build-validate/README.md`: relative link `../../../DESIGN.md`
  -> `../../DESIGN.md`. DESIGN.md's own code-span paths are root-relative descriptions, left as-is.

### Files

`docs/DESIGN.md` (moved), `learn/USER_PREFERENCE.template.md` (moved), `.gitignore`,
`reference/learn.md`, `README.md`, `docs/changelog/2026-05-30-research-build-validate/README.md`.

## Clarifying-interview step before plan freeze (GREENFIELD/DEBUG/LEGACY)

### Decision

Insert a conditional, ambiguity-gated clarifying interview after context-gathering and before plan
freeze for GREENFIELD, DEBUG, and LEGACY. LEARN and LEARN-DOMAIN are exempt (LEARN already asks one
calibration question; learn-domain is for the agent). New `reference/interview.md` is the standalone
contract; `SKILL.md`, `reference/pipeline.md`, and `reference/debugging.md` wire it into the pipelines.

Insertion points (inline sub-step of the existing phase, not a new dispatched agent):
- GREENFIELD/LEGACY: start of Plan, before plan-grounding/freeze.
- DEBUG: end of Diagnose - present 3-5 ranked root-cause hypotheses for user re-ranking, non-blocking
  (proceed on own ranking if AFK), instead of abstract requirement questions.

Encoded rules: (1) gate on ambiguity - fire only on multiple plausible interpretations or unclear key
detail, skip when clear or a cheap code read answers it, and log the skip; (2) code-first - resolve
code-answerable questions by reading current docs/code (reuse `plan-grounding.md`), only user-only
load-bearing choices reach the user; (3) cap at 3-5 high-leverage questions, one round, one at a time,
each with a recommended answer (no batching); (4) draw questions from a six-dimension menu - objective,
definition-of-done, scope, constraints, environment, safety/reversibility - picking the few that matter;
(5) select by information gain (most narrows the viable-plan space; drop already-answered aspects); (6)
hard gate - block plan freeze until must-have answers or a user-approved assumption; (7) mandate the
gate explicitly, since LLMs default to not asking and misjudge underspecification. Resolved choices /
approved assumptions recorded in `plan.md` `## Interview` (DEBUG: in `README.md` by the hypothesis
ledger).

### Reasoning

A fact-checked deep-research pass (6 angles, 21 sources, 25 claims adversarially verified, 22 confirmed)
converged on this shape across peer-reviewed work (Ambig-SWE/CMU, Active Task Disambiguation/ICLR 2025,
SAGE-Agent, Ask-before-Plan, ClarEval) and the agentskills `ask-questions-if-underspecified` convention.
The 3-5 cap is backed by Ambig-SWE's finding that Claude-style balanced specificity-plus-quantity
(~3.5-3.8 questions) beats too-few/too-many/templated questioning, and directly fits the requested goal.
Of the three named inspiration harnesses: mattpocock/skills supplied the technique (one-at-a-time,
recommend-an-answer, code-exploration gate, and the diagnose skill's 3-5 ranked-hypothesis checkpoint)
but its deliberate no-numeric-cap philosophy was rejected as an anti-fit for a capped interview;
Hermes-agent is a deliberate contrast (one brief question, no interview skill) showing what not to
over-build; Q00/ouroboros yielded no surviving interview pattern and was dropped from the set. Verified
refutations were honored: question batching is not assumed superior to one-at-a-time (refuted 0-3), and
the dramatic GPT-4o 89%-vs-8.94% figure was not cited (refuted 1-2). The step is procedural (recorded
in `plan.md`, like plan-grounding), so no new machine gate was added; it reinforces, not replaces, the
existing `human-feedback-gate.mjs` (interview crystallizes what to build; Human Feedback approves the
plan).

### Verification

Full suite under WSL: interview-contract 26/0 (new), gate-scenarios 100/0, domain-context 30/0,
worktree 17/0, ui-ux 17/0, learn-domain 17/0, learn 11/0 = 218 passed, 0 failed. New test asserts the
interview wiring in `SKILL.md`/`pipeline.md` and the gate/cap/code-first/DEBUG-rerank/hard-gate rules in
`interview.md`/`debugging.md`. No regressions.

### Files

`reference/interview.md` (new), `tests/interview-contract.test.sh` (new), `SKILL.md`,
`reference/pipeline.md`, `reference/debugging.md`.

## LEARN-DOMAIN mode: agentic-discovery wiki with execution-grounded verification

### Decision

Add a fifth mode, **LEARN-DOMAIN**, that learns a large/cryptic codebase *for the agent* and persists a
source-grounded `.domain-agent/` wiki (distinct from LEARN, which teaches a human). Pipeline:
`Intake -> Survey -> Scope checkpoint -> Map -> Deepen -> Ground -> Persist -> Freshness`. It writes no
production code and uses no implementation gates; its only writes are the knowledge pack plus throwaway
sandbox probes.

New `reference/learn-domain.md` encodes six research-backed technique choices:

1. **Agentic discovery, not embeddings/RAG** - read structure, read files, follow imports, grep. Vector
   indexing fragments call/definition coherence, doubles the security surface (invertible embeddings),
   and goes stale on every edit; Cline and Claude Code abandoned it for code.
2. **Markdown-first persistence** - Aider repo-map pattern (key symbols + signatures, not full files);
   lightweight, git-friendly, harness-agnostic across Claude Code/Codex/agy.
3. **Bottom-up hierarchy** - symbol -> file -> package -> bounded context -> repo, grounded in business
   meaning; direct whole-file summarization measurably drops functions/variables (arXiv 2501.07857).
4. **Optional structural index only** - a local tree-sitter/ctags graph (no vectors) is a cache, never
   required; graph scaffolding does not reliably beat a grep baseline (ContextBench, arXiv 2602.05892).
5. **Balanced budget** - moderate retrieval rounds and chunk sizes beat whole-file dumps and
   hyper-fragmentation; start small, deepen on later runs (over-engineering is a documented failure).
6. **Execution-grounded verification** - each load-bearing fact is proven by a probe that runs; ~1/5 of
   even the best LLM's code descriptions are inaccurate and static self-checks do not correlate with
   accuracy (arXiv 2406.14836). Facts that cannot be executed are marked `unverified`, never faked.

Supporting edits: `SKILL.md` (mode table row, LEARN-vs-LEARN-DOMAIN note, reference map, template-script
row); `templates/domain-agent/code-map.md` (Aider-style `Key Symbols (signatures)` section);
`templates/domain-agent/invariants.md` and `flows/README.md` (`Grounding: verified|unverified` field);
new gate `templates/learn-grounding-gate.mjs` enforcing that every populated invariant/flow carries a
grounding marker, `index.md` names a concrete entry point, and a high-precision secret scan passes.

### Reasoning

The repo already had the *retrieval/freshness/saving* half of domain knowledge (`domain-context.md` +
`.domain-agent/`), but first-run setup only scaffolded empty templates - there was no workflow to
*actively learn and verify* a big unknown codebase. A fact-checked deep-research pass (5 angles, 25
sources, 22/25 claims confirmed) converged on agentic discovery + markdown-first + bottom-up + grounded
verification, and explicitly refuted the "graph/embeddings beat grep" and "graph index cuts tokens"
narratives (both 0-3), so the structural index is encoded as optional-cache, not a requirement. The
grounding gate exists because the strongest finding was that static consistency checks have no
relationship with summary accuracy; only execution-grounded proof does. Harness-agnostic constraint is
honored: every artifact is plain markdown; any SQLite/graph cache is local and re-derived from code.

### Verification

Full suite under WSL: gate-scenarios 99/0 (new SCENARIO 11 = 7 cases for the grounding gate),
learn-domain-contract 17/0 (new), learn-contract and domain-context-contract unchanged and green. Gate
logic also exercised directly with node across pass + ungrounded + template-only + placeholder-entry +
secret + no-flows cases. No regressions.

### Files

`reference/learn-domain.md` (new), `templates/learn-grounding-gate.mjs` (new),
`tests/learn-domain-contract.test.sh` (new), `SKILL.md`, `templates/domain-agent/code-map.md`,
`templates/domain-agent/invariants.md`, `templates/domain-agent/flows/README.md`,
`tests/gate-scenarios.test.sh`.

## DEBUG hardening: distributed triage, F->P repro, evidence ledger, context isolation

### Decision

Encode five research-backed senior-engineer debugging disciplines into DEBUG mode. Sources are
top-tier primary doctrine (Google SRE Book/Workbook, OpenTelemetry, W3C Trace Context, AWS Builders'
Library) plus SWE-bench-line agent papers (Agentless, SWE-Adept, SWE-Tester/SWT-Bench), surfaced by a
fact-checked deep-research pass and mapped to encodable harness rules.

Six rules added to `reference/debugging.md`, with supporting edits in `reference/pipeline.md` (DEBUG
exit gates) and `reference/vault.md` (hypothesis ledger format):

1. **Golden-signal triage + symptom-vs-cause split.** Cross-boundary failures are framed in latency,
   traffic, errors, saturation before guessing why; chase only definite, imminent causes. Blocks
   premature root-cause fixation.
2. **Correlation-ID propagation as a precondition.** Cross-service RCA requires a trace/request ID
   propagated across every boundary; if none exists, establishing it is the first task, not a guess.
3. **Known-good vs known-bad differential.** Compare a passing trace against a failing one; find the
   tag/value unusually correlated with failures, not the always-present ones.
4. **Hypothesis ledger with evidence on both sides.** DEBUG `README.md` records symptom, candidate
   cause, evidence-for, evidence-against, and "definite & imminent?"; only a confirmed cause advances.
5. **Reproduce-first as a fail-to-pass (F->P) gate.** The repro must FAIL pre-fix and PASS post-fix
   with no new failures; reproduction is scaffolded as its own skill; flaky/timing bugs must fail
   consistently over N runs before being trusted.
6. **Context isolation + minimal-diff checkpointing + escalation.** Single-driver stays the default,
   but bugs spanning many files or multiple services split into separate localize/fix contexts;
   localization returns structural previews, not whole files; fixes checkpoint per plan step so every
   change traces to one observed outcome, avoiding free-form edit sprawl.

Also added a microservice failure-pattern checklist (cascading overload, retry storms needing jittered
backoff + per-request limit + retry budget, missing deadline propagation, partial-failure bimodal
latency read via distributions not averages).

### Reasoning

The prior DEBUG loop had a solid skeleton (reproduce-first, competing hypotheses, circuit breaker,
regression proof) but no distributed-systems observability discipline and no agent context-hygiene
rule. The additions target the requested gaps: cross-boundary (DB/API/network/queue) bugs, reusable
domain failure literacy, and surgical, succinct senior-engineer resolution. The over-strong variant
"fixed deterministic phases always beat autonomy" was refuted in verification (0-3), so single-driver
is encoded as a default with an explicit breadth-based escalation, not an absolute rule.

### Verification

Full suite under WSL: worktree-contract 17/0, domain-context 30/0, ui-ux 17/0, learn 11/0,
gate-scenarios 92/0 = 167 passed, 0 failed. No regressions from these edits.

### Files

`reference/debugging.md`, `reference/pipeline.md`, `reference/vault.md`.

## Worktree contract test: reconcile stale merge anchor

### Decision

Update the `merge goes into target` assertion in `tests/worktree-contract.test.sh` from the dropped
literal "merge the accepted worktree commit into the target branch" to the current canonical wording
"integrate only by a merge commit into".

### Reasoning

Commit 22d70f2 intentionally reworded SKILL.md's merge-commit policy (stricter: explicit merge commit
required) but left the test's literal anchor pointing at the old phrase, so the guard was red at HEAD
before any work here. The contract is intact and stronger, only the wording moved; re-anchoring the
test to the present sentence restores the guard without weakening it.

## Windows compatibility: force LF line endings

### Decision

Add `.gitattributes` forcing LF (`eol=lf`) on `*.sh`, `*.mjs`, `*.js`, `*.md`, `*.json` and re-checkout
tracked scripts so the working tree is LF on Windows.

### Reasoning

The repo stores LF, but a Windows checkout with `core.autocrlf=true` materialized the gate and test
scripts as CRLF. bash (Git Bash/WSL) then failed to parse them (`$'\r': command not found`), which is
the real reason the suite would not run on Windows. The gate scripts themselves were already
tool-portable (`delivery-gate.sh` handles both `sha256sum` and `shasum` and strips `\r`), so line
endings were the only hard blocker. `.gitattributes` overrides `autocrlf` and fixes this permanently
for every future checkout regardless of the user's git config.

Target support level is bash-on-Windows (Git Bash or WSL already present on the dev machine), not a
bash-free PowerShell port. Note: under Git Bash's msys grep the contract tests' piped `grep`
mis-reports; run the suite under WSL bash. A future Node port of the three `.sh` gates would remove the
bash dependency entirely if bash-free PowerShell support is later required.

### Files

`.gitattributes` (new); LF renormalization of tracked `*.sh`/`*.mjs` working copies.

## Output language follows the user

### Decision

Agent-authored prose (vault `README.md`/`brief.md`/`plan.md`/`claims.md`/`verification.md`
descriptions, both Human Feedback briefs, run notes, changelog, LEARN journals, and every returned
summary) is written in the user's language, defaulting to English only when unknown. Machine-checked
anchors, structural keys, code, identifiers, file paths, shell commands, and commit messages stay in
canonical English.

### Reasoning

The skill previously localized only atomic-explanation labels, leaving the rest English by default. The
gates grep literal English anchors (`Decision: GO`, `verdict: GREEN`, `## Coverage`, `Not covered:`,
`Regression tests:`, `Committee:`, `RE-PLAN:`, `APPROVED`, `run-to-prove`, `## Human Feedback`), so a
blanket "translate everything" rule would break them. The rule therefore splits prose (translated) from
machine tokens (verbatim), extending the existing label-localization pattern. Applied at three reach
points: the `SKILL.md` Core Contract (authoritative), the `reference/experts.md` dispatch procedure and
locked-prompt template (the literal text each writing agent receives), and a `reference/vault.md` note.
Full suite stays 167 passed, 0 failed.

### Files

`SKILL.md`, `reference/experts.md`, `reference/vault.md`.
