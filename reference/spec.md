# SPEC - spec-first prefix (requirements -> design -> tasks)

Kiro-style spec structuring merged into the baseline-first loop. Before Build, crystallize the feature
as three approved documents - requirements.md -> design.md -> tasks.md - under `docs/spec/<feature-slug>/`
in the TARGET repo. The documents are crystallized WITH the user through a grilling dialogue (below),
not drafted autonomously for rubber-stamp approval. Then the default loop executes against them: Build
executes tasks.md in order, and the critic derives its failing tests from the EARS acceptance criteria.
The spec is a living document, not a one-shot artifact: implementation gaps and surfaced requirements
flow back into it.

## Where it runs

A prefix to the default loop for GREENFIELD / LEGACY (DEBUG keeps `reference/debugging.md`; a bug fix
does not need a spec). It runs at the end of Frame and replaces the generic clarifying interview
(`reference/interview.md`) with the deeper grill below - do not run both. The approved spec replaces
`plan.md` as the frozen plan (`reference/plan-grounding.md` grounds design.md instead).

## Gate - when to spec vs skip

Fire when **either** holds:

- The user explicitly asks for a spec ("spec this", "스펙", "requirements 문서로", "구조화해서"), or
- The feature is multi-component / high-rework-cost (several integrations, roles, or user flows) AND
  the user confirms a spec-first run when offered.

Skip when **any** holds (default loop without spec; log the skip in the run `README.md`):

- Trivial single edit or clear single-interpretation change - a spec here is ceremony, not signal.
- Urgent hotfix - fix first; backfill the spec only if the user asks.

## Documents (in order; one file each under `docs/spec/<feature-slug>/`)

Write prose in the docs language (SKILL.md); keep EARS keywords, filenames, and requirement IDs canonical.

**1. requirements.md** (`templates/spec/requirements.md`) - **what, not how.** Behaviors, never
technologies ("system SHALL return cached results", not "use Redis").

- **Glossary first**: define each domain term once; every EARS statement uses glossary terms verbatim -
  one name per concept, no synonyms.
- **Numbered requirements**, each with three parts:
  - User story: `As a [role], I want [feature], so that [benefit]`.
  - Acceptance criteria in EARS format:
    - `WHEN [event] THEN [system] SHALL [response]`
    - `IF [precondition] THEN [system] SHALL [response]`
    - `WHEN [event] AND [condition] THEN [system] SHALL [response]`
  - Edge cases: empty/null input, boundaries, error and recovery paths, authorization gaps, concurrency.
- Non-functional requirements (measurable - "p95 < 500ms", never "fast"), Out of scope, Open questions
  (each open question becomes an interview question before approval).
- Quality bar: every criterion testable; no vague terms (fast/easy/user-friendly); error cases present;
  no conflicting requirements.

**2. design.md** (`templates/spec/design.md`) - **how the requirements are met.** Overview,
architecture, components and interfaces, data models, error handling, testing strategy. Each component
cites the requirement numbers it serves. Decision records are grilled, not auto-decided: present the
options with pros/cons and a recommendation, one at a time, and record the user's pick
(Context / Options considered / Decision / Rationale). Record one only when the choice is hard to
reverse, surprising without context, AND a real trade-off - cheap, reversible choices are decided
autonomously and noted in place. Design for current requirements, not hypothetical futures.

**3. tasks.md** (`templates/spec/tasks.md`) - **checkbox implementation plan.** Two-level hierarchy
(`- [ ] 1.` epic -> `- [ ] 1.1` task); each task states what to implement, files touched, tests to
write, and `_Requirements: N.N_` traceability refs. Tasks are coding tasks only, small enough to verify
independently, sequenced to respect dependencies - minimal foundation first, then the highest-risk /
highest-value vertical slice, then the rest.

## Grill - crystallize, don't rubber-stamp

The failure mode of spec-first work is autonomous drafting: the agent writes three polished documents
and the user skims and approves. Requirements written that way encode the agent's guesses, not the
user's intent. The middle ground: draft the skeleton autonomously, grill the load-bearing decisions,
and let the documents crystallize from the answers.

1. **Skeleton first (autonomous).** Explore the code and docs, then draft the document skeleton fast:
   candidate glossary terms, requirement one-liners, known constraints, open questions. Mechanical
   work - EARS phrasing, edge-case enumeration, formatting - stays autonomous throughout.
2. **Grill the open decisions.** Walk the decision tree branch by branch, resolving dependencies
   between decisions in order - one question at a time, each with a recommended answer; wait for the
   reply before the next. Grill only load-bearing, user-only choices; if a question can be answered
   by exploring the codebase, explore the codebase instead of asking.
3. **Challenge moves** (use whichever the answer calls for):
   - **Terms**: when the user's term conflicts with the spec glossary or the repo's existing language
     (`CONTEXT.md` / `.domain-agent/` when present), call it out immediately; when a term is vague or
     overloaded, propose a precise canonical term.
   - **Boundaries**: stress-test each relationship with a concrete scenario that probes an edge until
     the boundary between concepts is precise.
   - **Reality**: when the user states how something works, check whether the code agrees; surface
     any contradiction instead of writing the user's version into the spec.
4. **Crystallize inline.** A settled answer lands in the document the moment it settles - glossary
   entry, EARS criterion, out-of-scope line, resolved open question. Do not batch answers into one
   big final draft.
5. **Escape hatch.** The user can say "draft the rest" (or pre-approve up front) at any point - then
   convert the remaining grill items to recorded assumptions in the document and continue
   autonomously. Stop grilling when no load-bearing open question remains.
6. **Rejections become ADRs.** When the user rejects an option or approach for a load-bearing
   reason, offer to record it as an ADR under `docs/adr/` (context, decision, rationale) so future
   runs and surveys don't re-suggest it; skip ephemeral ("not now") and self-evident reasons.

## Approvals - one checkpoint per document

- Each document ends with a cheap checkpoint - by then its content was crystallized together during
  the grill, so this is a confirmation, not a first read: present a short summary plus any recorded
  assumptions. Do not start design until requirements.md is approved; do not start tasks until
  design.md is approved; Build starts only on approved tasks.md.
- The user may **pre-approve** all phases up front ("끝까지 진행" / "run it through") - then record the
  per-phase assumptions in each document and continue without stopping. Genuine ambiguity still blocks
  (SKILL.md hard stops); pre-approval is not a license to guess load-bearing choices.

## Execution - the spec drives the default loop

- **Build executes tasks.md in order**; check off each task as its tests pass. When implementation
  reveals a gap, add a task - never silently skip or reorder without noting why.
- **Critic**: the critic derives its failing tests from the EARS acceptance criteria - each WHEN/THEN
  line is a test case by construction, and the edge-case lists seed the boundary tests. The run vault's
  `surfaced-requirements.md` trail stays as-is (`reference/role-loop.md`).
- **Backflow**: every surfaced requirement is added to requirements.md as a new numbered requirement
  with EARS criteria, so the spec stays the document of record while the run vault keeps the per-run
  trail.
- **Verify**: every EARS criterion has a covering test or an explicit not-covered note; all tasks
  checked off; every `_Requirements:_` ref resolves to an existing requirement number.

## Guardrails

- EARS criteria and spec documents strengthen the prose spec; they **never replace ground truth** -
  final verification is the project's REAL tests + prose spec (SKILL.md core principles).
- Requirements stay what, not how; the how lives in design.md only.
- Spec drift is a defect: when code and requirements.md disagree, fix the code or (with user consent)
  amend the spec - never leave them inconsistent.
- Keep each document scoped to this feature, not the whole product; a spec nobody re-reads is ceremony.
