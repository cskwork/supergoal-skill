#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../../..");
const DEFAULT_REF = "3cda4081fed96103a6395de39c85e9b20275e307";
const SMOKE_TASK = "happy-dom-abort-pending-body-reads";
const DEFAULT_TASK = "etree-xml-diff-patch";
const CODEX_AUTH_JSON_ALLOWLIST_TOML = '[pier_network_allowlist]\nbase_url = "https://chatgpt.com"\n';

function usage() {
  console.error(`Usage: node templates/harness-eval-external/deepswe/run-full-cycle.mjs [options]

Runs a no-manual-interrupt DeepSWE baseline/harness A/B cycle through Pier.

Options:
  --task <id>                 DeepSWE task id (default scoring task: ${DEFAULT_TASK}; smoke: ${SMOKE_TASK})
  --benchmark-root <path>     DeepSWE checkout (default: /tmp/deep-swe-sg)
  --run-root <path>           Output root (default: /tmp/sg-deepswe-full-cycle-<timestamp>)
  --agent <name>              Pier agent (default: codex)
  --model <name>              Model passed to Pier (default: gpt-5.5)
  --reasoning-effort <level>  Codex reasoning effort for both arms (default: low; use none to omit)
  --reasoning-summary <mode>  Codex reasoning summary for both arms (default: none; use none to omit)
  --codex-auth-json <mode>    Codex auth.json usage: auto, force, off (default: auto)
  --skill-repo <path>         Supergoal checkout embedded into the harness arm (default: this repo)
  --timeout-seconds <n>       Declared agent budget per arm (default: 900)
  --outer-timeout-seconds <n> Runner safety timeout per arm (default: timeout + 3600)
  --arms <list>               Comma-separated arms: baseline,harness (default: both)
  --dry-run                   Write manifest and commands, do not run Pier
  --force                     Remove existing run-root/harness task output first
`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {
    task: process.env.SG_DEEPSWE_TASK || DEFAULT_TASK,
    benchmarkRoot: process.env.SG_DEEPSWE_ROOT || "/tmp/deep-swe-sg",
    runRoot: process.env.SG_DEEPSWE_RUN_ROOT || "",
    agent: process.env.SG_DEEPSWE_AGENT || "codex",
    model: process.env.SG_DEEPSWE_MODEL || "gpt-5.5",
    reasoningEffort: process.env.SG_DEEPSWE_REASONING_EFFORT || "low",
    reasoningSummary: process.env.SG_DEEPSWE_REASONING_SUMMARY || "none",
    codexAuthJson: process.env.SG_DEEPSWE_CODEX_AUTH_JSON || "auto",
    skillRepo: process.env.SG_DEEPSWE_SKILL_REPO || REPO_ROOT,
    timeoutSeconds: Number(process.env.SG_DEEPSWE_TIMEOUT_SECONDS || 900),
    outerTimeoutSeconds: Number(process.env.SG_DEEPSWE_OUTER_TIMEOUT_SECONDS || 0),
    arms: (process.env.SG_DEEPSWE_ARMS || "baseline,harness").split(",").map((item) => item.trim()),
    dryRun: process.env.SG_DEEPSWE_DRY_RUN === "1",
    force: process.env.SG_DEEPSWE_FORCE === "1",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage();
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--task") {
      args.task = argv[++i] || usage();
    } else if (arg === "--benchmark-root") {
      args.benchmarkRoot = argv[++i] || usage();
    } else if (arg === "--run-root") {
      args.runRoot = argv[++i] || usage();
    } else if (arg === "--agent") {
      args.agent = argv[++i] || usage();
    } else if (arg === "--model") {
      args.model = argv[++i] || usage();
    } else if (arg === "--reasoning-effort") {
      args.reasoningEffort = argv[++i] || usage();
    } else if (arg === "--reasoning-summary") {
      args.reasoningSummary = argv[++i] || usage();
    } else if (arg === "--codex-auth-json") {
      args.codexAuthJson = argv[++i] || usage();
    } else if (arg === "--skill-repo") {
      args.skillRepo = argv[++i] || usage();
    } else if (arg === "--timeout-seconds") {
      args.timeoutSeconds = Number(argv[++i] || usage());
    } else if (arg === "--outer-timeout-seconds") {
      args.outerTimeoutSeconds = Number(argv[++i] || usage());
    } else if (arg === "--arms") {
      args.arms = (argv[++i] || usage()).split(",").map((item) => item.trim());
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }

  if (!Number.isFinite(args.timeoutSeconds) || args.timeoutSeconds <= 0) {
    throw new Error("--timeout-seconds must be a positive number");
  }
  if (!args.outerTimeoutSeconds) {
    args.outerTimeoutSeconds = args.timeoutSeconds + 3600;
  }
  if (!Number.isFinite(args.outerTimeoutSeconds) || args.outerTimeoutSeconds <= args.timeoutSeconds) {
    throw new Error("--outer-timeout-seconds must be greater than --timeout-seconds");
  }
  for (const arm of args.arms) {
    if (!["baseline", "harness"].includes(arm)) throw new Error(`unknown arm: ${arm}`);
  }
  if (!args.runRoot) {
    args.runRoot = `/tmp/sg-deepswe-full-cycle-${timestamp()}`;
  }
  if (!["auto", "force", "off"].includes(args.codexAuthJson)) {
    throw new Error("--codex-auth-json must be one of: auto, force, off");
  }
  args.benchmarkRoot = resolve(args.benchmarkRoot);
  args.runRoot = resolve(args.runRoot);
  args.skillRepo = resolve(args.skillRepo);
  return args;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function assertSafeRunRoot(path) {
  const resolved = resolve(path);
  const safePrefixes = [
    resolve("/tmp"),
    resolve(REPO_ROOT, "docs", "experiments"),
  ];
  if (!safePrefixes.some((prefix) => resolved === prefix || resolved.startsWith(`${prefix}/`))) {
    throw new Error(`refusing unsafe run root: ${path}. Use /tmp or docs/experiments.`);
  }
}

function mustFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`missing file: ${path}`);
}

