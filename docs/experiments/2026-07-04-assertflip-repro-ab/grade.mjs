#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(EXP, "fixtures");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") args.list = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function readSpec(fixtureDir) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, "hidden-spec.json"), "utf8"));
}

function listFixtureDirs(dir = FIXTURES) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fs.existsSync(path.join(full, "hidden-spec.json"))) out.push(full);
      else out.push(...listFixtureDirs(full));
    }
  }
  return out.sort();
}

function listFixtures() {
  for (const fixtureDir of listFixtureDirs()) {
    const spec = readSpec(fixtureDir);
    const rel = path.relative(FIXTURES, fixtureDir);
    console.log(`${rel}\t${spec.stratum}\t${spec.bug}`);
  }
}

function findFixture(name) {
  const direct = path.join(FIXTURES, name);
  if (fs.existsSync(path.join(direct, "hidden-spec.json"))) return direct;
  const matches = listFixtureDirs().filter((dir) => path.basename(dir) === name);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`fixture name is ambiguous: ${name}`);
  throw new Error(`fixture not found: ${name}`);
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyFixture(fixtureDir, dst) {
  ensureCleanDir(dst);
  fs.cpSync(fixtureDir, dst, {
    recursive: true,
    filter: (source) => path.basename(source) !== "hidden-spec.json",
  });
}

function installCandidateTest(srcFile, cwd) {
  const target = path.join(cwd, "test", "candidate.test.mjs");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(srcFile, target);
  return "test/candidate.test.mjs";
}

function overlayFix(fixSrc, cwd, spec) {
  const stat = fs.statSync(fixSrc);
  if (stat.isDirectory()) {
    fs.cpSync(fixSrc, path.join(cwd, "src"), { recursive: true, force: true });
    return;
  }
  const target = path.join(cwd, spec.module);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(fixSrc, target);
}

function runNodeTest(cwd, testFile) {
  const run = spawnSync("node", ["--test", testFile], { cwd, encoding: "utf8", timeout: 120000 });
  return {
    status: run.status,
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    output: `${run.stdout || ""}${run.stderr || ""}`,
  };
}

function isAssertionFailure(result) {
  const out = result.output;
  const assertion = /AssertionError|ERR_ASSERTION/.test(out);
  const setup = /ERR_MODULE_NOT_FOUND|ERR_PACKAGE_PATH_NOT_EXPORTED|SyntaxError|Cannot find module/.test(out);
  return result.status !== 0 && assertion && !setup;
}

function testTargetsBuggyPath(testFile, spec) {
  const text = fs.readFileSync(testFile, "utf8");
  return text.includes(spec.module) || text.includes(spec.export);
}

function oracleSource(spec) {
  const lines = [
    "import test from 'node:test';",
    "import assert from 'node:assert/strict';",
    `import * as mod from '../${spec.module}';`,
    "",
    `const cases = ${JSON.stringify(spec.cases, null, 2)};`,
    `const fn = mod[${JSON.stringify(spec.export)}];`,
    "",
    "for (const c of cases) {",
    "  test(c.name, () => {",
    "    assert.deepEqual(fn(...c.args), c.expect);",
    "  });",
    "}",
    "",
  ];
  return lines.join("\n");
}

function installOracle(cwd, spec) {
  const target = path.join(cwd, "test", "oracle.hidden.test.mjs");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, oracleSource(spec));
  return "test/oracle.hidden.test.mjs";
}

function score({ fixture, test, fixSrc }) {
  assert(fixture, "--fixture is required");
  assert(test, "--test is required");
  assert(fixSrc, "--fix-src is required");

  const fixtureDir = findFixture(fixture);
  const spec = readSpec(fixtureDir);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "assertflip-grade-"));
  const headDir = path.join(tmp, "head");
  const fixedDir = path.join(tmp, "fixed");

  copyFixture(fixtureDir, headDir);
  copyFixture(fixtureDir, fixedDir);

  const headTest = installCandidateTest(path.resolve(test), headDir);
  const fixedTest = installCandidateTest(path.resolve(test), fixedDir);
  overlayFix(path.resolve(fixSrc), fixedDir, spec);

  const head = runNodeTest(headDir, headTest);
  const fixed = runNodeTest(fixedDir, fixedTest);
  const oracleFile = installOracle(fixedDir, spec);
  const oracle = runNodeTest(fixedDir, oracleFile);

  const assertionRed = isAssertionFailure(head);
  const targetsBuggyPath = testTargetsBuggyPath(path.resolve(test), spec);
  const validRepro = head.status !== 0 && assertionRed && targetsBuggyPath && fixed.status === 0;
  const resolved = validRepro && oracle.status === 0;

  const result = {
    fixture: path.relative(FIXTURES, fixtureDir),
    stratum: spec.stratum,
    valid_repro: validRepro,
    resolved,
    checks: {
      head_fails: head.status !== 0,
      head_assertion_failure: assertionRed,
      head_targets_buggy_path: targetsBuggyPath,
      post_fix_candidate_test_passes: fixed.status === 0,
      post_fix_oracle_passes: oracle.status === 0,
    },
    failure_classification: assertionRed ? "assertion" : "invalid_or_setup",
    command_outputs: {
      head: head.output.slice(0, 2000),
      fixed: fixed.output.slice(0, 2000),
      oracle: oracle.output.slice(0, 2000),
    },
  };

  console.log(JSON.stringify(result, null, 2));
  return result.valid_repro && result.resolved ? 0 : 1;
}

const args = parseArgs(process.argv.slice(2));
if (args.list) {
  listFixtures();
  process.exit(0);
}

try {
  process.exit(score(args));
} catch (error) {
  console.error(error.message);
  console.error("Usage: node grade.mjs --fixture stratum-i/normalize-score --test repro.test.mjs --fix-src src/");
  process.exit(2);
}
