# Requirements: <feature name>

<!-- Spec phase 1 of 3 (requirements -> design -> tasks). Lives in the TARGET repo at
     docs/spec/<feature-slug>/requirements.md; contract in reference/spec.md.
     WHAT, not HOW - behaviors, never technologies. Approved before design starts.
     Crystallized inline during the grill: start as a skeleton, fill each section the
     moment its decision settles - do not draft the whole file autonomously.
     Every EARS statement uses Glossary terms verbatim; every criterion must be testable
     (no "fast", "easy", "user-friendly"). -->

## Introduction

<!-- 2-4 sentences: the feature, who it serves, the value it delivers. -->

## Glossary

<!-- Define each domain term once - one name per concept, no synonyms. -->

| Term | Definition |
|---|---|
| <term> | <one-line definition> |

## Requirements

### Requirement 1: <short behavior name>

**User story:** As a <role>, I want <feature>, so that <benefit>.

**Acceptance criteria (EARS):**
1. WHEN <event> THEN <system> SHALL <response>
2. IF <precondition> THEN <system> SHALL <response>
3. WHEN <event> AND <condition> THEN <system> SHALL <response>

**Edge cases:**
- <empty/null input, boundary, error/recovery path, authorization gap, concurrency - and the required behavior>

### Requirement 2: <next behavior>

<!-- Same three parts. Number requirements sequentially; tasks.md and tests reference these numbers. -->

## Non-functional requirements

- **Performance:** <measurable bound, e.g. p95 < 500ms at 100 concurrent users>
- **Security:** <authn/authz/data-handling rules>
- **Accessibility:** <standard, e.g. WCAG 2.1 AA>

## Out of scope

- <explicitly excluded behavior, so nobody builds or tests it>

## Open questions

- <unresolved, load-bearing question - becomes an interview question before approval>

<!-- Example:
### Requirement 1: File upload validation
**User story:** As a project member, I want oversized uploads rejected with a clear error, so that I know how to fix my file.
**Acceptance criteria (EARS):**
1. WHEN user uploads a file larger than 10MB THEN system SHALL reject it and display "file too large (max 10MB)"
2. IF user is not authenticated THEN system SHALL deny upload and prompt login
3. WHEN upload fails due to network error THEN system SHALL offer a retry option
**Edge cases:**
- Zero-byte file -> rejected as invalid, not uploaded as empty
- Duplicate filename -> prompt rename or replace, never silent overwrite
-->
