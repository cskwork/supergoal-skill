import test from "node:test";
import assert from "node:assert/strict";
import { computeShipping } from "../src/shipping.mjs";

test("zone A dense parcel charged by actual weight", () => {
  const r = computeShipping({ weightGrams: 2000, dims: { l: 10, w: 10, h: 10 }, zone: "A" });
  assert.equal(r.billableGrams, 2000);
  assert.equal(r.totalMinor, 900); // 500 + 200*2
});

test("zone B sub-kilo parcel bills at least 1 kg", () => {
  const r = computeShipping({ weightGrams: 500, dims: { l: 5, w: 5, h: 5 }, zone: "B" });
  assert.equal(r.billableGrams, 500);
  assert.equal(r.totalMinor, 1150); // 800 + 350*1
});

test("zone C 3 kg parcel", () => {
  const r = computeShipping({ weightGrams: 3000, dims: { l: 20, w: 20, h: 10 }, zone: "C" });
  assert.equal(r.billableGrams, 3000);
  assert.equal(r.totalMinor, 2700); // 1200 + 500*3
});
