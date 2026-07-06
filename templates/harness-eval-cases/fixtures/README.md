# Runnable harness-eval fixtures

Clean-slate, dependency-free fixtures the harness eval can run directly (the RevFactory `.yaml`
files in the parent dir are specs; these are the executable cases). Each is `node --test`-runnable
and ships its visible + hidden suites. Validated to DISCRIMINATE before use (see each case below).

| fixture | tier | starter state | what the hidden suite catches |
|---|---|---|---|
| `revfactory-case-002-async-race/` | hard | visible pass, 2/5 hidden fail (the race) | in-flight dedupe, no over-serialization, concurrent-reject, no caching of failures |
| `revfactory-case-003-refactoring/` | medium | passes ALL (measures preservation) | every coupon/tax/shipping/VIP-floor/rounding edge survives the refactor |
| `underspec-001-deepmerge/` | under-specified | stub throws (greenfield) | deep merge, **prototype-pollution guard**, null source, type replacement |
| `underspec-002-csvline/` | under-specified | stub throws (greenfield) | quoted commas, escaped `""`, empty/trailing fields, quoted spaces |
| `underspec-003-authz-cache/` | under-specified hard-low-effort | visible pass, 1/8 hidden pass | tenant/user/action/version authz leaks, denied-decision staleness, in-flight dedupe |

## Discrimination property (validated)

- bug-fix (002): starter passes visible, fails the planted hidden; a correct fix passes all.
- refactor (003): starter passes ALL; a behavior-breaking refactor regresses a hidden check.
- greenfield (u1/u2): stub fails all; a reference impl passes all; a lazy impl
  (`{...t,...s}` / `split(',')`) fails the discriminating hidden checks.
- authz-cache (u3): starter and lazy impl pass visible 3/3 but hidden 1/8; reference passes hidden 8/8.

Re-validate any case with the no-codex path in its runner:

    SG_EVAL_VALIDATE=1 SG_EVAL_CASE=<002|003|u1|u3> node templates/harness-eval-cases/run-local-eval.mjs
    SG_EVAL_VALIDATE=1 SG_EVAL_CASE=<u1|u2> node templates/harness-eval-cases/run-underspec-n3.mjs

## Runners

- 002, 003, u1, u3: `templates/harness-eval-cases/run-local-eval.mjs`
- u1, u2 (+ equal-compute naive-loop arm): `templates/harness-eval-cases/run-underspec-n3.mjs`

Both runners originated in the 2026-06-07 experiments (medium-hard skill-vs-baseline and
underspecified-n3); the raw experiment dirs were removed 2026-07-06 - conclusions live in
`docs/experiments/README.md`.

Authored case specs (yaml) for the under-spec cases live in `../authored/`. The RevFactory case
specs stay at the corpus root; `revfactory-case-002/003` specs point here via `runnable_fixture:`.

## Key result (2026-06-07, gpt-5.5/low, n=3)

Only `underspec-001-deepmerge` separated baseline from harness: the baseline shipped a
prototype-pollution vuln as a false-GREEN; the harness critic caught it (3/3 seeds). All other
cases tied. See `docs/experiments/README.md` and `reference/harness-eval.md`.
