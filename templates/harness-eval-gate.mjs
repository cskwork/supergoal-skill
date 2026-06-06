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
  console.error(`HARNESS-EVAL FAIL: cannot read result json: ${error.message}`);
  process.exit(2);
}

const errors = [];
const requiredChecks = 3;
const winners = new Set(["baseline", "harness", "tie", "not_proven"]);
const dimensions = [
  "feature_completeness",
  "test_coverage",
  "code_quality",
  "error_handling",
  "efficiency",
  "correctness",
  "architecture",
  "extensibility",
  "documentation",
  "dev_environment",
];

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

function requireKnownWinner(key, value) {
  if (!winners.has(value)) errors.push(`${key} must be baseline, harness, tie, or not_proven`);
}

function scoreOf(entry, label) {
  if (typeof entry === "number") return entry;
  if (entry && typeof entry.score === "number") return entry.score;
  errors.push(`${label}.score is required`);
  return null;
}

function requireDimensionSet(block, label) {
  if (!block || typeof block !== "object" || Array.isArray(block)) {
    errors.push(`${label} must be an object`);
    return;
  }
  dimensions.forEach((dimension) => {
    const score = scoreOf(block[dimension], `${label}.${dimension}`);
    if (score === null) return;
    if (score < 0 || score > 10) {
      errors.push(`${label}.${dimension}.score must be between 0 and 10`);
    }
  });
}

function requireQualitySide(side) {
  const qualitySide = result.quality && result.quality[side];
  if (!qualitySide || typeof qualitySide !== "object" || Array.isArray(qualitySide)) {
    errors.push(`quality.${side} is required`);
    return;
  }
  if (typeof qualitySide.average_total !== "number" || qualitySide.average_total < 0 || qualitySide.average_total > 100) {
    errors.push(`quality.${side}.average_total must be between 0 and 100`);
  }
  if (qualitySide.dimensions) {
    requireDimensionSet(qualitySide.dimensions, `quality.${side}.dimensions`);
    return;
  }
  if (!qualitySide.by_case || typeof qualitySide.by_case !== "object" || Array.isArray(qualitySide.by_case)) {
    errors.push(`quality.${side} must include dimensions or by_case`);
    return;
  }
  const caseEntries = Object.entries(qualitySide.by_case);
  if (caseEntries.length === 0) errors.push(`quality.${side}.by_case must not be empty`);
  caseEntries.forEach(([caseId, caseQuality]) => {
    if (!caseQuality || typeof caseQuality.total !== "number" || caseQuality.total < 0 || caseQuality.total > 100) {
      errors.push(`quality.${side}.by_case.${caseId}.total must be between 0 and 100`);
    }
    requireDimensionSet(caseQuality && caseQuality.dimensions, `quality.${side}.by_case.${caseId}.dimensions`);
  });
}

function requireQuality() {
  if (!result.quality || typeof result.quality !== "object" || Array.isArray(result.quality)) {
    errors.push("quality is required");
    return;
  }
  if (!result.quality.method || typeof result.quality.method !== "string") {
    errors.push("quality.method is required");
  }
  requireQualitySide("baseline");
  requireQualitySide("harness");
  requireKnownWinner("quality.winner", result.quality.winner);
  if (result.claim_status === "proven" && result.quality.winner !== "harness") {
    errors.push("claim_status proven requires quality.winner harness");
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
requireKnownWinner("winner", result.winner);
requireQuality();

if (result.claim_status === "proven" && result.winner !== "harness") {
  errors.push("claim_status proven requires winner harness");
}

if (errors.length > 0) {
  console.error(`HARNESS-EVAL FAIL: ${errors.join("; ")}`);
  process.exit(1);
}

console.log("HARNESS-EVAL PASS");