function mustDir(path) {
  if (!existsSync(path) || !statSync(path).isDirectory()) throw new Error(`missing directory: ${path}`);
}

function run(cmd, args, options = {}) {
  const cwd = options.cwd || REPO_ROOT;
  const timeoutMs = options.timeoutMs || 0;
  const logPath = options.logPath;
  const startedAt = new Date();
  const chunks = [];
  let timedOut = false;
  let settled = false;

  if (logPath) {
    ensureDir(dirname(logPath));
    writeFileSync(logPath, `$ ${[cmd, ...args].join(" ")}\n`, "utf8");
  }

  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const append = (data) => {
      const text = data.toString();
      chunks.push(text);
      if (logPath) writeFileSync(logPath, text, { flag: "a" });
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);

    let timer = null;
    let killTimer = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        killTimer = setTimeout(() => child.kill("SIGKILL"), 30000);
      }, timeoutMs);
    }

    child.on("close", (status, signal) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      const finishedAt = new Date();
      resolvePromise({
        cmd,
        args,
        cwd,
        status,
        signal,
        timed_out: timedOut,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        log_path: logPath,
        output_tail: chunks.join("").slice(-4000),
      });
    });
  });
}

function commandText(cmd, args) {
  return [cmd, ...args].join(" ");
}

async function ensureBenchmark(root, ref, force) {
  if (!existsSync(root)) {
    ensureDir(dirname(root));
    await run("git", ["clone", "https://github.com/datacurve-ai/deep-swe", root], {
      timeoutMs: 20 * 60 * 1000,
    });
  }
  mustDir(root);
  const head = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const current = head.output_tail.trim().split(/\s+/).at(-1);
  if (current !== ref || force) {
    await run("git", ["-C", root, "fetch", "--all", "--tags"], { timeoutMs: 20 * 60 * 1000 });
    await run("git", ["-C", root, "checkout", ref], { timeoutMs: 5 * 60 * 1000 });
  }
}

