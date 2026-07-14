#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node --input-type=module - "$ROOT" <<'NODE'
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const strip = (value) => value.replaceAll("**", "").replaceAll("`", "").trim();

function markdownModes(source) {
  const modes = [];
  for (const line of source.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map(strip);
    const mode = cells[1];
    if (mode && /^[A-Z]+(?:-[A-Z]+)*$/.test(mode) && !modes.includes(mode)) modes.push(mode);
  }
  return modes;
}

function landingModes(source) {
  return [...source.matchAll(/<span class="mode-label">([A-Z]+(?:-[A-Z]+)*)<\/span>/g)].map((match) => match[1]);
}

function assertEqual(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${expected.join(", ")}; got ${actual.join(", ")}`);
  }
}

function architectureRow(source) {
  return source.split("\n").find((line) => line.startsWith("|") && /\|\s*\*\*?ARCHITECTURE\*\*?\s*\|/.test(line));
}

const skill = read("SKILL.md");
const readme = read("README.md");
const readmeKo = read("README.ko.md");
const landing = read("docs/index.html");
const changelog = read("docs/changelog/changelog-2026-07-15.md");
const canonical = markdownModes(skill);

if (canonical.length !== 12) throw new Error(`SKILL.md must define exactly 12 modes; got ${canonical.length}`);
assertEqual("README.md mode order", markdownModes(readme), canonical);
assertEqual("README.ko.md mode order", markdownModes(readmeKo), canonical);
assertEqual("landing mode order", landingModes(landing), canonical);

for (const [label, source] of [["README.md", readme], ["README.ko.md", readmeKo]]) {
  const row = architectureRow(source) ?? "";
  if (!/draw/i.test(row) || !/diagram/i.test(row) || !/그려/.test(row)) {
    throw new Error(`${label} ARCHITECTURE row must document draw / diagram / 그려 routing`);
  }
}

if (!changelog.includes("draw/diagram deliberately left off the landing")) {
  throw new Error("landing draw-route omission must remain a documented exception");
}

console.log(`PASS mode surface parity (${canonical.length} modes)`);
NODE
