import { formatMoney } from "./format.mjs";

// Emits "DAY <date> <sum>" lines. Downstream tooling re-parses the sum with
// Number(...), so the amount must stay a plain numeric string.
export function dailySummary(entries) {
  const byDate = new Map();
  for (const e of entries) {
    byDate.set(e.date, (byDate.get(e.date) || 0) + e.amount);
  }
  return [...byDate.entries()]
    .map(([date, sum]) => `DAY ${date} ${formatMoney(sum)}`)
    .join("\n");
}

export function parseSummaryLine(line) {
  const m = /^DAY (\S+) (\S+)$/.exec(line);
  if (!m) throw new Error(`unparseable summary line: ${line}`);
  return { date: m[1], sum: Number(m[2]) };
}
