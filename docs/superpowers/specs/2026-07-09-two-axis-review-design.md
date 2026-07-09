# Two-Axis Review Design

## Problem

The default GREENFIELD / DEBUG / LEGACY loop already has a mandatory adversarial review, but the reviewer
mandate is blended. A single reviewer can mix "does this match the request?" with "is this code shaped well?",
which lets one axis hide the other.

## Decision

Adopt Matt Pocock's useful `code-review` idea as a Supergoal-native review gate: keep the existing mandatory
review position after the two improve passes, but split it into independent **Spec** and **Standards** axes.
Keep Exact Verify/QA as the hard proof layer after review.

## Scope

- Default code loop: GREENFIELD, DEBUG, and LEGACY.
- REVIEW-ONLY mode: same axis split, plus the existing security reviewer.
- Code reviewer persona: support Spec axis, Standards axis, and the existing optional Critic escalation.
- Contract tests and public docs: update wording that names the default loop.

## Design

The default loop becomes:

`Build -> Improve full spec -> Improve edge cases -> Mandatory Two-Axis Review -> Exact Verify/QA`

The Spec axis checks request/docs, `GOAL.md`, `PLAN.md`, `QA.md`, tests, and the current diff for missing
requirements, partial behavior, wrong behavior, and scope creep.

The Standards axis checks repo standards, standing rules, surrounding style, test design, readability,
maintainability, and a Fowler-style smell baseline. Documented repo rules override the smell baseline, and
smells remain judgment calls rather than hard failures.

REVIEW-ONLY dispatches Standards, Spec, and Security reviewers in findings-only mode. It still writes no source
or test changes; fixing findings remains a separate DEBUG/LEGACY objective.

## Rejected Alternatives

- Replace Supergoal's review gate with Matt's workflow wholesale.
  Why rejected: Supergoal already has run vaults, `GOAL.md`, `QA.md`, red-green, and exact proof gates.
- Put the split inside the builder.
  Why rejected: the builder needs one clear job; review needs fresh context and no source edits.
- Drop the security reviewer from REVIEW-ONLY.
  Why rejected: that would weaken an existing safety surface.

## Verification

- `bash tests/role-loop-contract.test.sh`
- `bash tests/review-only-contract.test.sh`
- `bash tests/run-all.sh`
- `git diff --check`
