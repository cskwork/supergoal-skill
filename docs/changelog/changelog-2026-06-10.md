# Changelog 2026-06-10

## Run-vault doc layout: month-grouped + surfaced-requirements unified into the vault

### Why
The role-loop critic logged hidden requirements to a flat, globally-accumulating
`docs/surfaced-requirements.md`, while every other per-run artifact lived in the date-prefixed run vault
`docs/changelog/<date>-<slug>/`. Same lifecycle (one task's evidence), two inconsistent homes — and a flat
`changelog/` grows unbounded over time.

### Decision
- Run-vault path: `docs/changelog/<date>-<slug>/` -> `docs/changelog/<YYYY-MM>/<DD-topic>/`
  (month folder, then day-of-month + kebab topic, e.g. `docs/changelog/2026-06/10-add-auth/`).
  Kept the `changelog/` namespace so run vaults don't pollute `docs/` root (DESIGN.md, index.html,
  experiments/) and stay co-located with the existing `changelog-<date>.md` entries.
- `docs/surfaced-requirements.md` (flat, global, accumulating) -> per-run
  `docs/changelog/<YYYY-MM>/<DD-topic>/surfaced-requirements.md`, one file per run alongside the run's
  other evidence. Semantic shift: no longer a cross-run accumulator; each run owns its own file.
- QA vault: `docs/changelog/<date>-qa-<slug>/` -> `docs/changelog/<YYYY-MM>/<DD-qa-topic>/`.
- harness-eval `persist_path`: `docs/changelog/<date>-harness-eval/` -> `docs/changelog/<YYYY-MM>/<DD-harness-eval>/`.

### Files
- Canonical definition: `reference/domain-context.md` (vault path + names the vault files).
- `SKILL.md`, `reference/role-loop.md` (3 refs), `templates/surfaced-requirements.md` (header reworded
  flat-global -> per-run-in-vault).
- `reference/qa-only.md`, `templates/qa-gate.sh`, `templates/qa-only-gate.sh` (example comments).
- `templates/harness-eval-case.yaml` + `templates/harness-eval-cases/*.yaml` (16 files, uniform sed).

### Not touched
- Existing history `docs/changelog/2026-05-30-*`, `2026-05-31-*`, and `changelog-<date>.md` are past
  records, left as-is; the new convention applies to future runs.
- `README.md`/`README.ko.md` describe `docs/` layout only at the `changelog/` level (still accurate) —
  no per-run sub-path stated, so no change.

### Verified
- `grep`: zero remaining old-convention refs (`docs/surfaced-requirements.md`, `<date>-<slug>`,
  `<date>-qa`, `<date>-harness`) in instruction/template files.
- `bash -n` on both gate scripts: OK. All 16 harness-eval YAMLs parse (`yaml.safe_load`).
