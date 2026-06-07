#!/usr/bin/env node
// Pre-flight: prove the eval is fair + achievable BEFORE spending codex tokens.
// 1) each stub must FAIL its visible tests (so both arms must really implement).
// 2) a correct reference impl must PASS all visible + hidden checks (so hidden
//    expectations are correct and the bar is reachable).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { CASES } from "./run.mjs";

// String.raw preserves backslashes (\r \n \d) literally in the emitted source.
const refs = {
  "underspec-csv": String.raw`export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let started = false;
  let i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; started = true; i++; continue; }
    if (ch === ',') { pushField(); started = true; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { pushField(); pushRow(); started = false; i++; continue; }
    field += ch; started = true; i++;
  }
  if (started || field.length > 0 || row.length > 0) { pushField(); pushRow(); }
  return rows;
}
`,
  "underspec-lru": String.raw`export class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);
    return v;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }
}
`,
  "underspec-semver": String.raw`function isNumeric(s) {
  return s.length > 0 && [...s].every((c) => c >= '0' && c <= '9');
}
function parse(v) {
  const plus = v.indexOf('+');
  if (plus !== -1) v = v.slice(0, plus);
  const dash = v.indexOf('-');
  let core = v, pre = [];
  if (dash !== -1) { core = v.slice(0, dash); pre = v.slice(dash + 1).split('.'); }
  return { main: core.split('.').map(Number), pre };
}
export function compareVersions(a, b) {
  const pa = parse(a), pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa.main[i] !== pb.main[i]) return pa.main[i] < pb.main[i] ? -1 : 1;
  }
  if (pa.pre.length === 0 && pb.pre.length === 0) return 0;
  if (pa.pre.length === 0) return 1;
  if (pb.pre.length === 0) return -1;
  const len = Math.max(pa.pre.length, pb.pre.length);
  for (let i = 0; i < len; i++) {
    if (i >= pa.pre.length) return -1;
    if (i >= pb.pre.length) return 1;
    const x = pa.pre[i], y = pb.pre[i];
    const xn = isNumeric(x), yn = isNumeric(y);
    if (xn && yn) { const d = Number(x) - Number(y); if (d !== 0) return d < 0 ? -1 : 1; }
    else if (xn && !yn) return -1;
    else if (!xn && yn) return 1;
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
`,
};

const pkg = `${JSON.stringify({ type: "module", scripts: { test: "node --test" } }, null, 2)}\n`;
let ok = true;
for (const c of CASES) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pf-${c.id}-`));
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "test"), { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), pkg);
  fs.writeFileSync(path.join(dir, c.visibleTest), c.visible);
  fs.writeFileSync(path.join(dir, c.hiddenTest), c.hidden);

  // 1) stub fails visible
  fs.writeFileSync(path.join(dir, c.source), c.stub);
  const stub = spawnSync("node", ["--test", c.visibleTest], { cwd: dir, encoding: "utf8" });
  const stubFailsVisible = stub.status !== 0;

  // 2) reference passes everything
  fs.writeFileSync(path.join(dir, c.source), refs[c.id]);
  const ref = spawnSync("node", ["--test"], { cwd: dir, encoding: "utf8" });
  const out = `${ref.stdout || ""}${ref.stderr || ""}`;
  const refPassesAll = ref.status === 0 && /# fail 0\b/.test(out);
  const pass = (out.match(/# pass (\d+)/) || [])[1] || "?";
  const fail = (out.match(/# fail (\d+)/) || [])[1] || "?";

  console.log(`${c.id}: stubFailsVisible=${stubFailsVisible}  refPassesAll=${refPassesAll}  (pass ${pass} / fail ${fail})`);
  if (!stubFailsVisible || !refPassesAll) { ok = false; console.log(out); }
}
console.log(ok ? "PREFLIGHT OK" : "PREFLIGHT FAILED");
process.exit(ok ? 0 : 1);
