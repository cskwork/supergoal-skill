## Intent

Deliver the requested XML diffing, patching, reversing, summaries, and three-way merge APIs in the etree package. Keep the change self-contained and compatible with the existing token tree. Rejected alternatives: changing the existing XPath parser or replacing etree's token model; both would expand blast radius without being required. Promise: all acceptance checks are proven by focused tests plus the existing suite, then one task-branch commit. Stop after green verification, or at max_iterations 3 with an explicit blocker.

## Approval

Status: auto-approved
Reason: autonomous SG-EVAL run; the request is explicit and the conservative choices are recorded in GOAL.md.
plan_approval: "auto"

## Steps

1. Add `Metadata` to `Document`, initialize/copy it safely, and add equality, operation types, options, summaries, and convenience method declarations. Check with compile-focused tests.
2. Implement deterministic element paths, recursive diff identity matching, and operation generation. Check with table-driven diff tests for position/key/hash, ignore flags, attrs/text, replace, add, remove, and move.
3. Implement patch document generation/application and reverse patch. Check serialized patch shape plus copy-and-apply round trips and nil errors.
4. Implement three-way merge and conflict resolution/metadata. Check non-overlap, both-modified, modify-delete, structural conflicts, auto-resolution, and nil errors.
5. Run gofmt, focused tests, full suite, and vet; inspect diff for scope and commit the branch.

## Tools & Skills

- Use existing etree `Element`, `Token`, `Copy`, `FindElement`, `AddChild`, `InsertChildAt`, `RemoveChildAt`, `CreateAttr`, and `SetText` behavior.
- Use `GOCACHE=/tmp/sg-gocache go test ./...`, `GOCACHE=/tmp/sg-gocache go vet ./...`, and `gofmt -w` on changed Go files.
- Keep source changes in the repository; never place vault files in git.

## Acceptance checklist

- [ ] Element equality compares namespace/tag, attrs, text, recursive children, and nil receivers; verified by focused Go tests.
- [ ] Diff emits all requested operation types, path/value semantics, identity modes, ignored fields, whitespace/order behavior, and moves; verified by focused Go tests.
- [ ] GeneratePatch emits the required namespace, selectors, positional predicates, append behavior, text/attribute forms; verified by serialized XML tests.
- [ ] ApplyPatch applies add/remove/replace/text/attribute operations and rejects nil documents; verified by round-trip tests.
- [ ] ReversePatch inverts required operation forms and order and rejects nil; verified by round-trip/shape tests.
- [ ] Merge3Way combines non-conflicting changes, reports typed conflicts, resolves configured conflicts, records root-tag metadata, and rejects nil; verified by focused tests.
- [ ] DiffSummary counts additions/removals/modifications/moves and formats exactly; verified by unit tests.
- [ ] Document Metadata is initialized/preserved appropriately and convenience methods delegate correctly; verified by unit tests.
- [ ] Existing etree tests remain green with no unrelated behavior drift; verified with `GOCACHE=/tmp/sg-gocache go test ./...`.
- [x] Public APIs have Go documentation and `gofmt`/`go vet` pass; verified by `TestDiffPublicDeclarationsHaveGoDocs`, `GOCACHE=/tmp/sg-gocache go vet ./...`, and the full suite.
