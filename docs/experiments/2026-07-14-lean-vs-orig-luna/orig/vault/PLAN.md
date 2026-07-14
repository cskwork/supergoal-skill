# PLAN - etree XML diff, patch, and merge

## Approval

- Status: auto-approved
- Record: 2026-07-14; autonomous harness run: auto-approved

## Intent

- Goal / constraints / tradeoffs / rejected approaches: implement the requested public API with minimal cohesive Go changes, reuse etree constructors/token bookkeeping/serialization, avoid dependencies and unrelated refactors. Use a direct tree walker for identity rules rather than overloading the limited XPath parser. Conservative reversible defaults resolve unavailable choices.
- Completion promise: committed source/tests prove every checklist item; stop after focused and full tests, diff checks, and clean branch evidence. `max_iterations`: 8.

## Steps

1. Inspect existing Document/Element constructors, token mutation, cloning, text, attribute, and path APIs.
2. Add equality, diff models/options/operations, and summaries with focused tests.
3. Add patch XML generation/application/reversal for element/text/attribute/position cases.
4. Add three-way conflict classification/resolution, metadata, and convenience methods.
5. Format, run targeted/full tests, inspect scope, and commit on the task branch.

## Acceptance checklist

- [ ] Recursive namespace/attribute/text/child equality and nil safety.
- [ ] Diff operation kinds, identity modes, ignores, paths, and typed values.
- [ ] Generate/apply/reverse patches, positional/text/attribute handling, nil errors.
- [ ] Merge conflicts, resolutions, auto-merge, and metadata.
- [ ] Summary and Document convenience methods.
- [ ] Existing tests green and scope minimal.

## Tools & Skills

- Use codebase-memory MCP first; fall back to `rg` and direct reads if unavailable.
- Use existing Go package APIs; no external libraries.
- Run `gofmt -w <changed .go files>` and `GOCACHE=/tmp/sg-gocache go test ./...`.
- Before commit run `git diff --check`, `git status --short`, and `git diff --stat main...HEAD`.

## Verification strategy

- Before proof: baseline `GOCACHE=/tmp/sg-gocache go test ./...` and absent requested symbols.
- Steps 2-4 prove GOAL criteria 2-6; step 5 proves criteria 1 and 7.
- Trusted commands: `GOCACHE=/tmp/sg-gocache go test ./...`, `git diff --check`, `git diff --stat main...HEAD`.

## Grounding ledger

- Existing tree model in `etree.go`, `path.go`, and tests -> preserve native ownership/index semantics.
- Generated selectors are XPath-like but parser is limited -> direct resolver handles documented generated forms.
