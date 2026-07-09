# Two-Axis Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Supergoal's mandatory code review into independent Spec and Standards axes, and apply the same split to REVIEW-ONLY.

**Architecture:** Keep the current default loop and run vault model. Change the review stage contract and the `agents/code-reviewer.md` persona so the conductor can dispatch Spec, Standards, or optional Critic work with clear edit boundaries.

**Tech Stack:** Markdown skill contract files, shell contract tests.

---

### Task 1: Contract Tests

**Files:**
- Modify: `tests/role-loop-contract.test.sh`
- Modify: `tests/review-only-contract.test.sh`

- [ ] Add assertions that the default loop names `Mandatory Two-Axis Review`.
- [ ] Add assertions that the Spec axis checks request/docs, `GOAL.md`, `PLAN.md`, `QA.md`, and scope creep.
- [ ] Add assertions that the Standards axis checks repo standards and the Fowler-style smell baseline.
- [ ] Add assertions that REVIEW-ONLY dispatches Standards, Spec, and Security reviewers while remaining findings-only.
- [ ] Run `bash tests/role-loop-contract.test.sh` and `bash tests/review-only-contract.test.sh`; expected result: fail before contract files are updated.

### Task 2: Default Loop Contract

**Files:**
- Modify: `SKILL.md`
- Modify: `reference/role-loop.md`
- Modify: `reference/debugging.md`
- Modify: `reference/observability.md`

- [ ] Replace the blended mandatory adversarial review wording with `Mandatory Two-Axis Review`.
- [ ] Define the Spec and Standards review axes.
- [ ] Keep Critic/Fixer as optional escalation only.
- [ ] Keep Exact Verify/QA after review and explicitly stronger than reviewer approval.
- [ ] Update the optional board phase name to include `MandatoryTwoAxisReview`.

### Task 3: Reviewer Persona and REVIEW-ONLY

**Files:**
- Modify: `agents/code-reviewer.md`
- Modify: `reference/review-only.md`

- [ ] Teach `agents/code-reviewer.md` three stances: Spec axis, Standards axis, optional Critic escalation.
- [ ] Make REVIEW-ONLY dispatch Standards, Spec, and Security reviewers in parallel where possible.
- [ ] Keep REVIEW-ONLY read-only except for the run report.
- [ ] Preserve the route from review findings to DEBUG/LEGACY for fixes.

### Task 4: Docs and Changelog

**Files:**
- Modify: `README.md`
- Modify: `README.ko.md`
- Modify: `docs/index.html`
- Modify: `docs/changelog/changelog-2026-07-09.md`

- [ ] Update public loop descriptions to include Two-Axis Review.
- [ ] Update REVIEW-ONLY descriptions to show Standards, Spec, and Security.
- [ ] Record the decision, reasoning, and rejected alternatives in the changelog.

### Task 5: Verification

**Files:**
- No product files.

- [ ] Run `bash tests/role-loop-contract.test.sh`; expected result: pass.
- [ ] Run `bash tests/review-only-contract.test.sh`; expected result: pass.
- [ ] Run `bash tests/run-all.sh`; expected result: pass.
- [ ] Run `git diff --check`; expected result: no whitespace errors.
