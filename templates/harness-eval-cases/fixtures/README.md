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

## Discrimination property (validated)

- bug-fix (002): starter passes visible, fails the planted hidden; a correct fix passes all.
- refactor (003): starter passes ALL; a behavior-breaking refactor regresses a hidden check.
- greenfield (u1/u2): stub fails all; a reference impl passes all; a lazy impl
  (`{...t,...s}` / `split(',')`) fails the discriminating hidden checks.

Re-validate any case with the no-codex path in its origin runner:

    SG_EVAL_VALIDATE=1 SG_EVAL_CASE=<002|003|u1|u2> node <origin run.mjs>

## Origins

- 002, 003: `docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs`
- u1, u2:   `docs/experiments/2026-06-07-harness-eval-underspecified-n3/run.mjs`

Authored case specs (yaml) for the under-spec cases live in `../authored/`. The RevFactory case
specs stay at the corpus root; `revfactory-case-002/003` specs point here via `runnable_fixture:`.

## Key result (2026-06-07, gpt-5.5/low, n=3)

Only `underspec-001-deepmerge` separated baseline from harness: the baseline shipped a
prototype-pollution vuln as a false-GREEN; the harness critic caught it (3/3 seeds). All other
cases tied. See the experiments' `results.md` and `reference/harness-eval.md`.
