# REVIEW-ONLY mode - findings, not fixes

Use when the user wants a code review or audit and explicitly wants no changes: "review this
code/diff/PR", "audit this module", "find issues", "코드 리뷰만", "고치지는 말고 봐줘". The deliverable
is an evidence-backed findings report. It writes NO source or test edits - read-only except the run
folder. If the user wants the findings fixed, that is a new objective: route to DEBUG/LEGACY with the
report as the Frame input.

## Frame (one line)

Name the review target (working diff, branch vs base, PR number, or files), the base it is compared
against, and the depth the user asked for (quick pass vs thorough audit).

## Dispatch - independent reviewers in parallel

- `agents/code-reviewer.md` in **Spec axis** findings-only stance: request/docs, issue/PRD, `GOAL.md`
  if present, diff, tests, missing requirements, partial behavior, wrong behavior, and scope creep. In this
  mode it does NOT write failing test files; each untested required behavior becomes a finding that names
  the missing test it would write (file, behavior, edge).
- `agents/code-reviewer.md` in **Standards axis** findings-only stance: repo standards, standing rules,
  surrounding style, test design, readability, error handling, dead code, maintainability, and the fixed
  smell baseline in `agents/code-reviewer.md`. Documented repo rules override smell findings; smell
  findings are judgment calls.
- `agents/security-reviewer.md`: secrets, injection, SSRF/XSS, auth, unsafe crypto, input validation.

Both read request/docs and repo/data rules (`reference/domain-context.md`, `domain-rules.md`) so
findings are judged against what the project requires, not generic style taste. Keep Standards, Spec, and
Security reports separate; do not merge or rerank them.

## Verify findings before reporting

Every CRITICAL/HIGH finding is re-checked against the cited code (re-read the lines; run the cited
test or command when one exists) before it enters the report. Drop or downgrade anything you cannot
back with evidence - a plausible-but-unverified finding is the failure mode. Findings never override
a passing real test; they explain why the test is insufficient instead.

## Report (the one deliverable)

Write `report.md` in the run vault (`docs/changelog/<YYYY-MM>/<DD-review-topic>/`):

- `Target:` what was reviewed and against which base.
- `## Standards`: findings grouped CRITICAL / HIGH / MEDIUM / LOW, each with file:line, cited standard or
  smell name, what is wrong, why it matters here, and a concrete fix suggestion (suggestion only - not
  applied).
- `## Spec`: findings grouped CRITICAL / HIGH / MEDIUM / LOW, each with file:line, cited spec/source line,
  what is missing/wrong/extra, why it matters here, and a concrete fix suggestion.
- `## Security`: findings grouped CRITICAL / HIGH / MEDIUM / LOW, each with file:line, vulnerability class,
  exploit/impact, and a concrete fix suggestion.
- `Untested behaviors:` the missing-test findings from the critic stance.
- `Not covered:` what the review did not look at, so silence is not read as approval.

## Exit

Report delivered; repo untouched (`git status` clean except the vault). Offer the route: "to fix
these, run DEBUG/LEGACY with this report as input" - do not start fixing in this mode.
