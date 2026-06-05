#!/usr/bin/env node
// Frontmatter + size gate for a generated SKILL.md (portable agentskills.io limits).
// Usage: node skill-frontmatter-gate.mjs <skill-dir>
// Exits 0 only when name/description/body satisfy the portable limits; warnings do not fail.

import fs from "node:fs";
import path from "node:path";

const RESERVED = ["anthropic", "claude"];
const NAME_RE = /^[a-z0-9-]+$/;
const COMBINED_CAP = 1536; // description + when_to_use truncation cap in the skill listing
const BODY_WARN = 20000;   // ~5k tokens; the body should stay small (progressive disclosure)

function fail(msg) { console.error(`FAIL: ${msg}`); process.exitCode = 1; }
function warn(msg) { console.error(`WARN: ${msg}`); }

// Minimal frontmatter reader: top-level `key: value` lines between the first --- pair.
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: null, body: text };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, "").trim();
  }
  return { fm, body: m[2] };
}

function checkName(name, dirName) {
  if (!name) { warn("no name field (directory name will be used as the command)"); return; }
  if (name.length > 64) fail(`name >64 chars (${name.length})`);
  if (!NAME_RE.test(name)) fail(`name must be lowercase letters/digits/hyphens: "${name}"`);
  if (RESERVED.includes(name)) fail(`name is the reserved word "${name}"`);
  else if (RESERVED.some((w) => name.includes(w))) warn(`name contains reserved word; some agents may reject "${name}"`);
  if (name !== dirName) warn(`name "${name}" != directory "${dirName}" (command name comes from the directory)`);
}

function main() {
  const dir = process.argv[2];
  if (!dir) { fail("usage: skill-frontmatter-gate.mjs <skill-dir>"); return; }
  const file = path.join(dir, "SKILL.md");
  if (!fs.existsSync(file)) { fail(`no SKILL.md in ${dir}`); return; }
  const { fm, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  if (!fm) { fail("missing YAML frontmatter (--- ... ---)"); return; }

  checkName(fm.name, path.basename(path.resolve(dir)));

  const desc = fm.description || "";
  if (!desc.trim()) fail("description is empty (it is the entire discovery mechanism)");
  const combined = desc.length + (fm.when_to_use ? fm.when_to_use.length : 0);
  if (combined > COMBINED_CAP) fail(`description + when_to_use = ${combined} chars > ${COMBINED_CAP} cap`);
  if (body.length > BODY_WARN) warn(`body ${body.length} chars (>~5k tokens); push reference to bundled files`);

  if (!process.exitCode) {
    console.log(`OK: ${file} (name="${fm.name || path.basename(path.resolve(dir))}", combined desc ${combined}/${COMBINED_CAP}, body ${body.length} chars)`);
  }
}

main();
