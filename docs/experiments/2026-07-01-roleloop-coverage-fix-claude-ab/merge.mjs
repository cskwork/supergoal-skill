#!/usr/bin/env node
// Merge per-arm result-*.json (from the parallel run) into one result.json
// that stats.mjs consumes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXP = path.dirname(fileURLToPath(import.meta.url));
const parts = (process.env.SG_MERGE_PARTS || "-baseline,-arms3").split(",");
const merged = { case: null, model: null, seeds: null, runtime_adapter: null, arms: {}, per_seed: [] };
for (const suf of parts) {
  const f = path.join(EXP, `result${suf}.json`);
  if (!fs.existsSync(f)) { console.error(`MISSING ${f}`); continue; }
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  merged.case ||= d.case; merged.model ||= d.model; merged.seeds ||= d.seeds; merged.runtime_adapter ||= d.runtime_adapter;
  Object.assign(merged.arms, d.arms);
  merged.per_seed.push(...d.per_seed);
}
fs.writeFileSync(path.join(EXP, "result.json"), JSON.stringify(merged, null, 2));
console.error(`[merge] arms: ${Object.keys(merged.arms).join(", ")}  per_seed rows: ${merged.per_seed.length}`);
console.log(JSON.stringify(merged.arms, null, 2));
