## Iteration 1

No verifier findings yet.

## Iteration 1 — verifier findings (2026-07-14)

- [ ] Criteria 1–8: the requested public diff/patch/merge/equality/summary APIs are absent; `go test ./...` fails to compile `diff_test.go` with undefined `Diff`, `DefaultDiffOptions`, `GeneratePatch`, `ApplyPatch`, `ElementsDeepEqual`, `Element.DeepEqual`, and `Merge3Way`. Evidence: verifier command output in this pass; repository has no `diff.go` and `rg` finds only test references. Smallest fix: implement the complete API in a cohesive `diff.go`, then add focused tests for each criterion.
- [ ] Criterion 9: full existing suite is not green because the added tests cannot compile. Evidence: `GOCACHE=/tmp/sg-gocache go test ./...` exited 1.
- [ ] Criterion 10: static verification is not green because the requested APIs are absent. Evidence: `GOCACHE=/tmp/sg-gocache go vet ./...` exited 1 at `diff_test.go:17`.
- [ ] Branch closeout: source changes are uncommitted and only `etree.go` plus untracked `diff_test.go` are present; no implementation commit exists. Smallest fix: implement, format, verify, and commit source/tests on `feat/xml-diff-patch`.

## Iteration 2 — verifier findings (2026-07-14)

- [ ] Surfaced criterion 11: newly exported diff/patch/merge declarations in `diff.go` have no Go doc comments. Evidence: `rg -n '^// ' diff.go` returns no matches, while exported declarations include `OpType`, `DiffOperation`, `Diff`, `GeneratePatch`, `ApplyPatch`, `ReversePatch`, `Merge3Way`, `DiffSummary`, `MergeConflict`, and document convenience methods. Smallest fix: add concise Go doc comments to every newly exported declaration, then run a documentation-aware check and the full suite.

## Iteration 3 — verifier findings (2026-07-14)

- [ ] Criteria 1–8: the checked-in tests do not cover the full requested identity modes, positional selectors, attribute/text inversion forms, conflict classes, independent structural merges, or summary/convenience semantics. Evidence: `diff_test.go` contains only six focused tests and the `-tags diff` command uses the same checkout without the separate task-test patch. Smallest fix: add red-first focused tests for each uncovered requirement, then implement the smallest fixes exposed by those tests.
- [ ] Surfaced criterion 12: independent additions under one parent must not be treated as conflicting. Evidence: `Diff` emits `OpAdd.Path` as the parent path, while `operationsConflict` returns true immediately when `a.Path == b.Path`; two sibling additions therefore share a path and are classified as a conflict. Smallest fix: distinguish sibling additions by element identity/content, then add a focused three-way merge test proving both additions are applied.
