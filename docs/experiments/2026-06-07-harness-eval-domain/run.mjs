#!/usr/bin/env node
// Multi-case HARNESS-EVAL for DOMAIN-KNOWLEDGE cases. Same v2 scorer/methodology as
// ../2026-06-06-harness-eval-spark-high-lsp-v2 (gradient correctness, granular per-test checks,
// decontaminated harness-ref, crash-aware cost), generalized to load fixtures from disk and loop
// over cases. Each case ships RULES.md (the domain spec); the visible tests do NOT cover the subtle
// rules - only careful RULES.md reading + the injected hidden tests do.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EXP, "../../..");
const FIXTURES = path.join(EXP, "fixtures");
const RUN_ROOT = process.env.SG_EVAL_RUN_ROOT || "/tmp/sg-domain-eval";
const MODEL = process.env.SG_EVAL_MODEL || "gpt-5.3-codex-spark";
const EFFORT = process.env.SG_EVAL_EFFORT || "high";
const EFFORT_CONFIG = `model_reasoning_effort="${EFFORT}"`;
const HARNESS_SKILL = process.env.SG_EVAL_HARNESS_SKILL || "";
const TIMEOUT_MS = Number(process.env.SG_EVAL_TIMEOUT_MS || 1800000);

const cases = [
  {
    id: "billing-tax",
    title: "Invoice tax/discount engine",
    difficulty: "hard",
    dir: "billing",
    srcFile: "src/billing.mjs",
    visibleTest: "test/billing.visible.test.mjs",
    hiddenTest: "test/billing.hidden.test.mjs",
  },
  {
    id: "shipping-rates",
    title: "Shipping rate engine",
    difficulty: "hard",
    dir: "shipping",
    srcFile: "src/shipping.mjs",
    visibleTest: "test/shipping.visible.test.mjs",
    hiddenTest: "test/shipping.hidden.test.mjs",
  },
];

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

// Copy the fixture into a fresh sandbox, EXCLUDING the hidden test (injected after the agent runs).
function writeFixture(caseDef, arm) {
  const src = path.join(FIXTURES, caseDef.dir);
  const dst = path.join(RUN_ROOT, "sandboxes", caseDef.id, arm);
  ensureCleanDir(dst);
  const hiddenAbs = path.join(src, caseDef.hiddenTest);
  fs.cpSync(src, dst, { recursive: true, filter: (p) => p !== hiddenAbs });
  return dst;
}

function injectHiddenTest(caseDef, cwd) {
  fs.copyFileSync(path.join(FIXTURES, caseDef.dir, caseDef.hiddenTest), path.join(cwd, caseDef.hiddenTest));
}

function copyHarnessRef() {
  const ref = path.join(RUN_ROOT, "harness-ref");
  ensureCleanDir(ref);
  for (const name of ["SKILL.md", "README.md", "reference", "agents", "templates"]) {
    const source = path.join(ROOT, name);
    const target = path.join(ref, name);
    if (!fs.existsSync(source)) continue;
    // Decontaminate: never expose eval-internal case definitions.
    fs.cpSync(source, target, {
      recursive: true,
      filter: (p) => !p.split(path.sep).includes("harness-eval-cases"),
    });
  }
  if (HARNESS_SKILL && fs.existsSync(HARNESS_SKILL)) {
    fs.copyFileSync(HARNESS_SKILL, path.join(ref, "SKILL.md"));
  }
  return ref;
}

function promptFor(caseDef, arm, harnessRef) {
  const shared = [
    `Case: ${caseDef.id} (${caseDef.difficulty}) - ${caseDef.title}`,
    `The working directory already contains the project. Read RULES.md (the domain rules), ${caseDef.srcFile} (the stub to complete), and the visible tests under test/.`,
    `Implement ${caseDef.srcFile} so it satisfies EVERY rule in RULES.md - the visible tests do not cover every rule, so apply the spec carefully. Run \`npm test\` until tests pass.`,
  ];
  if (arm === "baseline") {
    return [
      ...shared,
      "Condition: baseline without harness.",
      "Do not read or use supergoal, harness docs, role packs, or workflow skills. Use ordinary problem solving only.",
    ].join("\n");
  }
  return [
    ...shared,
    "Condition: with_harness.",
    `Use the approved supergoal skill at ${path.join(harnessRef, "SKILL.md")}.`,
    "Read it first, route the task through the smallest applicable supergoal mode, and apply its discipline in this noninteractive eval.",
  ].join("\n");
}

