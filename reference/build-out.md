# BUILD-OUT - GREENFIELD full-app auto-continue

Use when a GREENFIELD request is a full application: the Frame scope gate produced a multi-ticket
`wayfinder/map.md` and the user asked to build the app, not one slice. The build request itself
authorizes continuous ticket-by-ticket progression; do not ask "continue?" between tickets.
Single-ticket delivery ignores this file.

## Control object

`wayfinder/map.md` is the cross-ticket state; the conductor's memory is not. Between tickets, re-read
the map - never rely on conductor context for ticket status; no implementation context crosses tickets.
Build-out adds two map sections:

- `Smoke ledger` - one re-runnable end-to-end check per closed ticket: boot command + proof
  command/route + its expected observable (status, text, or output). "Check it works" is not a check;
  write the literal command.
- `Design shell` - app-wide look-and-feel record (`reference/ui-ux.md`), written once by the first UI
  ticket.

Never remove or weaken a ticket acceptance check or Smoke-ledger line to make it pass; a red is fixed
or escalated as `ask-user` - the check stays.

## Vault layout

One app vault, one full run vault per delivered ticket:

```text
docs/changelog/<YYYY-MM>/<DD-topic>/   # app vault: app-level GOAL.md/PLAN.md + wayfinder/
  wayfinder/
    map.md                             # ticket graph, Smoke ledger, Design shell
    tickets/
  runs/<NNN-slug>/                     # per-ticket run vault: GOAL.md PLAN.md QA.md R-LOOP.md
                                       # run-state.json qa/ Z-<date>.md
```

Per-ticket commit gate: `bash templates/commit-gate.sh <app-vault>/runs/<NNN-slug> <browser|cli|none>`.
The app-level `GOAL.md` Success Criteria are one row per ticket closure plus one row for the final
assembled-app smoke; the app-level `Z-<date>.md` is written only when every ticket is closed and that
smoke is green - never earlier.

## Ticket 0 - walking skeleton

Fires only when the target repo has no manifest/lockfile (nothing to boot); otherwise skip.

- Stack selection runs at Frame inside the normal <=5-question budget (`reference/interview.md`): ask
  ONE stack question with a recommended default (framework + DB + package manager as one bundle).
  Prefer the user's named stack, else the stack of the user's adjacent repos/rules, else the mainstream
  default for the app class. Record the decision and rejected alternatives in `map.md`
  `Decisions so far`.
- Scaffold with the framework's official CLI generator; do not hand-roll a skeleton the generator
  provides.
- Ticket 0 acceptance checks (these seed the Smoke ledger): the app boots via one command; one
  end-to-end route/command works; the test command runs green; clean commit into the integration
  branch.
- Ticket 0 is a normal delivery ticket: full role-loop, own run vault, commit gate.

## Build order

Ticket 0 first. Then order the frontier so every ticket extends a BOOTABLE app: after each merge the
app boots and the Smoke ledger is green. Bootable-after-every-ticket is the milestone concept; do not
add a separate milestone layer.

## Conductor loop

The conductor plans, routes, and verifies; it never implements. All ticket work runs in fresh-context
role subagents (`reference/role-loop.md`) briefed only by that ticket's run vault - the
one-ticket-per-context rule holds because no implementation context crosses tickets. If the harness
supports delegating a whole ticket to one agent, prefer one delivery agent per ticket.

Per ticket:

1. Re-read `map.md`; pick the next unblocked frontier ticket.
2. New worktree from the CURRENT integration branch (tickets stack) + new run vault
   `runs/<NNN-slug>/`; copy only that ticket's acceptance checks into its `GOAL.md` / `PLAN.md`.
3. Per-ticket plan approval: `Status: auto-approved (build-out: app plan approved at map freeze)` -
   the blocking user approval happened once, at map freeze - the app-level plan approval gate clearing
   after `map.md` is finalized.
4. Run the full role-loop; per-ticket `max_iterations` stays 8.
5. Integration boot smoke (below); green -> commit gate -> merge into the integration branch -> mark
   the ticket `closed` in `map.md`, append its Smoke-ledger line, recompute the frontier. Record any
   newly settled repo convention (layout, naming, commands) in `map.md` `Decisions so far` or the
   repo's agent context file (e.g. AGENTS.md), so later tickets do not re-derive it.
6. Continue with the next frontier ticket.

## Integration boot smoke

After each ticket's Exact Verify and before its merge is declared done: boot the assembled app
(integration branch + this ticket) and re-run EVERY Smoke-ledger line plus the new ticket's line.
Record results in the ticket's `QA.md` `## Results`. A red ledger line is a cross-ticket regression:
route a DEBUG re-entry for the offending ticket (own run vault under `runs/`), capped like any run; do
not select the next frontier while the ledger is red. Keep the ledger cheap: one boot + one proof
command/route per ticket - a regression tripwire, not a second QA pass.

Smoke evidence counts only if produced after the last edit; re-run, never reuse. Tear down whatever the
smoke spawned (server, port, tmux session, temp dir) and record the teardown in `QA.md` `## Results`;
leftover runtime state blocks the ticket close.

## Stop conditions

Stop the loop and report (closed tickets, ledger status, next frontier) only when:

- every ticket is closed and the final smoke is green - record its command and result in the
  app-level `Z-<date>.md`;
- an `ask-user` decision gate opens anywhere;
- a ticket fails its commit gate or goes red twice (gate or ledger - two strikes, ask);
- a hard stop applies (destructive step, external push/publish);
- conductor context is running out - finish at the ticket boundary, write `next_action` into `map.md`
  and the app `run-state.json`, ask the user to resume fresh (resume re-reads the map first).

The map-freeze approval covers per-ticket merges into the integration branch; pushing or publishing
anywhere external still needs explicit consent.
