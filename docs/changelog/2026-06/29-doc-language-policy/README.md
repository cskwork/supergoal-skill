# Docs Language Policy

## Decision

Persistent repo docs should follow the target codebase's existing docs language, not the agent's default
English and not only the user's chat language.

## Why

The skill already kept machine-checked anchors in English, but prose artifacts such as `docs/spec/**`,
`docs/changelog/**`, QA reports, and `.domain-agent/**` could still drift to English in Korean-first
codebases. Matching the dominant docs language keeps new run records readable beside the repo's existing
documentation.

## Rejected Alternatives

- Always use English: rejected because it creates mixed-language docs in Korean-first repos.
- Always use the user's latest chat language: rejected because repo docs may have an established language
  that future maintainers expect.
- Translate gate anchors: rejected because existing shell gates grep exact headings and markers.

## Verification

- `git diff --check` passed.
- Focused contract tests passed: `workflow`, `spec`, `arch`, `qa-only`, `learn-domain`, and
  `domain-context`.
- `bash tests/run-all.sh` passed.
