#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";

const [, , deepSweRootArg, outRootArg, taskId, supergoalRootArg = "."] = process.argv;

function usage() {
  console.error(
    "Usage: node prepare-supergoal-arm.mjs <deep-swe-root> <out-root> <task-id> [supergoal-root]",
  );
  process.exit(2);
}

function mustFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`missing file: ${path}`);
  }
}

function mustDir(path) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`missing directory: ${path}`);
  }
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function readHarnessFile(supergoalRoot, relativePath) {
  const absolutePath = join(supergoalRoot, relativePath);
  mustFile(absolutePath);
  const content = readFileSync(absolutePath, "utf8");
  return {
    path: relativePath,
    sha256: sha256(content),
    content,
  };
}

if (!deepSweRootArg || !outRootArg || !taskId) {
  usage();
}

const deepSweRoot = resolve(deepSweRootArg);
const outRoot = resolve(outRootArg);
const supergoalRoot = resolve(supergoalRootArg);
const srcTask = join(deepSweRoot, "tasks", taskId);
const destTask = join(outRoot, "tasks", taskId);
const srcInstruction = join(srcTask, "instruction.md");
const destInstruction = join(destTask, "instruction.md");
const metadataPath = join(destTask, "harness-metadata.json");

mustDir(deepSweRoot);
mustDir(supergoalRoot);
mustDir(srcTask);
mustFile(srcInstruction);

if (existsSync(destTask)) {
  throw new Error(`destination already exists: ${destTask}`);
}

mkdirSync(dirname(destTask), { recursive: true });
cpSync(srcTask, destTask, { recursive: true, errorOnExist: true });

const baseInstruction = readFileSync(srcInstruction, "utf8");
const harnessFiles = [
  "SKILL.md",
  "reference/role-loop.md",
  "reference/delivery-gate.md",
  "agents/qa-auditor.md",
].map((path) => readHarnessFile(supergoalRoot, path));

const fileList = harnessFiles
  .map((file) => `- ${file.path} sha256=${file.sha256}`)
  .join("\n");
const embeddedFiles = harnessFiles
  .map(
    (file) =>
      `\n<supergoal-file path="${file.path}" sha256="${file.sha256}">\n${file.content.trim()}\n</supergoal-file>\n`,
  )
  .join("\n");

const harnessPrefix = `# Supergoal Harness Condition

This run is the HARNESS arm for a public DeepSWE A/B test. Solve the same benchmark task below, but use
the approved supergoal reference embedded here. Do not use benchmark verifier files, hidden tests, or
solution patches if they are visible through local tooling. The benchmark task body after the marker
\`# Original DeepSWE Task\` must remain the source of product requirements.

## DeepSWE scoring contract

- The evaluator grades the repository patch, not the final explanation. Make code changes in the repo.
- Preserve existing behavior while fixing the requested behavior: DeepSWE-style scoring rewards
  fail-to-pass progress only when pass-to-pass preservation does not regress.
- Use repo-native tests or focused scripts to reproduce and verify behavior where feasible; do not edit
  benchmark verifier files, hidden tests, or solution files.
- Commit the final code changes if the environment permits, because DeepSWE v1.1 captures committed work.
  If the workspace blocks commits, leave the working tree patch complete and minimal for adapter capture.
- Avoid broad rewrites. Prefer the smallest domain-correct patch that explains itself through tests and
  surrounding code.

Base task instruction sha256: ${sha256(baseInstruction)}
Harness source files:
${fileList}

${embeddedFiles}
# Original DeepSWE Task

`;

writeFileSync(destInstruction, `${harnessPrefix}${baseInstruction}`, "utf8");
writeFileSync(
  metadataPath,
  `${JSON.stringify(
    {
      task_id: taskId,
      source_task: srcTask,
      destination_task: destTask,
      base_instruction_sha256: sha256(baseInstruction),
      harness_instruction_sha256: sha256(readFileSync(destInstruction, "utf8")),
      harness_source_files: harnessFiles.map(({ path, sha256 }) => ({ path, sha256 })),
      rule: "Preserve original DeepSWE task body; prepend only approved supergoal harness reference and DeepSWE scoring contract.",
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`prepared harness task: ${destTask}`);
console.log(`metadata: ${metadataPath}`);
