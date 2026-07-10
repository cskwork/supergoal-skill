# PROTOTYPE - throwaway proof before delivery

Use when the next delivery step depends on an unknown that is cheaper to test than debate: "prototype",
"spike", "try variants", "prove the approach", "compare UI flows", "test the state model", or "show me
which direction works". PROTOTYPE answers one question. It does not ship product code.

## Theory

The answer is the artifact. The prototype exists only to reduce uncertainty, then it is deleted,
quarantined, or selectively absorbed through GREENFIELD / DEBUG / LEGACY / WAYFINDER with normal proof gates.
Prototype shortcuts never bypass delivery verification.

## Frame

Before writing the prototype, record:

- `Question` - the single uncertainty being tested.
- `Decision signal` - what observation will answer it.
- `Prototype type` - logic/state, UI/interaction, data/API, or mixed.
- `Exit path` - delete, quarantine, or route to delivery if the answer is useful.

If the user asked for shippable work and no real uncertainty blocks delivery, skip PROTOTYPE and use the
normal mode.

## Build rules

- Keep it throwaway and isolated: temp dir, run vault, sandbox route, or local-only flag.
- Provide one command or one URL to run it.
- No production migrations, irreversible writes, secret use, analytics, billing, or external publishing.
- Prefer fixtures, mocks, read-only data, or sandbox credentials.
- Skip polish and broad tests; add only the checks needed to trust the answer.
- Surface state so the user can see the behavior, not only read a summary.

## Type-specific paths

Logic/state prototype:

- Isolate the logic in a small pure module or script.
- Drive it with a tiny CLI/TUI or fixture runner.
- Print state transitions and edge cases that decide the question.

UI/interaction prototype:

- Prefer an existing page behind a local query flag such as `?prototype=<name>`.
- If that is unsafe or impossible, create a local-only prototype route or standalone HTML.
- Default to three structurally different variants when comparing direction.
- Include a simple variant switcher and enough responsive behavior to judge the choice.
- Hide or remove the route before shipping; hidden prototype UI is not production readiness.

Data/API prototype:

- Use read-only or sandbox data.
- Never mutate production systems.
- Record sample shape and assumptions so delivery can replace fixtures with real integration.

## Capture

Write a short result note in the run vault or prototype folder:

- answer to the question,
- evidence command/browser result,
- what to keep,
- what to discard,
- recommended route if delivery should continue.

## Exit

Delete or quarantine the prototype before any final done claim. If the answer should become product, route
to GREENFIELD, DEBUG, LEGACY, or WAYFINDER and copy only the proven decision into `PLAN.md`; do not copy
prototype shortcuts, dead fixtures, hidden routes, or unverified assumptions.

PROTOTYPE cannot satisfy delivery `Done`. Done still requires the target mode's real tests, request/docs
trace, and exact verification.
