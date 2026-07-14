# R-LOOP

## 2026-07-14T13:49:06Z - final adversarial verify findings

- [ ] Criterion 3: Diff operation kinds, identity modes, ignores, paths, and typed values. Expected: key-identity moves must be represented by generated patches and applied. Actual: `diffElement` emits `OpMove`, but `GeneratePatch` and `ApplyPatch` have no move handling. Evidence: `diff.go:239-241`, `diff.go:390-429`; QA review.
- [ ] Criterion 4: Generate/apply/reverse patches, positional/text/attribute handling, and nil errors. Expected: root add/remove/replace and reverse element-add patches must be reversible. Actual: `ApplyPatch` ignores root removal/replacement because it requires a parent; reverse of an element add retains the parent selector and removes the parent. Evidence: `diff.go:502-520`, `diff.go:587-596`.
- [ ] Criterion 5: Merge conflicts, resolutions, auto-merge, and metadata. Expected: parent removal versus descendant text/attribute modification is a modify-delete conflict, and custom auto-resolution is applied. Actual: `operationsConflict` excludes descendant text/attribute modifications; `Merge3Way` stores but never applies `ResolutionCustom`. Evidence: `diff.go:724-756`, `diff.go:764-771`.
- [ ] Criterion 2: Recursive namespace/attribute/text/child equality and nil safety. Expected: focused coverage proves all requested structural dimensions. Actual: available tests cover nil safety and round-trip equality but do not directly exercise namespace and all token/attribute edge cases. Evidence: `diff_test.go:5-30`; QA review.
- [ ] Criterion 6: Summary and Document convenience methods. Expected: complete API behavior remains proven end-to-end. Actual: summary/convenience smoke coverage passes, but it is withheld while the underlying patch/merge paths remain incomplete. Evidence: `diff_test.go:32-58`; QA review.

Smallest next fix: add focused failing tests for the listed root, move, reverse-add, modify/delete, and custom-resolution cases; then implement only the corresponding selector, patch, and merge changes and rerun the exact QA commands.