function readAgentTimeout(taskDir) {
  const taskToml = readFileSync(join(taskDir, "task.toml"), "utf8");
  const agentSection = taskToml.match(/\[agent\]([\s\S]*?)(?:\n\[|$)/);
  const timeoutMatch = agentSection?.[1]?.match(/timeout_sec\s*=\s*([0-9.]+)/);
  return timeoutMatch ? Number(timeoutMatch[1]) : 5400;
}

function walkFiles(root, predicate, output = []) {
  if (!existsSync(root)) return output;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkFiles(full, predicate, output);
    else if (predicate(full)) output.push(full);
  }
  return output;
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function collectJob(jobRoot) {
  const jobResultPath = join(jobRoot, "result.json");
  const rewardPaths = walkFiles(jobRoot, (file) => file.endsWith("/verifier/reward.json"));
  const ctrfPaths = walkFiles(jobRoot, (file) => file.endsWith("/verifier/ctrf.json"));
  const patchPaths = walkFiles(jobRoot, (file) => file.endsWith("/artifacts/model.patch"));
  const trialResultPaths = walkFiles(jobRoot, (file) => file.endsWith("/result.json") && file !== jobResultPath);
  const rewards = rewardPaths.map((path) => ({ path, value: readJsonIfExists(path) }));
  const patches = patchPaths.map((path) => ({
    path,
    bytes: statSync(path).size,
    sha256: sha256(readFileSync(path, "utf8")),
  }));

  return {
    job_root: jobRoot,
    job_result_path: existsSync(jobResultPath) ? jobResultPath : null,
    job_result: readJsonIfExists(jobResultPath),
    trial_result_paths: trialResultPaths,
    reward_paths: rewardPaths,
    ctrf_paths: ctrfPaths,
    patch_paths: patchPaths,
    rewards,
    patches,
  };
}

function enabledCodexKwargs({ agent, reasoningEffort, reasoningSummary, useCodexAuthJson }) {
  if (agent !== "codex") return [];
  const kwargs = [];
  if (reasoningEffort && reasoningEffort !== "none") {
    kwargs.push(["--agent-kwarg", `reasoning_effort=${reasoningEffort}`]);
  }
  if (reasoningSummary && reasoningSummary !== "none") {
    kwargs.push(["--agent-kwarg", `reasoning_summary=${reasoningSummary}`]);
  }
  if (useCodexAuthJson) {
    kwargs.push(["--agent-kwarg", `config_toml=${JSON.stringify(CODEX_AUTH_JSON_ALLOWLIST_TOML)}`]);
  }
  return kwargs.flat();
}

function shouldUseCodexAuthJson({ agent, mode }) {
  if (agent !== "codex" || mode === "off") return false;
  const authJsonPath = join(homedir(), ".codex", "auth.json");
  if (mode === "force") {
    if (!existsSync(authJsonPath)) throw new Error(`missing Codex auth file: ${authJsonPath}`);
    return true;
  }
  return !process.env.OPENAI_API_KEY && existsSync(authJsonPath);
}

function pierArgs({
  taskPath,
  jobsDir,
  jobName,
  agent,
  model,
  reasoningEffort,
  reasoningSummary,
  useCodexAuthJson,
  agentTimeoutMultiplier,
}) {
  const args = [
    "run",
    "-p",
    taskPath,
    "--jobs-dir",
    jobsDir,
    "--job-name",
    jobName,
    "--agent",
    agent,
    "--n-concurrent",
    "1",
    "--max-retries",
    "0",
    "--agent-timeout-multiplier",
    String(agentTimeoutMultiplier),
    "--yes",
  ];
  args.push(...enabledCodexKwargs({ agent, reasoningEffort, reasoningSummary, useCodexAuthJson }));
  if (useCodexAuthJson) args.push("--agent-env", "CODEX_FORCE_AUTH_JSON=1");
  if (model) args.push("--model", model);
  return args;
}

async function prepareHarness({ benchmarkRoot, runRoot, task, force, skillRepo }) {
  const outRoot = join(runRoot, "deep-swe-harness");
  const destTask = join(outRoot, "tasks", task);
  if (existsSync(destTask)) {
    if (!force) throw new Error(`harness task already exists: ${destTask} (use --force)`);
    rmSync(destTask, { recursive: true, force: true });
  }
  ensureDir(outRoot);
  const result = await run(
    "node",
    [join(SCRIPT_DIR, "prepare-supergoal-arm.mjs"), benchmarkRoot, outRoot, task, skillRepo],
    { timeoutMs: 60 * 1000, logPath: join(runRoot, "logs", "prepare-harness.log") },
  );
  if (result.status !== 0) {
    throw new Error(`prepare-supergoal-arm failed; see ${result.log_path}`);
  }
  return outRoot;
}

function timingMs(timing) {
  if (!timing?.started_at || !timing?.finished_at) return null;
  const ms = new Date(timing.finished_at).getTime() - new Date(timing.started_at).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// Efficiency metrics the outer `pier run` duration hides: agent-only wall clock
// (excludes Docker environment build and verifier) plus token usage from job stats.
function armMetrics(collection, commandDurationMs) {
  const trial =
    collection.trial_result_paths.map(readJsonIfExists).find((item) => item?.agent_execution) || null;
  const stats = collection.job_result?.stats || {};
  return {
    wall_clock_ms: commandDurationMs ?? null,
    environment_setup_ms: timingMs(trial?.environment_setup),
    agent_setup_ms: timingMs(trial?.agent_setup),
    agent_execution_ms: timingMs(trial?.agent_execution),
    verifier_ms: timingMs(trial?.verifier),
    n_input_tokens: stats.n_input_tokens ?? null,
    n_cache_tokens: stats.n_cache_tokens ?? null,
    n_output_tokens: stats.n_output_tokens ?? null,
    cost_usd: stats.cost_usd ?? null,
  };
}

function armOutcome(commandResult, collection) {
  if (commandResult.timed_out) return "runner_timeout";
  if (commandResult.status !== 0) return "error";
  const job = collection.job_result;
  if (!job) return "missing_job_result";
  if (job.stats?.n_errored_trials > 0) return "error";
  if (job.stats?.n_cancelled_trials > 0) return "budget_timeout";
  return "completed";
}

function scoreSummary(collection) {
  const firstReward = collection.rewards.find((item) => item.value)?.value || null;
  return {
    reward: firstReward?.reward ?? null,
    f2p_total: firstReward?.f2p_total ?? null,
    f2p_passed: firstReward?.f2p_passed ?? null,
    f2p: firstReward?.f2p ?? null,
    p2p_total: firstReward?.p2p_total ?? null,
    p2p_passed: firstReward?.p2p_passed ?? null,
    p2p: firstReward?.p2p ?? null,
    partial: firstReward?.partial ?? null,
    patch_bytes: collection.patches[0]?.bytes ?? null,
  };
}

function isPerfectScore(score) {
  return score?.reward === 1 && score?.f2p === 1 && score?.p2p === 1 && score?.partial === 1;
}

function numberDelta(left, right) {
  return typeof left === "number" && typeof right === "number" ? left - right : null;
}

function costOf(arm) {
  return arm.collection.job_result?.stats?.cost_usd ?? null;
}

function classifyPairedDecision(summary) {
  const baselineArm = summary.arms.baseline;
  const harnessArm = summary.arms.harness;
  const baseline = baselineArm?.score;
  const harness = harnessArm?.score;
  if (!baseline || !harness) return;

  summary.headroom = {
    baseline_perfect: isPerfectScore(baseline),
    harness_perfect: isPerfectScore(harness),
    baseline_partial_headroom:
      typeof baseline.partial === "number" ? Number((1 - baseline.partial).toFixed(6)) : null,
  };
  summary.deltas = {
    reward: numberDelta(harness.reward, baseline.reward),
    partial: numberDelta(harness.partial, baseline.partial),
    duration_ms: numberDelta(harnessArm.command.duration_ms, baselineArm.command.duration_ms),
    agent_execution_ms: numberDelta(
      harnessArm.metrics?.agent_execution_ms,
      baselineArm.metrics?.agent_execution_ms,
    ),
    n_input_tokens: numberDelta(harnessArm.metrics?.n_input_tokens, baselineArm.metrics?.n_input_tokens),
    n_output_tokens: numberDelta(harnessArm.metrics?.n_output_tokens, baselineArm.metrics?.n_output_tokens),
    cost_usd: numberDelta(costOf(harnessArm), costOf(baselineArm)),
    patch_bytes: numberDelta(harness.patch_bytes, baseline.patch_bytes),
  };

  if (baselineArm.process_outcome !== "completed" || harnessArm.process_outcome !== "completed") {
    summary.decision = "not_proven_incomplete_arm";
    return;
  }

  if (summary.headroom.baseline_perfect && summary.headroom.harness_perfect) {
    summary.decision = "not_proven_no_headroom";
    return;
  }

  if ((summary.deltas.partial ?? 0) > 0) {
    summary.decision = "directional_harness_improvement";
  } else if ((summary.deltas.partial ?? 0) < 0) {
    summary.decision = "harness_regression";
  } else {
    summary.decision = "not_proven";
  }
}

function formatCost(value) {
  return typeof value === "number" ? `$${value.toFixed(3)}` : "n/a";
}

function renderReport(summary) {
  const arms = summary.arms;
  const seconds = (ms) => (typeof ms === "number" ? `${Math.round(ms / 1000)}s` : "n/a");
  const tokens = (value) => (typeof value === "number" ? String(value) : "n/a");
  const rows = Object.entries(arms)
    .map(([name, arm]) => {
      const score = arm.score;
      const metrics = arm.metrics || {};
      return `| ${name} | ${arm.process_outcome} | ${score.reward ?? "n/a"} | ${score.f2p_passed ?? "n/a"}/${score.f2p_total ?? "n/a"} | ${score.p2p_passed ?? "n/a"}/${score.p2p_total ?? "n/a"} | ${score.partial ?? "n/a"} | ${tokens(metrics.n_input_tokens)} | ${tokens(metrics.n_cache_tokens)} | ${tokens(metrics.n_output_tokens)} | ${formatCost(costOf(arm))} | ${score.patch_bytes ?? "n/a"} | ${seconds(metrics.agent_execution_ms)} | ${seconds(arm.command.duration_ms)} |`;
    })
    .join("\n");
  const interpretation =
    summary.decision === "not_proven_no_headroom"
      ? "Baseline already reached perfect public verifier score, so this task cannot prove correctness lift for the harness under these settings. Treat it as a full-cycle reliability/default-public-pilot check and add harder public tasks before claiming skill lift."
      : summary.decision === "directional_harness_improvement"
        ? "Harness partial correctness exceeded baseline on a completed paired run. Treat n=1 as directional only."
        : summary.decision === "harness_regression"
          ? "Harness partial correctness was lower than baseline on a completed paired run."
          : "No positive paired correctness delta was proven.";
  return `# DeepSWE Full-Cycle A/B Report

Decision: ${summary.decision}

This run used a declared stop policy before execution. No manual interruption is a valid outcome; if the
runner times out, the arm is recorded as \`runner_timeout\`, not silently scored as a normal arm.

## Run

- Task: \`${summary.task}\`
- Benchmark ref: \`${summary.benchmark_ref}\`
- Agent/model: \`${summary.agent}\` / \`${summary.model || "default"}\`
- Agent timeout: ${summary.stop_policy.timeout_seconds}s
- Outer runner timeout: ${summary.stop_policy.outer_timeout_seconds}s
- Run root: \`${summary.run_root}\`

## Results

| Arm | Outcome | Reward | F2P | P2P | Partial | Tok in | Tok cache | Tok out | Cost | Patch bytes | Agent time | Wall clock |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}

## Interpretation

${interpretation}

## Artifacts

${Object.entries(arms)
  .map(
    ([name, arm]) =>
      `- ${name}: job=\`${arm.collection.job_root}\`, log=\`${arm.command.log_path}\`, rewards=${arm.collection.reward_paths.length}, patches=${arm.collection.patch_paths.length}`,
  )
  .join("\n")}
`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  assertSafeRunRoot(options.runRoot);
  if (existsSync(options.runRoot)) {
    if (!options.force) throw new Error(`run root already exists: ${options.runRoot} (use --force)`);
    rmSync(options.runRoot, { recursive: true, force: true });
  }
  ensureDir(options.runRoot);
  ensureDir(join(options.runRoot, "logs"));

  await ensureBenchmark(options.benchmarkRoot, DEFAULT_REF, false);
  const taskPath = join(options.benchmarkRoot, "tasks", options.task);
  mustDir(taskPath);
  mustFile(join(taskPath, "instruction.md"));
  const agentTimeoutSec = readAgentTimeout(taskPath);
  const agentTimeoutMultiplier = Number((options.timeoutSeconds / agentTimeoutSec).toFixed(6));
  const harnessRoot = options.arms.includes("harness")
    ? await prepareHarness({
        benchmarkRoot: options.benchmarkRoot,
        runRoot: options.runRoot,
        task: options.task,
        force: options.force,
        skillRepo: options.skillRepo,
      })
    : null;
  const skillCommit = options.arms.includes("harness")
    ? (await run("git", ["-C", options.skillRepo, "rev-parse", "HEAD"])).output_tail.trim().split(/\s+/).at(-1)
    : null;
  const useCodexAuthJson = shouldUseCodexAuthJson({ agent: options.agent, mode: options.codexAuthJson });

  const jobsDir = join(options.runRoot, "jobs");
  const manifest = {
    task: options.task,
    benchmark_ref: DEFAULT_REF,
    benchmark_root: options.benchmarkRoot,
    run_root: options.runRoot,
    base_instruction_sha256: sha256(readFileSync(join(taskPath, "instruction.md"), "utf8")),
    agent: options.agent,
    model: options.model,
    skill_repo: options.arms.includes("harness") ? options.skillRepo : null,
    skill_commit: skillCommit,
    reasoning_effort: options.agent === "codex" ? options.reasoningEffort : null,
    reasoning_summary: options.agent === "codex" ? options.reasoningSummary : null,
    codex_auth_json: {
      mode: options.codexAuthJson,
      enabled: useCodexAuthJson,
      host_auth_json_present: existsSync(join(homedir(), ".codex", "auth.json")),
      openai_api_key_present: Boolean(process.env.OPENAI_API_KEY),
      allowlist_domain: useCodexAuthJson ? "chatgpt.com" : null,
    },
    stop_policy: {
      timeout_seconds: options.timeoutSeconds,
      outer_timeout_seconds: options.outerTimeoutSeconds,
      task_agent_timeout_seconds: agentTimeoutSec,
      agent_timeout_multiplier: agentTimeoutMultiplier,
      valid_outcomes: ["completed", "budget_timeout", "error"],
      manual_interrupt: "invalid_paired_correctness",
      capture_patch_after_terminate_timeout_or_error: true,
    },
    arms: {},
    dry_run: options.dryRun,
  };

  const armTaskPaths = {
    baseline: taskPath,
    harness: harnessRoot ? join(harnessRoot, "tasks", options.task) : null,
  };

  for (const arm of options.arms) {
    const jobName = `${arm}-${options.task}-${timestamp()}`;
    const args = pierArgs({
      taskPath: armTaskPaths[arm],
      jobsDir,
      jobName,
      agent: options.agent,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      reasoningSummary: options.reasoningSummary,
      useCodexAuthJson,
      agentTimeoutMultiplier,
    });
    manifest.arms[arm] = {
      task_path: armTaskPaths[arm],
      job_name: jobName,
      command: commandText("pier", args),
    };
  }
  writeFileSync(join(options.runRoot, "manifest.json"), json(manifest));

  if (options.dryRun) {
    console.log(`dry-run manifest: ${join(options.runRoot, "manifest.json")}`);
    for (const arm of Object.values(manifest.arms)) console.log(arm.command);
    return;
  }

  const summary = {
    task: options.task,
    benchmark_ref: DEFAULT_REF,
    run_root: options.runRoot,
    agent: options.agent,
    model: options.model,
    skill_repo: manifest.skill_repo,
    skill_commit: manifest.skill_commit,
    reasoning_effort: options.agent === "codex" ? options.reasoningEffort : null,
    reasoning_summary: options.agent === "codex" ? options.reasoningSummary : null,
    codex_auth_json: manifest.codex_auth_json,
    stop_policy: manifest.stop_policy,
    arms: {},
    decision: "not_proven",
  };

  for (const arm of options.arms) {
    const armManifest = manifest.arms[arm];
    const args = pierArgs({
      taskPath: armManifest.task_path,
      jobsDir,
      jobName: armManifest.job_name,
      agent: options.agent,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      reasoningSummary: options.reasoningSummary,
      useCodexAuthJson,
      agentTimeoutMultiplier,
    });
    const command = await run("pier", args, {
      timeoutMs: options.outerTimeoutSeconds * 1000,
      logPath: join(options.runRoot, "logs", `${arm}.log`),
    });
    const collection = collectJob(join(jobsDir, armManifest.job_name));
    const processOutcome = armOutcome(command, collection);
    summary.arms[arm] = {
      process_outcome: processOutcome,
      command,
      collection,
      score: scoreSummary(collection),
      metrics: armMetrics(collection, command.duration_ms),
    };
    writeFileSync(join(options.runRoot, `${arm}-summary.json`), json(summary.arms[arm]));
  }

  const baseline = summary.arms.baseline?.score;
  const harness = summary.arms.harness?.score;
  if (baseline && harness) {
    classifyPairedDecision(summary);
    summary.partial_delta = summary.deltas?.partial ?? null;
  }

  writeFileSync(join(options.runRoot, "summary.json"), json(summary));
  writeFileSync(join(options.runRoot, "report.md"), renderReport(summary), "utf8");
  console.log(`summary: ${join(options.runRoot, "summary.json")}`);
  console.log(`report: ${join(options.runRoot, "report.md")}`);
  console.log(`decision: ${summary.decision}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