function runCodex(caseDef, arm, cwd, prompt, harnessRef) {
  const outFile = path.join(EXP, "raw", `${caseDef.id}-${arm}-final.txt`);
  const args = [
    "exec", "-m", MODEL, "-c", EFFORT_CONFIG,
    "--disable", "image_generation", "--json", "--ephemeral", "--skip-git-repo-check",
    "--sandbox", "workspace-write", "-C", cwd, "--output-last-message", outFile,
  ];
  if (arm === "harness") args.push("--add-dir", harnessRef);
  args.push(prompt);
  const started = Date.now();
  const run = spawnSync("codex", args, { encoding: "utf8", timeout: TIMEOUT_MS });
  const durationMs = Date.now() - started;
  const log = `${run.stdout || ""}${run.stderr || ""}`;
  writeFile(path.join(EXP, "raw", `${caseDef.id}-${arm}.log`), log);
  const cost = parseCost(log, durationMs);
  cost.crashed = run.status !== 0 || cost.turns_completed === 0;
  return { exit_code: run.status, signal: run.signal, cost };
}

function parseCost(log, durationMs) {
  let tokens = 0;
  let turns = 0;
  for (const line of log.split(/\n/)) {
    try {
      const event = JSON.parse(line);
      if (event.type === "turn.completed" && event.usage) {
        turns += 1;
        tokens = event.usage.total_tokens
          ?? ((event.usage.input_tokens || 0) + (event.usage.output_tokens || 0));
      }
    } catch {
      // status lines are not JSON
    }
  }
  const toolCalls = (log.match(/"type":\s*"(function_call|command_execution)"/g) || []).length;
  return { tokens, duration_ms: durationMs, tool_calls: toolCalls, turns_completed: turns };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTestNames(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const names = [];
  const re = /\btest\(\s*(['"`])(.+?)\1/g;
  let m;
  while ((m = re.exec(text))) names.push(m[2]);
  return names;
}

function runNamedTest(cwd, name) {
  const pattern = `^${escapeRegex(name)}$`;
  const r = spawnSync("node", ["--test", "--test-name-pattern", pattern], { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return r.status === 0 && /# pass [1-9]/.test(out) && /# fail 0\b/.test(out);
}

function granularChecks(caseDef, cwd) {
  const named = [
    ...extractTestNames(path.join(cwd, caseDef.visibleTest)).map((n) => ({ name: n, kind: "visible" })),
    ...extractTestNames(path.join(cwd, caseDef.hiddenTest)).map((n) => ({ name: n, kind: "hidden" })),
  ];
  return named.map((t) => ({
    name: `${caseDef.id} ${t.kind} test: ${t.name}`,
    kind: t.kind,
    status: runNamedTest(cwd, t.name) ? "pass" : "fail",
  }));
}

function runCheck(caseDef, cwd, check) {
  const r = spawnSync(check.cmd, check.args, { cwd, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  return {
    name: `${caseDef.id} ${check.name}`,
    status: r.status === 0 ? "pass" : "fail",
    evidence: `${check.cmd} ${check.args.join(" ")} exit=${r.status}; ${out ? out.slice(0, 160) : "no output"}`,
  };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

// Generalized (domain-agnostic) v2 scorer: uncapped, gradient correctness/feature over per-test pass.
function scoreQuality(cwd, granular) {
  const sourceFiles = listFiles(path.join(cwd, "src")).filter((f) => f.endsWith(".mjs"));
  const testText = listFiles(path.join(cwd, "test"))
    .filter((f) => f.endsWith(".mjs") && !f.includes(".hidden."))
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n");
  const sourceText = sourceFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const sourceLines = sourceText ? sourceText.split(/\n/).length : 0;
  const total = granular.length || 1;
  const passed = granular.filter((c) => c.status === "pass").length;
  const frac = passed / total;
  const allPass = passed === total && granular.length > 0;
  const assertionCount = (testText.match(/\bassert\b/g) || []).length;
  const hasValidation = /throw |try\s*\{|TypeError|Error\(/.test(sourceText);
  const hasTryCatch = /\btry\s*\{/.test(sourceText);
  const hasComments = (sourceText.match(/\/\//g) || []).length >= 2;
  const hasReadme = fs.existsSync(path.join(cwd, "README.md"));
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const round = (v) => Math.max(0, Math.min(10, Math.round(v)));

  let codeQuality = 10;
  if (/TODO|console\.log/.test(sourceText)) codeQuality -= 3;
  if (sourceLines > 900) codeQuality -= 2;
  else if (sourceLines > 600) codeQuality -= 1;
  codeQuality = Math.max(0, codeQuality);

  const dimensions = {
    feature_completeness: { score: allPass ? 10 : round(3 + 6 * frac), rationale: `${passed}/${total} behavior tests pass.` },
    test_coverage: { score: assertionCount >= 24 ? 10 : assertionCount >= 12 ? 8 : assertionCount >= 6 ? 6 : 4, rationale: `${assertionCount} visible assertions.` },
    code_quality: { score: codeQuality, rationale: `${sourceLines} source lines.` },
    error_handling: { score: hasValidation ? (hasTryCatch ? 10 : 9) : 6, rationale: hasValidation ? "Has validation/error paths." : "Thin failure handling." },
    efficiency: { score: deps === 0 ? 10 : 7, rationale: deps === 0 ? "No runtime dependencies." : "Adds dependencies." },
    correctness: { score: round(10 * frac), rationale: allPass ? "All behavior tests passed." : `Failing ${total - passed} of ${total} behavior tests.` },
    architecture: { score: sourceFiles.length >= 3 ? 10 : sourceFiles.length === 2 ? 8 : 6, rationale: `${sourceFiles.length} source module(s).` },
    extensibility: { score: sourceFiles.length >= 2 ? 9 : 7, rationale: sourceFiles.length >= 2 ? "Multiple modules." : "Single module." },
    documentation: { score: hasReadme ? 10 : hasComments ? 7 : 4, rationale: hasReadme ? "README present." : hasComments ? "Local comments." : "No added docs." },
    dev_environment: { score: pkg.scripts?.test ? 9 : 5, rationale: "npm test script present." },
  };
  return {
    total: Object.values(dimensions).reduce((s, d) => s + d.score, 0),
    pass_fraction: Number(frac.toFixed(3)),
    checks_passed: passed,
    checks_total: total,
    dimensions,
  };
}

function runArm(caseDef, arm, harnessRef) {
  const cwd = writeFixture(caseDef, arm);
  const codex = runCodex(caseDef, arm, cwd, promptFor(caseDef, arm, harnessRef), harnessRef);
  injectHiddenTest(caseDef, cwd);
  const granular = granularChecks(caseDef, cwd);
  const syntax = [{ name: "source syntax", cmd: "node", args: ["--check", caseDef.srcFile] }].map((c) => runCheck(caseDef, cwd, c));
  return { cwd, codex, checks: [...granular, ...syntax], granular, quality: scoreQuality(cwd, granular) };
}

function avg(nums) {
  return nums.length ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10 : 0;
}

function main() {
  ensureCleanDir(path.join(EXP, "raw"));
  ensureCleanDir(path.join(RUN_ROOT, "sandboxes"));
  const harnessRef = copyHarnessRef();
  const results = {};
  for (const caseDef of cases) {
    results[caseDef.id] = {
      baseline: runArm(caseDef, "baseline", harnessRef),
      harness: runArm(caseDef, "harness", harnessRef),
    };
  }

  const perCase = cases.map((c) => {
    const b = results[c.id].baseline;
    const h = results[c.id].harness;
    return {
      id: c.id,
      baseline: { score: b.quality.total, passed: b.quality.checks_passed, total: b.quality.checks_total, crashed: b.codex.cost.crashed, tokens: b.codex.cost.tokens, duration_ms: b.codex.cost.duration_ms },
      harness: { score: h.quality.total, passed: h.quality.checks_passed, total: h.quality.checks_total, crashed: h.codex.cost.crashed, tokens: h.codex.cost.tokens, duration_ms: h.codex.cost.duration_ms },
    };
  });

  const aggregate = {
    baseline_avg_score: avg(perCase.map((c) => c.baseline.score)),
    harness_avg_score: avg(perCase.map((c) => c.harness.score)),
    baseline_avg_passfrac: avg(perCase.map((c) => c.baseline.passed / c.baseline.total)),
    harness_avg_passfrac: avg(perCase.map((c) => c.harness.passed / c.harness.total)),
    baseline_avg_tokens: Math.round(avg(perCase.map((c) => c.baseline.tokens))),
    harness_avg_tokens: Math.round(avg(perCase.map((c) => c.harness.tokens))),
    baseline_crashes: perCase.filter((c) => c.baseline.crashed).length,
    harness_crashes: perCase.filter((c) => c.harness.crashed).length,
  };

  const out = {
    runtime_adapter: `codex-exec:${MODEL}:reasoning-${EFFORT}`,
    harness_skill: HARNESS_SKILL ? path.basename(HARNESS_SKILL) : "current",
    per_case: perCase,
    aggregate,
    cases: results,
  };
  writeFile(path.join(EXP, "result.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify({ per_case: perCase, aggregate, adapter: out.runtime_adapter, skill: out.harness_skill }, null, 2));
}

main();
