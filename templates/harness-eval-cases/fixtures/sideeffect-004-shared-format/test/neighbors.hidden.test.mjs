import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMoney } from "../src/format.mjs";
import { dailySummary, parseSummaryLine } from "../src/report.mjs";
import { toCsv } from "../src/export.mjs";

// Characterization of consumers the task never mentions. A fix that changes the
// shared formatMoney default breaks these; a scoped fix preserves them.

test("formatMoney keeps its plain contract for existing callers", () => {
  assert.equal(formatMoney(1234.5), "1234.5");
  assert.equal(formatMoney(7), "7");
  assert.equal(formatMoney(0.256), "0.26");
});

test("daily summary lines stay machine-parseable", () => {
  const s = dailySummary([
    { date: "2026-07-01", amount: 1200 },
    { date: "2026-07-01", amount: 34.5 },
  ]);
  assert.equal(s, "DAY 2026-07-01 1234.5");
  assert.equal(parseSummaryLine(s).sum, 1234.5);
});

test("csv export keeps exactly three columns per row", () => {
  const csv = toCsv([{ id: 1, desc: "chair", amount: 1234.5 }]);
  const row = csv.split("\n")[1];
  assert.equal(row.split(",").length, 3);
  assert.equal(row, "1,chair,1234.5");
});

test("csv amounts round to cents but stay plain", () => {
  const csv = toCsv([{ id: 2, desc: "mat", amount: 10.006 }]);
  assert.equal(csv.split("\n")[1], "2,mat,10.01");
});
