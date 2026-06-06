#!/usr/bin/env node
import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node templates/harness-eval-gate.mjs <result.json>");
  process.exit(2);
}

let result;
try {
  result = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (error) {
  console.error(`invalid JSON: ${error.message}`);
  process.exit(2);
}

const errors = [];
const requiredChecks = 3;

function requireTrue(key) {
  if (result[key] !== true) errors.push(`${key} must be true`);
}

function requireCondition(side, expected) {
  if (!result[side] || result[side].condition !== expected) {
    errors.push(`${side}.condition must be ${expected}`);
  }
}

function requireChecks(side) {
  const checks = result[side] && result[side].machine_checks;
  if (!Array.isArray(checks) || checks.length < requiredChecks) {
    errors.push(`${side}.machine_checks must contain at least ${requiredChecks} checks`);
    return;
  }
  checks.forEach((check, index) => {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push(`${side}.machine_checks[${index}] must be an object`);
      return;
    }
    if (!check.name || typeof check.name !== "string") {
      errors.push(`${side}.machine_checks[${index}].name is required`);
    }
    if (!["pass", "fail", "skip"].includes(check.status)) {
      errors.push(`${side}.machine_checks[${index}].status must be pass, fail, or skip`);
    }
    if (result.claim_status === "proven" && check.status !== "pass") {
      errors.push(`${side}.machine_checks[${index}].status must be pass for proven claims`);
    }
    if (!check.evidence || typeof check.evidence !== "string") {
      errors.push(`${side}.machine_checks[${index}].evidence is required`);
    }
  });
}

function requireCost(side) {
  const cost = result[side] && result[side].cost;
  if (
    !cost ||
    typeof cost.tokens !== "number" ||
    typeof cost.duration_ms !== "number" ||
    typeof cost.tool_calls !== "number"
  ) {
    errors.push(`${side}.cost must include numeric tokens, duration_ms, and tool_calls`);
  }
}

function requireKnownWinner() {
  const allowed = new Set(["baseline", "harness", "tie", "not_proven"]);
  if (!allowed.has(result.winner)) {
    errors.push("winner must be baseline, harness, tie, or not_proven");
  }
}

if (!result.runtime_adapter || typeof result.runtime_adapter !== "string") {
  errors.push("runtime_adapter is required");
}

requireTrue("same_repo_snapshot");
requireTrue("isolated_worktrees");
requireTrue("blind_grading");
requireCondition("baseline", "without_harness");
requireCondition("harness", "with_harness");
requireChecks("baseline");
requireChecks("harness");
requireCost("baseline");
requireCost("harness");
requireKnownWinner();

if (result.claim_status === "proven" && result.winner !== "harness") {
  errors.push("claim_status proven requires winner harness");
}

if (errors.length > 0) {
  console.error(`HARNESS-EVAL FAIL: ${errors.join("; ")}`);
  process.exit(1);
}

console.log("HARNESS-EVAL PASS");
