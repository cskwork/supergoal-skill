#!/usr/bin/env node
// Read-only audit for active skill installs. It reports whether known agent
// skill directories point at the supplied source and whether their SKILL.md
// content has drifted.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage() {
  console.error("usage: node templates/skill-install-audit.mjs <source-skill-dir> [--home <home-dir>]");
  process.exit(2);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 1) usage();
  const parsed = { source: args[0], home: os.homedir() };
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === "--home" && args[i + 1]) {
      parsed.home = args[i + 1];
      i += 1;
    } else {
      usage();
    }
  }
  return parsed;
}

function readFile(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

function hashFile(file) {
  return crypto.createHash("sha256").update(readFile(file)).digest("hex");
}

function skillName(skillText, sourceDir) {
  const match = skillText.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!match) return path.basename(path.resolve(sourceDir));
  for (const line of match[1].split("\n")) {
    const key = line.match(/^name:\s*["']?([^"'\s]+)["']?\s*$/);
    if (key) return key[1];
  }
  return path.basename(path.resolve(sourceDir));
}

function sameRealPath(a, b) {
  try {
    return fs.realpathSync(a) === fs.realpathSync(b);
  } catch {
    return false;
  }
}

function auditTarget({ label, targetDir, sourceDir, sourceHash, errors }) {
  if (!fs.existsSync(targetDir)) {
    console.log(`SKIP ${label} missing: ${targetDir}`);
    return;
  }

  const stat = fs.lstatSync(targetDir);
  const skillFile = path.join(targetDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    errors.push(`DRIFT ${label} missing SKILL.md at ${skillFile}`);
    return;
  }

  const targetHash = hashFile(skillFile);
  if (targetHash !== sourceHash) {
    errors.push(`DRIFT ${label} SKILL.md hash differs: ${targetHash.slice(0, 12)} != ${sourceHash.slice(0, 12)}`);
    return;
  }

  if (stat.isSymbolicLink()) {
    const link = fs.readlinkSync(targetDir);
    if (sameRealPath(targetDir, sourceDir)) {
      console.log(`OK ${label} symlink -> ${link}`);
    } else {
      console.log(`WARN ${label} symlink target is not source but SKILL.md hash matches -> ${link}`);
    }
    return;
  }

  if (stat.isDirectory()) {
    console.log(`WARN copied install ${label}: SKILL.md hash matches; symlink recommended to avoid drift`);
    return;
  }

  errors.push(`DRIFT ${label} is not a directory or symlink: ${targetDir}`);
}

function main() {
  const args = parseArgs(process.argv);
  const sourceDir = path.resolve(args.source);
  const sourceSkill = path.join(sourceDir, "SKILL.md");
  if (!fs.existsSync(sourceSkill)) {
    console.error(`INSTALL-AUDIT FAIL: source SKILL.md missing: ${sourceSkill}`);
    process.exit(2);
  }

  const sourceText = readFile(sourceSkill);
  const name = skillName(sourceText, sourceDir);
  const sourceHash = hashFile(sourceSkill);
  const home = path.resolve(args.home);
  const targets = [
    ["agents", path.join(home, ".agents", "skills", name)],
    ["codex", path.join(home, ".codex", "skills", name)],
    ["claude", path.join(home, ".claude", "skills", name)],
  ];
  const errors = [];

  console.log(`SOURCE ${sourceDir} name=${name} hash=${sourceHash.slice(0, 12)}`);
  for (const [label, targetDir] of targets) {
    auditTarget({ label, targetDir, sourceDir, sourceHash, errors });
  }

  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error("INSTALL-AUDIT FAIL");
    process.exit(1);
  }

  console.log("INSTALL-AUDIT PASS");
}

main();
