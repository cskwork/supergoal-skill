#!/usr/bin/env node
// /supergoal cycle bound — makes "max N cycles per phase -> stop" machine-checkable.
//
// The circuit breaker (circuit-breaker.mjs) only trips on the SAME error 3x. A retry loop that fails
// with a DIFFERENT error each cycle never trips it and would run unbounded. This bound caps the total
// number of attempts in a phase regardless of whether the errors repeat.
//
// Usage: node cycle-bound.mjs <state.json> <phase>
//   <state.json>  the run's state file
//   <phase>       the phase being retried, e.g. build | fix | verify | qa (a key in state.cycles)
//
// Behavior: increments state.cycles[<phase>], persists, and exits 1 (TRIP) once that count reaches
// state.max_cycles_per_phase (default 5). On a trip the orchestrator must STOP retrying this phase,
// write the blocker to the run's README.md, and escalate to the user.
// Exit 2 = bad usage / unknown phase. Exit 0 = recorded, below the bound.

import { readFileSync, writeFileSync } from "node:fs";

const [statePath, rawPhase] = process.argv.slice(2);
if (!statePath || !rawPhase) {
  console.error("usage: cycle-bound.mjs <state.json> <phase>");
  process.exit(2);
}
const phase = rawPhase.trim().toLowerCase();
if (!phase) {
  console.error("cycle-bound: phase is empty");
  process.exit(2);
}

let state;
try {
  state = JSON.parse(readFileSync(statePath, "utf8"));
} catch (err) {
  console.error(`cycle-bound: cannot read/parse ${statePath}: ${err.message}`);
  process.exit(2);
}

state.cycles = state.cycles || {};
if (!(phase in state.cycles)) {
  console.error(
    `cycle-bound: unknown phase "${phase}" — expected one of: ${Object.keys(state.cycles).join(", ") || "(none defined)"}`
  );
  process.exit(2);
}

const bound = Number.isInteger(state.max_cycles_per_phase) ? state.max_cycles_per_phase : 5;
const count = (state.cycles[phase] || 0) + 1;
state.cycles[phase] = count;
writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");

if (count >= bound) {
  console.log(
    `CYCLE-BOUND TRIP: phase "${phase}" hit ${count} cycles (>= ${bound}) — ` +
      `stop retrying this phase, write the blocker to README.md, escalate to the user.`
  );
  process.exit(1);
}
console.log(`cycle-bound: phase "${phase}" cycle ${count}/${bound} — may retry`);
process.exit(0);
