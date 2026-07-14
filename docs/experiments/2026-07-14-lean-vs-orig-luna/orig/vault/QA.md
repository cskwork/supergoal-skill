# QA - etree XML diff, patch, and merge

## Before

- [x] Requested symbols were absent at baseline; the implementation is present in `diff.go` and `Document.Metadata` is present in `etree.go`.

## Adversarial review

- Root `OpRemove` and root `OpReplace` cannot be applied: `ApplyPatch` only mutates elements when `Parent() != nil` (`diff.go:502-520`), so root changes are silently ignored.
- `OpMove` is emitted for key-identity reordering (`diff.go:239-241`) but `GeneratePatch` has no `OpMove` case (`diff.go:390-429`) and `ApplyPatch` has no move handling; a generated patch therefore cannot realize the requested move.
- Reversing an element `<add sel="/root">` leaves the selector unchanged and changes only the tag to `remove` (`diff.go:587-596`); applying it removes `/root`, not the appended child.
- Merge conflict detection does not classify a parent removal against a descendant text/attribute modification: `operationsConflict` only returns true for descendant structural add/remove operations (`diff.go:764-771`).
- Merge `ResolutionCustom` is stored by `MergeConflict.Resolve` but `Merge3Way` never applies the custom value when auto-resolving (`diff.go:724-756`).
- The checked-in focused tests do not cover these paths, so the green suite is insufficient for full-spec completion.

## Decision gates

- Module-mode test blocker from the previous QA was stale: the required command now passes.
- No source edits were made during this verifier pass.
- Completion gate: RED because full patch reversibility, move application, and merge conflict semantics are not proven and have concrete implementation gaps.

## Residual risk

- Root-level document transitions, key-identity moves, reverse patches for appended elements, descendant modify/delete conflicts, and custom merge resolution remain unverified or incorrect.
- Existing tests cover basic equality, text/attribute changes, append/remove round trips, content-hash order, summaries, and metadata only.

## Commands

- `GOCACHE=/tmp/sg-gocache go test ./...` -> PASS (`ok github.com/beevik/etree (cached)`).
- `GO111MODULE=off GOCACHE=/tmp/sg-gocache go test ./...` -> PASS (`ok _/private/tmp/.../app 0.355s`).
- `git diff --check` -> PASS.
- `gofmt -d etree.go diff.go diff_test.go` -> PASS; no diff output. The mutating `gofmt -w` command was not run because this is a no-source-edit verifier pass.
- `git status --short` -> PASS; clean working tree.
- `git diff --stat main...HEAD` -> `diff.go 794 +`, `diff_test.go 180 +`, `etree.go 9 changed`; 982 insertions and 1 deletion.
- `git log --oneline --decorate -2` -> `294d5d1 (HEAD -> feat/xml-diff-patch-merge) Harden XML diff and reverse patch edge cases`; `ce5bbd5 Improve XML diff patch and merge behavior`.

## Results

- [x] New branch from main and task commits are present; verified by branch, clean status, and commit log.
- [ ] Recursive namespace/attribute/text/child equality and nil safety are not fully proven by focused coverage; current targeted tests and the full suite pass.
- [ ] Diff operation kinds, identity modes, ignores, paths, and typed values are not complete; move operations are emitted but not represented in generated/applied patches.
- [ ] Generate/apply/reverse patches, positional/text/attribute handling, and nil errors are not complete; root changes and reverse element adds have concrete failures.
- [ ] Merge conflicts, resolutions, auto-merge, and metadata are not complete; descendant modify/delete conflicts and custom resolution are not applied.
- [ ] Summary and Document convenience methods pass the available tests, but the criterion is withheld because the API is part of the incomplete end-to-end behavior.
- [x] Existing tests, formatting, whitespace checks, branch cleanliness, and scope inspection pass.
Verdict: RED
