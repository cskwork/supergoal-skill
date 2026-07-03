# Surfaced requirements

Implicit `must` requirements the prompt never stated, surfaced by the role-loop critic and turned into
failing tests. Lives in the run vault (`docs/changelog/<YYYY-MM>/<DD-topic>/surfaced-requirements.md`),
one file per run alongside the run's other evidence. The critic writes this run's required behavior
(status: open); the verifier marks each fixed. Ambiguous or product-changing semantics are `ask-user`
decision gates, not surfaced requirements with generated tests. This is the human-readable trail of what
the prompt left implicit - the tests are the machine-checkable form, this file is the why.

<!-- One dated heading for this run. Keep entries terse: requirement / classification / why implied / covering test / status. -->

## YYYY-MM-DD - <task one-liner>

- **<requirement, stated as the behavior>** - classification: must; implied by <reason it is required
  though unstated>; covered by `<test file::test name>`; status: open
- **<next requirement>** - classification: must; implied by <reason>; covered by `<test>`; status: open

Ambiguous/product-changing candidates: record these as `ask-user` decision gates in `delivery-proof.md`,
not here, unless the human decision makes them required.

<!-- Example:
## 2026-06-07 - deepMerge(target, source)
- **Guard prototype-pollution keys (`__proto__`/`constructor`/`prototype`)** - classification: must;
  implied because a merge over untrusted input must not mutate Object.prototype; covered by
  `test/merge.hidden.test.mjs::does not pollute via a __proto__ key`; status: fixed
-->
