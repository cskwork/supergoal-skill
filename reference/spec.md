# SPEC - spec-first prefix (requirements -> design -> tasks)

Before Build, crystallize the feature as requirements.md -> design.md -> tasks.md under
`docs/spec/<feature-slug>/` in the target repo. Grill load-bearing decisions with the user; do not draft
autonomously for rubber-stamp approval. Then Build executes tasks.md in order, and the critic derives its
failing tests from the EARS acceptance criteria. The spec is a living document: implementation gaps and
surfaced requirements flow back into it.

## Where it runs

Prefix for GREENFIELD / LEGACY. DEBUG keeps `reference/debugging.md`; bug fixes usually skip spec. Run at
Frame end. It replaces the generic clarifying interview (`reference/interview.md`); do not run both. The
approved spec replaces `plan.md` as the frozen plan (`reference/plan-grounding.md` grounds design.md).

## Gate - when to spec vs skip

Fire when **either** holds:

- The user explicitly asks for a spec ("spec this", "스펙", "requirements 문서로", "구조화해서"), or
- Multi-component / high-rework-cost feature and the user confirms spec-first.

Skip when **any** holds (default loop without spec; log the skip in the run `README.md`):

- Trivial single edit or clear single-interpretation change - a spec here is ceremony, not signal.
- Urgent hotfix - fix first; backfill the spec only if the user asks.

## Documents (in order; one file each under `docs/spec/<feature-slug>/`)

Write prose in the docs language (SKILL.md); keep EARS keywords, filenames, and requirement IDs canonical.

**1. requirements.md** (`templates/spec/requirements.md`) - **what, not how.** Behaviors, not
technologies.

- **Glossary first**: define each domain term once; every EARS statement uses glossary terms verbatim -
  one name per concept, no synonyms.
- **Numbered requirements**, each with three parts:
  - User story: `As a [role], I want [feature], so that [benefit]`.
  - Acceptance criteria in EARS format:
    - `WHEN [event] THEN [system] SHALL [response]`
    - `IF [precondition] THEN [system] SHALL [response]`
    - `WHEN [event] AND [condition] THEN [system] SHALL [response]`
  - Edge cases: empty/null input, boundaries, error and recovery paths, authorization gaps, concurrency.
- Non-functional requirements (measurable), Out of scope, Open questions (each becomes an interview
  question before approval).
- Quality bar: every criterion testable; no vague terms (fast/easy/user-friendly); error cases present;
  no conflicting requirements.

**2. design.md** (`templates/spec/design.md`) - **how requirements are met.** Overview, architecture,
interfaces, data models, error handling, testing strategy. Each component cites requirement numbers.
Decision records are grilled: present options with pros/cons and a recommendation, one at a time, and
record the user's pick (Context / Options considered / Decision / Rationale). Record only choices hard to
reverse, surprising without context, and a real trade-off. Design for current requirements only.

**3. tasks.md** (`templates/spec/tasks.md`) - checkbox plan. Two-level hierarchy (`- [ ] 1.` epic ->
`- [ ] 1.1` task); each task states implementation, files, tests, and `_Requirements: N.N_`. Tasks are
coding-only, small enough to verify independently, dependency-ordered: minimal foundation, highest-risk /
highest-value slice, then the rest.

## Grill - crystallize, don't rubber-stamp

Failure mode: polished autonomous docs encode agent guesses. Better: draft the skeleton autonomously,
grill load-bearing decisions, and crystallize docs from answers.

1. **Skeleton first (autonomous).** Explore code/docs, then draft candidate glossary terms, requirement
   one-liners, constraints, open questions. Mechanical EARS phrasing, edge-case enumeration, and
   formatting stay autonomous.
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
   convert remaining grill items to recorded assumptions and continue autonomously. Stop when no
   load-bearing open question remains.
6. **Rejections become ADRs.** When the user rejects an option or approach for a load-bearing
   reason, offer to record it as an ADR under `docs/adr/` (context, decision, rationale) so future
   runs and surveys don't re-suggest it; skip ephemeral ("not now") and self-evident reasons.

## Approvals - one checkpoint per document

- Each document ends with a cheap checkpoint: short summary plus recorded assumptions. Do not start
  design until requirements.md is approved; do not start tasks until design.md is approved; Build starts
  only on approved tasks.md.
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
