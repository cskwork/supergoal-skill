# Surfaced requirements

Implicit requirements the prompt never stated, surfaced by the role-loop critic and turned into failing
tests. The critic appends one dated section per task (status: open); the verifier marks each fixed.
This is the human-readable trail of what the prompt left implicit - the tests are the machine-checkable
form, this file is the why.

<!-- One section per task. Keep entries terse: requirement / why implied / covering test / status. -->

## YYYY-MM-DD - <task one-liner>

- **<requirement, stated as the behavior>** - implied by <reason it is required though unstated>;
  covered by `<test file::test name>`; status: open
- **<next requirement>** - implied by <reason>; covered by `<test>`; status: open

<!-- Example:
## 2026-06-07 - deepMerge(target, source)
- **Guard prototype-pollution keys (`__proto__`/`constructor`/`prototype`)** - implied because a merge over
  untrusted input must not mutate Object.prototype; covered by `test/merge.hidden.test.mjs::does not pollute
  via a __proto__ key`; status: fixed
- **Treat null/undefined source as a no-op** - implied because a merge utility must not throw on absent
  input; covered by `test/merge.hidden.test.mjs::null or undefined source`; status: fixed
-->
