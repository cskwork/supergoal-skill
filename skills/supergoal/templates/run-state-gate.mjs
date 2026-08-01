#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const path = process.argv[2];

if (!path) {
  console.error("usage: run-state-gate.mjs <run-state.json>");
  process.exit(2);
}

function fail(message) {
  console.error(`RUN-STATE GATE FAIL: ${message}`);
  process.exit(1);
}

let state;
try {
  state = JSON.parse(await readFile(path, "utf8"));
} catch (error) {
  if (error?.code === "ENOENT") fail("run-state.json missing");
  fail(`cannot parse run-state.json: ${error.message}`);
}

if (!state || Array.isArray(state) || typeof state !== "object") {
  fail("run-state.json root must be an object");
}
if (state.schema_version !== 3) fail("schema_version must be 3");
if (!["GREENFIELD", "DEBUG", "LEGACY"].includes(state.mode)) {
  fail("mode must be GREENFIELD, DEBUG, or LEGACY");
}
if (!state.branches || typeof state.branches !== "object") {
  fail("branches must be an object");
}
for (const key of ["source_base_branch", "target_integration_branch", "run_branch", "worktree_path"]) {
  if (typeof state.branches[key] !== "string" || state.branches[key].trim() === "") {
    fail(`branches.${key} must be a non-empty string`);
  }
}
if (state.branches.refs_verified !== true) fail("branches.refs_verified must be true");
if (state.phase !== "Finalize") fail("phase must be Finalize");
if (!Number.isInteger(state.iteration) || state.iteration < 0) {
  fail("iteration must be a non-negative integer");
}
if (!Number.isInteger(state.max_iterations) || state.max_iterations < 1) {
  fail("max_iterations must be a positive integer");
}
for (const key of ["unresolved_gates", "blockers", "regression_ledger"]) {
  if (!Array.isArray(state[key])) fail(`${key} must be an array`);
}
if (state.unresolved_gates.length !== 0) fail("unresolved_gates must be empty");
if (state.blockers.length !== 0) fail("blockers must be empty");
if (typeof state.next_action !== "string") fail("next_action must be a string");
if (state.forced_reflection !== null && typeof state.forced_reflection !== "object") {
  fail("forced_reflection must be null or an object");
}
if (typeof state.updated_at !== "string" || state.updated_at.trim() === "") {
  fail("updated_at must be a non-empty string");
}

console.log("== RUN-STATE GATE PASS ==");
