# Supergoal Delivery-Gate Effect Eval

Date: 2026-06-28

Question: did the Before/After Eval patch improve `supergoal` skill-use quality on actual code feature
or bug-fix work?

Answer: **partially proven**. The patch improved proof quality in the controlled sample. It did **not**
prove a correctness lift over exact pre-patch `HEAD` on the two tasks, because both pre-patch and
current-patch arms passed the canonical hidden suites.

## Design

Two real runnable fixtures were used:

- GREENFIELD feature: `templates/harness-eval-cases/fixtures/underspec-001-deepmerge`
- DEBUG bug fix: `templates/harness-eval-cases/fixtures/revfactory-case-002-async-race`

Controlled comparison:

- Baseline: `git archive HEAD` from before the current uncommitted delivery-gate patch.
- Treatment: current working tree with `reference/delivery-gate.md` and `templates/delivery-proof.md`.
- Each arm received the same task wording and a clean visible-test sandbox.
- Hidden tests were injected only into scoring copies after each arm finished.

Secondary runtime smoke:

- Baseline: stale installed copy at `/Users/danny/.agents/skills/supergoal`.
- Treatment: current repo path.
- This is not patch-only proof because the installed copy is stale and differs from exact pre-patch
  `HEAD`.

## Results

| Case | Arm | Hidden score | Full scored suite | Delivery proof | Required proof sections |
|---|---:|---:|---:|---:|---:|
| underspec-deepmerge | pre-patch `HEAD` | 4/4 | 9 pass, 0 fail | no | 0/7 |
| underspec-deepmerge | current patch | 4/4 | 9 pass, 0 fail | yes | 7/7 |
| async-race | pre-patch `HEAD` | 5/5 | 11 pass, 0 fail | no | 0/7 |
| async-race | current patch | 5/5 | 13 pass, 0 fail | yes | 7/7 |

Required proof sections:

- Eval Intent
- Before State
- After Target
- Command Manifest
- Decision Gates
- After Evidence
- Residual Risk

## Evidence Snippets

Controlled GREENFIELD scored logs:

- Pre-patch: `raw/iteration2-underspec-deepmerge-pre-patch-score.log`
  - `# tests 9`
  - `# pass 9`
  - `# fail 0`
- Current patch: `raw/iteration2-underspec-deepmerge-current-patch-score.log`
  - `# tests 9`
  - `# pass 9`
  - `# fail 0`

Controlled DEBUG scored logs:

- Pre-patch: `raw/iteration2-async-race-pre-patch-score.log`
  - `# tests 11`
  - `# pass 11`
  - `# fail 0`
- Current patch: `raw/iteration2-async-race-current-patch-score.log`
  - `# tests 13`
  - `# pass 13`
  - `# fail 0`

Proof artifact contrast:

- Pre-patch GREENFIELD proof: `raw/iteration2-underspec-deepmerge-pre-patch-proof.md`
  - Has frame/code-map/verification, but no strict delivery-proof ledger.
- Current GREENFIELD proof: `raw/iteration2-underspec-deepmerge-current-patch-delivery-proof.md`
  - Has all required Before/After Eval sections.
- Pre-patch DEBUG proof: `raw/iteration2-async-race-pre-patch-proof.md`
  - Has theory/red/green, but no command source classification, decision gates, or residual risk ledger.
- Current DEBUG proof: `raw/iteration2-async-race-current-patch-delivery-proof.md`
  - Has all required Before/After Eval sections.

## Installed-Copy Caveat

The global installed copies are plain directories, not symlinks:

- `/Users/danny/.agents/skills/supergoal`
- `/Users/danny/.codex/skills/supergoal`
- `/Users/danny/.claude/skills/supergoal`

They did not contain the new `delivery-gate` wording during this eval. That means the patch improves
direct use of this repo path, but normal global skill invocation will not get the improvement until the
install copies are synced.

The stale installed-copy smoke also showed a correctness difference on deep-merge:

- Installed old copy: `raw/iteration1-installed-old-deepmerge-score.log`
  - `# tests 8`
  - `# pass 7`
  - `# fail 1`
  - failed `null or undefined source returns the target values unchanged`
- Current repo path: `raw/iteration1-repo-new-deepmerge-score.log`
  - `# tests 7`
  - `# pass 7`
  - `# fail 0`

Treat that as runtime-risk evidence, not a clean patch-only correctness claim.

## Decision

Accepted claim:

- The delivery-gate patch improves skill-use **evidence quality** on real GREENFIELD and DEBUG code tasks:
  the current-patch arms consistently produced a complete Before/After Eval ledger while exact pre-patch
  arms did not.

Rejected claim:

- The delivery-gate patch is not yet proven to improve general code correctness over exact pre-patch
  `HEAD`, because the controlled correctness result tied at 2/2 cases.

Next proof step:

- Run a larger n>=8 fixture set and include a brownfield preservation/refactor fixture. Report separately:
  correctness, proof quality, false-green rate, and cost.
