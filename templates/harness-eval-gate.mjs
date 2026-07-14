#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const requiredChecks = 3;
const winners = new Set(["baseline", "harness", "tie", "not_proven"]);
const claimStatuses = new Set(["proven", "not_proven"]);
const mutationStatuses = new Set(["adopt", "revise", "reject", "not_proven"]);
const confidenceLevels = new Set(["low", "medium", "high"]);
const commandSources = new Set(["frozen_repo", "evaluator_owned", "arm_detected"]);
const commandUsers = new Set(["baseline", "harness", "both"]);
const findingActions = new Set(["auto-fix", "no-op", "ask-user"]);
const findingStatuses = new Set(["resolved", "unresolved", "accepted", "skipped"]);
const replayStatuses = new Set(["recorded", "not_required", "not_proven"]);
const roleSources = new Set(["shipped_files", "generated_from_shipped"]);
const MIN_SEEDS_PER_ARM = 6; // sign-flip permutation min two-sided p = 2/2^n; n=6 -> 0.03125 is the first < 0.05
const MIN_ROUTING_PROMPTS = 20;
const MIN_ROUTING_TRIALS = 3;
const EPSILON = 0.01;
const axes = ["correctness", "token_cost", "wall_clock", "routing_accuracy"];
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

export function validateHarnessEval(result) {
  const errors = [];

  function requireTrue(key) {
    if (result[key] !== true) errors.push(`${key} must be true`);
  }

  function requireString(value, label) {
    if (!value || typeof value !== "string") errors.push(`${label} is required`);
  }

  function requireStringArray(value, label, nonEmpty = false) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      errors.push(`${label} must be an array of strings`);
      return;
    }
    if (nonEmpty && value.length === 0) errors.push(`${label} must not be empty`);
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
      requireString(check.evidence, `${side}.machine_checks[${index}].evidence`);
      requireString(check.verifies, `${side}.machine_checks[${index}].verifies`);
      requireString(check.does_not_verify, `${side}.machine_checks[${index}].does_not_verify`);
      if (!confidenceLevels.has(check.confidence)) {
        errors.push(`${side}.machine_checks[${index}].confidence must be low, medium, or high`);
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

  function requireEvalIntent() {
    const intent = result.eval_intent;
    if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
      errors.push("eval_intent is required");
      return;
    }
    requireString(intent.goal, "eval_intent.goal");
    requireStringArray(intent.constraints, "eval_intent.constraints");
    requireStringArray(intent.tradeoffs, "eval_intent.tradeoffs");
    requireStringArray(intent.rejected_approaches, "eval_intent.rejected_approaches");
  }

  function requireCommandManifest() {
    const commands = result.command_manifest;
    if (!Array.isArray(commands) || commands.length === 0) {
      errors.push("command_manifest must not be empty");
      return;
    }
    let baselineTrusted = false;
    let harnessTrusted = false;
    commands.forEach((command, index) => {
      if (!command || typeof command !== "object" || Array.isArray(command)) {
        errors.push(`command_manifest[${index}] must be an object`);
        return;
      }
      requireString(command.name, `command_manifest[${index}].name`);
      requireString(command.command, `command_manifest[${index}].command`);
      requireString(command.verifies, `command_manifest[${index}].verifies`);
      if (!commandSources.has(command.source)) {
        errors.push(`command_manifest[${index}].source must be frozen_repo, evaluator_owned, or arm_detected`);
      }
      if (!commandUsers.has(command.used_by)) {
        errors.push(`command_manifest[${index}].used_by must be baseline, harness, or both`);
      }
      const trusted = command.source === "frozen_repo" || command.source === "evaluator_owned";
      if (trusted && (command.used_by === "baseline" || command.used_by === "both")) baselineTrusted = true;
      if (trusted && (command.used_by === "harness" || command.used_by === "both")) harnessTrusted = true;
    });
    if (result.claim_status === "proven") {
      if (!baselineTrusted) errors.push("claim_status proven requires a trusted baseline command");
      if (!harnessTrusted) errors.push("claim_status proven requires a trusted harness command");
    }
  }

  function requireDecisionGates() {
    const gates = result.decision_gates;
    if (!Array.isArray(gates)) {
      errors.push("decision_gates must be an array");
      return;
    }
    gates.forEach((gate, index) => {
      if (!gate || typeof gate !== "object" || Array.isArray(gate)) {
        errors.push(`decision_gates[${index}] must be an object`);
        return;
      }
      requireString(gate.id, `decision_gates[${index}].id`);
      requireString(gate.description, `decision_gates[${index}].description`);
      if (!findingActions.has(gate.action)) {
        errors.push(`decision_gates[${index}].action must be auto-fix, no-op, or ask-user`);
      }
      if (!findingStatuses.has(gate.status)) {
        errors.push(`decision_gates[${index}].status must be resolved, unresolved, accepted, or skipped`);
      }
      if (gate.action === "ask-user") {
        requireString(gate.human_decision, `decision_gates[${index}].human_decision`);
        if (result.claim_status === "proven" && gate.status === "unresolved") {
          errors.push(`decision_gates[${index}] ask-user finding must be resolved for proven claims`);
        }
      }
      if (gate.action === "auto-fix") {
        requireString(gate.recheck, `decision_gates[${index}].recheck`);
      }
    });
  }

  function requireAdapterReplay() {
    const replay = result.adapter_fixture_replay;
    if (!replay || typeof replay !== "object" || Array.isArray(replay)) {
      errors.push("adapter_fixture_replay is required");
      return;
    }
    if (!replayStatuses.has(replay.status)) {
      errors.push("adapter_fixture_replay.status must be recorded, not_required, or not_proven");
    }
    requireString(replay.adapter_event_schema, "adapter_fixture_replay.adapter_event_schema");
    if (replay.status === "recorded") {
      requireStringArray(replay.fixtures, "adapter_fixture_replay.fixtures", true);
      requireString(replay.redaction, "adapter_fixture_replay.redaction");
      requireString(replay.replay_command, "adapter_fixture_replay.replay_command");
    }
    if (result.claim_status === "proven" && replay.status === "not_proven") {
      errors.push("claim_status proven cannot use adapter_fixture_replay.status not_proven");
    }
  }

  function requireSurfaceSync() {
    const sync = result.surface_sync;
    if (!sync || typeof sync !== "object" || Array.isArray(sync)) {
      errors.push("surface_sync is required");
      return;
    }
    requireStringArray(sync.changed_surfaces, "surface_sync.changed_surfaces", result.claim_status === "proven");
    requireStringArray(sync.proof_commands, "surface_sync.proof_commands", result.claim_status === "proven");
  }

  function requireTelemetry(side) {
    const telemetry = result[side] && result[side].telemetry;
    if (!telemetry || typeof telemetry !== "object" || Array.isArray(telemetry)) {
      errors.push(`${side}.telemetry is required`);
      return;
    }
    requireString(telemetry.artifact_root, `${side}.telemetry.artifact_root`);
    requireStringArray(telemetry.logs, `${side}.telemetry.logs`, true);
    requireStringArray(telemetry.commands, `${side}.telemetry.commands`, true);
    requireStringArray(telemetry.edited_files, `${side}.telemetry.edited_files`);
    requireStringArray(telemetry.permissions_or_approvals, `${side}.telemetry.permissions_or_approvals`);
    if (typeof telemetry.turns_completed !== "number") {
      errors.push(`${side}.telemetry.turns_completed must be numeric`);
    }
    if (typeof telemetry.exit_code !== "number") {
      errors.push(`${side}.telemetry.exit_code must be numeric`);
    }
    if (typeof telemetry.crashed !== "boolean") {
      errors.push(`${side}.telemetry.crashed must be boolean`);
    }
    if (typeof telemetry.context_exhausted !== "boolean") {
      errors.push(`${side}.telemetry.context_exhausted must be boolean`);
    }
    if (result.claim_status === "proven") {
      if (telemetry.exit_code !== 0) errors.push(`${side}.telemetry.exit_code must be 0 for proven claims`);
      if (telemetry.crashed) errors.push(`${side}.telemetry.crashed must be false for proven claims`);
      if (telemetry.context_exhausted) {
        errors.push(`${side}.telemetry.context_exhausted must be false for proven claims`);
      }
    }
  }

  function requireKnownWinner(key, value) {
    if (!winners.has(value)) errors.push(`${key} must be baseline, harness, tie, or not_proven`);
  }

  function requireClaimStatus() {
    if (!claimStatuses.has(result.claim_status)) {
      errors.push("claim_status must be proven or not_proven");
    }
  }

  function nearlyEqual(a, b) {
    return Math.abs(a - b) <= EPSILON;
  }

  function displayNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
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
      return null;
    }
    let complete = true;
    let sum = 0;
    dimensions.forEach((dimension) => {
      const score = scoreOf(block[dimension], `${label}.${dimension}`);
      if (score === null) {
        complete = false;
        return;
      }
      if (score < 0 || score > 10) {
        errors.push(`${label}.${dimension}.score must be between 0 and 10`);
      }
      sum += score;
    });
    return complete ? sum : null;
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
      const dimensionSum = requireDimensionSet(qualitySide.dimensions, `quality.${side}.dimensions`);
      if (
        dimensionSum !== null &&
        typeof qualitySide.average_total === "number" &&
        !nearlyEqual(qualitySide.average_total, dimensionSum)
      ) {
        errors.push(`quality.${side}.average_total must equal dimension score sum (${displayNumber(dimensionSum)})`);
      }
      return;
    }
    if (!qualitySide.by_case || typeof qualitySide.by_case !== "object" || Array.isArray(qualitySide.by_case)) {
      errors.push(`quality.${side} must include dimensions or by_case`);
      return;
    }
    const caseEntries = Object.entries(qualitySide.by_case);
    if (caseEntries.length === 0) errors.push(`quality.${side}.by_case must not be empty`);
    const totals = [];
    caseEntries.forEach(([caseId, caseQuality]) => {
      if (!caseQuality || typeof caseQuality.total !== "number" || caseQuality.total < 0 || caseQuality.total > 100) {
        errors.push(`quality.${side}.by_case.${caseId}.total must be between 0 and 100`);
      } else {
        totals.push(caseQuality.total);
      }
      const dimensionSum = requireDimensionSet(caseQuality && caseQuality.dimensions, `quality.${side}.by_case.${caseId}.dimensions`);
      if (
        caseQuality &&
        typeof caseQuality.total === "number" &&
        dimensionSum !== null &&
        !nearlyEqual(caseQuality.total, dimensionSum)
      ) {
        errors.push(`quality.${side}.by_case.${caseId}.total must equal dimension score sum (${displayNumber(dimensionSum)})`);
      }
    });
    if (totals.length > 0 && typeof qualitySide.average_total === "number") {
      const average = totals.reduce((sum, total) => sum + total, 0) / totals.length;
      if (!nearlyEqual(qualitySide.average_total, average)) {
        errors.push(`quality.${side}.average_total must equal mean by_case total (${displayNumber(average)})`);
      }
    }
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

  function requireMutationContract() {
    const contract = result.harness_mutation_contract;
    if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
      errors.push("harness_mutation_contract is required");
      return;
    }
    if (!mutationStatuses.has(contract.status)) {
      errors.push("harness_mutation_contract.status must be adopt, revise, reject, or not_proven");
    }
    requireString(contract.intended_delta, "harness_mutation_contract.intended_delta");
    requireString(contract.safety_envelope, "harness_mutation_contract.safety_envelope");
    requireString(contract.rollback, "harness_mutation_contract.rollback");
    requireString(contract.proof_command, "harness_mutation_contract.proof_command");
    requireStringArray(contract.rejected_alternatives, "harness_mutation_contract.rejected_alternatives", true);
  }

  // The four checks below are recurrence-prevention rules and fire ONLY for a
  // proven claim; a directional/not_proven pilot (e.g. n=3) stays lenient.

  // Rule 1 - runtime portability: the adapter was PREFLIGHTED on the host, not assumed.
  function requireRuntimePreflight() {
    if (result.claim_status !== "proven") return;
    const rp = result.runtime_preflight;
    if (!rp || typeof rp !== "object" || Array.isArray(rp)) {
      errors.push("runtime_preflight is required for proven claims (host os, chosen adapter, preflight record)");
      return;
    }
    requireString(rp.host_os, "runtime_preflight.host_os");
    requireString(rp.chosen_adapter, "runtime_preflight.chosen_adapter");
    const preflights = rp.preflights;
    if (!preflights || typeof preflights !== "object" || Array.isArray(preflights)) {
      errors.push("runtime_preflight.preflights must record each tried adapter's preflight result");
      return;
    }
    const chosen = preflights[rp.chosen_adapter];
    if (!chosen || typeof chosen !== "object") {
      errors.push("runtime_preflight.preflights must include the chosen_adapter (proof it was preflighted, not assumed)");
      return;
    }
    if (chosen.ok !== true) {
      errors.push("runtime_preflight: the chosen_adapter must have passed preflight (ok=true)");
    }
  }

  // Rule 2 - sample size + significance for the winning comparison.
  function requireStatistics() {
    if (result.claim_status !== "proven") return;
    const stats = result.statistics;
    if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
      errors.push("statistics is required for proven claims (seeds_per_arm, bca_ci_95, permutation_p)");
      return;
    }
    if (typeof stats.seeds_per_arm !== "number" || stats.seeds_per_arm < MIN_SEEDS_PER_ARM) {
      errors.push(`proven claim requires n>=${MIN_SEEDS_PER_ARM} per arm (sign-flip permutation min two-sided p = 2/2^n, so n<6 cannot reach p<0.05)`);
    }
    requireString(stats.winning_comparison, "statistics.winning_comparison");
    if (!Array.isArray(stats.bca_ci_95) || stats.bca_ci_95.length !== 2 || stats.bca_ci_95.some((n) => typeof n !== "number")) {
      errors.push("statistics.bca_ci_95 must be a [low, high] pair of numbers");
    } else if (stats.bca_ci_95[0] <= 0) {
      errors.push("proven claim requires the BCa 95% CI entirely > 0 (its low bound must be > 0)");
    }
    if (typeof stats.permutation_p !== "number") {
      errors.push("statistics.permutation_p must be numeric");
    } else if (!(stats.permutation_p < 0.05)) {
      errors.push("proven claim requires sign-flip permutation p < 0.05");
    }
    requireMcnemar(stats);
    requireSnrFilter(stats);
  }

  function requireMcnemar(stats) {
    const m = stats.mcnemar;
    if (!m || typeof m !== "object" || Array.isArray(m)) {
      errors.push("statistics.mcnemar is required for proven binary pass/fail A/B claims");
      return;
    }
    if (typeof m.discordant_baseline_only !== "number" || m.discordant_baseline_only < 0) {
      errors.push("statistics.mcnemar.discordant_baseline_only must be a non-negative number");
    }
    if (typeof m.discordant_harness_only !== "number" || m.discordant_harness_only < 0) {
      errors.push("statistics.mcnemar.discordant_harness_only must be a non-negative number");
    }
    if (typeof m.p !== "number") {
      errors.push("statistics.mcnemar.p must be numeric");
    } else if (!(m.p < 0.05)) {
      errors.push("proven claim requires paired McNemar p < 0.05");
    }
  }

  function requireSnrFilter(stats) {
    const snr = stats.snr_filter;
    if (!snr || typeof snr !== "object" || Array.isArray(snr)) {
      errors.push("statistics.snr_filter is required for proven claims");
      return;
    }
    if (typeof snr.matched_removed !== "number" || snr.matched_removed < 0) {
      errors.push("statistics.snr_filter.matched_removed must be a non-negative number");
    }
    if (typeof snr.discordant_kept !== "number" || snr.discordant_kept <= 0) {
      errors.push("statistics.snr_filter.discordant_kept must be positive");
    }
    requireString(snr.rule, "statistics.snr_filter.rule");
  }

  // Rule 3 - role fidelity: exercise the shipped role files, not a paraphrase that can drift.
  function requireRoleFidelity() {
    if (result.claim_status !== "proven") return;
    if (!roleSources.has(result.role_source)) {
      errors.push("role_source must be shipped_files or generated_from_shipped for proven claims (a paraphrased inline prompt drifts from the shipped role files)");
    }
  }

  // Rule 4 - crash accounting: a crashed/timed-out run is a recorded LOSS, never a silent zero.
  function requireCrashAccounting() {
    if (result.claim_status !== "proven") return;
    const stats = result.statistics;
    const outcomes = stats && stats.seed_outcomes;
    if (!Array.isArray(outcomes) || outcomes.length === 0) {
      errors.push("statistics.seed_outcomes must record each seed's outcome for proven claims (crash accounting)");
      return;
    }
    outcomes.forEach((outcome, index) => {
      if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) {
        errors.push(`statistics.seed_outcomes[${index}] must be an object`);
        return;
      }
      if (typeof outcome.crashed !== "boolean") {
        errors.push(`statistics.seed_outcomes[${index}].crashed must be boolean`);
      }
      if (outcome.crashed === true && outcome.recorded_loss !== true) {
        const who = `${outcome.arm ?? "?"} seed ${outcome.seed ?? index}`;
        errors.push(`statistics.seed_outcomes[${index}] (${who}): a crashed/timed-out run must be recorded as a loss, never a silent zero`);
      }
    });
  }

  function requireAxisMetrics() {
    if (result.claim_status !== "proven") return;
    const metrics = result.axis_metrics;
    if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
      errors.push("axis_metrics is required for proven claims (correctness, token_cost, wall_clock, routing_accuracy)");
      return;
    }
    axes.forEach((axis) => {
      const entry = metrics[axis];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(`axis_metrics.${axis} is required for proven claims`);
        return;
      }
      requireString(entry.metric, `axis_metrics.${axis}.metric`);
      if (entry.status === "not_applicable") {
        requireString(entry.reason, `axis_metrics.${axis}.reason`);
        return;
      }
      ["baseline", "harness", "delta"].forEach((key) => {
        if (typeof entry[key] !== "number") errors.push(`axis_metrics.${axis}.${key} must be numeric`);
      });
    });
  }

  function requireRoutingAccuracy() {
    if (result.claim_status !== "proven") return;
    const routing = result.routing_accuracy;
    if (!routing || typeof routing !== "object" || Array.isArray(routing)) {
      errors.push("routing_accuracy is required for proven claims");
      return;
    }
    if (routing.applies === false) {
      requireString(routing.reason, "routing_accuracy.reason");
      return;
    }
    if (routing.applies !== true) errors.push("routing_accuracy.applies must be true or false");
    if (typeof routing.prompt_count !== "number" || routing.prompt_count < MIN_ROUTING_PROMPTS) {
      errors.push(`routing_accuracy.prompt_count must be >= ${MIN_ROUTING_PROMPTS}`);
    }
    if (typeof routing.trials_per_prompt !== "number" || routing.trials_per_prompt < MIN_ROUTING_TRIALS) {
      errors.push(`routing_accuracy.trials_per_prompt must be >= ${MIN_ROUTING_TRIALS}`);
    }
    if (routing.train_test_split !== "60/40") {
      errors.push("routing_accuracy.train_test_split must be 60/40");
    }
    ["should_trigger_rate", "should_not_trigger_rate", "heldout_accuracy"].forEach((key) => {
      if (typeof routing[key] !== "number" || routing[key] < 0 || routing[key] > 1) {
        errors.push(`routing_accuracy.${key} must be a number between 0 and 1`);
      }
    });
    requireStringArray(routing.near_miss_failures, "routing_accuracy.near_miss_failures");
    requireString(routing.artifact, "routing_accuracy.artifact");
  }

  if (!result.runtime_adapter || typeof result.runtime_adapter !== "string") {
    errors.push("runtime_adapter is required");
  }
  requireTrue("same_repo_snapshot");
  requireTrue("isolated_worktrees");
  requireTrue("blind_grading");
  requireEvalIntent();
  requireCommandManifest();
  requireDecisionGates();
  requireAdapterReplay();
  requireSurfaceSync();
  requireCondition("baseline", "without_harness");
  requireCondition("harness", "with_harness");
  requireChecks("baseline");
  requireChecks("harness");
  requireCost("baseline");
  requireCost("harness");
  requireTelemetry("baseline");
  requireTelemetry("harness");
  requireKnownWinner("winner", result.winner);
  requireClaimStatus();
  requireQuality();
  requireMutationContract();
  requireRuntimePreflight();
  requireStatistics();
  requireRoleFidelity();
  requireCrashAccounting();
  requireAxisMetrics();
  requireRoutingAccuracy();

  if (result.claim_status === "proven" && result.winner !== "harness") {
    errors.push("claim_status proven requires winner harness");
  }

  return errors;
}

export function runHarnessEvalCli(argv = process.argv) {
  const path = argv[2];
  if (!path) {
    console.error("usage: node templates/harness-eval-gate.mjs <result.json>");
    return 2;
  }

  let result;
  try {
    result = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`HARNESS-EVAL FAIL: cannot read result json: ${error.message}`);
    return 2;
  }

  const errors = validateHarnessEval(result);

  if (errors.length > 0) {
    console.error(`HARNESS-EVAL FAIL: ${errors.join("; ")}`);
    return 1;
  }

  console.log("HARNESS-EVAL PASS");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runHarnessEvalCli();
}
