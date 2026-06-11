# Tasks: <feature name>

<!-- Spec phase 3 of 3. Checkbox implementation plan - written only after design.md is
     approved; contract in reference/spec.md. Build executes top-to-bottom; check off each
     task as its tests pass. Coding tasks only, each small enough to verify independently.
     _Requirements: N.N_ refs must resolve to requirements.md numbers. When implementation
     reveals a gap, ADD a task - never silently skip or reorder. -->

- [ ] 1. <Epic / major component>
- [ ] 1.1 <specific implementation task>
  - <what to implement>
  - <files to create/modify>
  - <tests to write>
  - _Requirements: <N.N, N.N>_
- [ ] 1.2 <next task>
  - <details>
  - _Requirements: <N.N>_

- [ ] 2. <Next epic>
- [ ] 2.1 <task>
  - <details>
  - _Requirements: <N.N>_

<!-- Example:
- [ ] 1. Upload validation foundation
- [ ] 1.1 Create upload validator with size/type rules
  - Implement validateUpload(file): size <= 10MB, allowed types list
  - Files: src/upload/validator.ts, test/upload/validator.test.ts
  - Tests: oversize rejected with exact message; zero-byte rejected; allowed type passes
  - _Requirements: 1.1, 1.4_
- [ ] 1.2 Wire validator into upload endpoint
  - Reject before storage write; return 413 with error body
  - Files: src/api/upload.ts, test/api/upload.test.ts
  - Tests: unauthenticated 401; network-failure path returns retryable error
  - _Requirements: 1.2, 1.3_
-->
