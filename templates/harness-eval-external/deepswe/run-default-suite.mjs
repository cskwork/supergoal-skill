#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TASKS = [
  "etree-xml-diff-patch",
  "cliffy-config-file-parsing",
  "yjs-map-conflict-detection",
];

function usage() {
  console.error(`Usage: node templates/harness-eval-external/deepswe/run-default-suite.mjs [options]

Runs the forced default DeepSWE difficult-SWE suite by invoking run-full-cycle.mjs once per task.

Options:
  --tasks <a,b,c>    Override suite tasks (default: ${DEFAULT_TASKS.join(",")})
  --run-root <path>  Suite output root (default: /tmp/sg-deepswe-default-suite-<timestamp>)
  --force            Forward --force to every per-task run
  --dry-run          Forward --dry-run to every per-task run

All other options are forwarded to run-full-cycle.mjs, for example:
  --agent codex --model gpt-5.3-codex-spark --reasoning-effort low --codex-auth-json auto --timeout-seconds 900
`);
  process.exit(2);
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function parseArgs(argv) {
  const options = {
    tasks: DEFAULT_TASKS,
    runRoot: "",
    forwarded: [],
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage();
    if (arg === "--tasks") {
      options.tasks = (argv[++i] || usage()).split(",").map((task) => task.trim()).filter(Boolean);
    } else if (arg === "--run-root") {
      options.runRoot = argv[++i] || usage();
    } else if (arg === "--task") {
      throw new Error("run-default-suite owns task selection; use --tasks for an explicit suite override");
    } else {
      if (arg === "--dry-run") options.dryRun = true;
      options.forwarded.push(arg);
      if (!arg.startsWith("--")) continue;
      const next = argv[i + 1];
      if (next && !next.startsWith("--") && !["--dry-run", "--force"].includes(arg)) {
        options.forwarded.push(next);
        i += 1;
      }
    }
  }
  if (options.tasks.length === 0) throw new Error("--tasks must name at least one task");
  if (!options.runRoot) options.runRoot = `/tmp/sg-deepswe-default-suite-${timestamp()}`;
  options.runRoot = resolve(options.runRoot);
  return options;
}

function run(cmd, args, cwd) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", env: process.env });
    child.on("close", (status, signal) => resolvePromise({ status, signal }));
    child.on("error", (error) => resolvePromise({ status: 1, signal: null, error: error.message }));
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function scoreCell(score) {
  if (!score) return "n/a";
  return `reward=${score.reward ?? "n/a"} f2p=${score.f2p_passed ?? "n/a"}/${score.f2p_total ?? "n/a"} p2p=${score.p2p_passed ?? "n/a"}/${score.p2p_total ?? "n/a"} partial=${score.partial ?? "n/a"}`;
}

function writeSuiteArtifacts(options, taskSummaries) {
  const suite = {
    suite: "forced_default_deepswe_difficult_swe",
    dry_run: options.dryRun,
    tasks: options.tasks,
    run_root: options.runRoot,
    summaries: taskSummaries,
    counts: {
      directional_harness_improvement: taskSummaries.filter((item) => item.summary?.decision === "directional_harness_improvement").length,
      harness_regression: taskSummaries.filter((item) => item.summary?.decision === "harness_regression").length,
      not_proven: taskSummaries.filter((item) => item.summary?.decision?.startsWith("not_proven")).length,
      errors: taskSummaries.filter((item) => item.status !== 0 || (!options.dryRun && !item.summary)).length,
    },
  };
  writeFileSync(join(options.runRoot, "suite-summary.json"), `${JSON.stringify(suite, null, 2)}\n`);

  const rows = taskSummaries.map((item) => {
    const summary = item.summary;
    return `| ${item.task} | ${item.status} | ${summary?.decision ?? (options.dryRun ? "dry_run" : "missing")} | ${scoreCell(summary?.arms?.baseline?.score)} | ${scoreCell(summary?.arms?.harness?.score)} | ${summary?.deltas?.partial ?? "n/a"} |`;
  }).join("\n");
  writeFileSync(join(options.runRoot, "suite-report.md"), `# DeepSWE Forced Default Suite

This suite runs three different difficult SWE-style DeepSWE tasks through the same paired baseline/harness full-cycle runner.

| Task | Exit | Decision | Baseline | Harness | Partial delta |
|---|---:|---|---|---|---:|
${rows}

Artifact root: \`${options.runRoot}\`
`, "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.runRoot, { recursive: true });
  const taskSummaries = [];
  for (const task of options.tasks) {
    const taskRoot = join(options.runRoot, task);
    const args = [
      join(SCRIPT_DIR, "run-full-cycle.mjs"),
      "--task",
      task,
      "--run-root",
      taskRoot,
      ...options.forwarded,
    ];
    const result = await run(process.execPath, args, SCRIPT_DIR);
    const summaryPath = join(taskRoot, "summary.json");
    taskSummaries.push({
      task,
      run_root: taskRoot,
      status: result.status,
      signal: result.signal,
      summary_path: existsSync(summaryPath) ? summaryPath : null,
      summary: existsSync(summaryPath) ? readJson(summaryPath) : null,
    });
    if (result.status !== 0) break;
  }
  writeSuiteArtifacts(options, taskSummaries);
  console.log(`suite summary: ${join(options.runRoot, "suite-summary.json")}`);
  console.log(`suite report: ${join(options.runRoot, "suite-report.md")}`);
  if (taskSummaries.some((item) => item.status !== 0 || (!options.dryRun && !item.summary))) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
