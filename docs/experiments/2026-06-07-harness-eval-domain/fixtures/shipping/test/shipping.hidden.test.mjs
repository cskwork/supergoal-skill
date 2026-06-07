import test from "node:test";
import assert from "node:assert/strict";
import { computeShipping } from "../src/shipping.mjs";

// Rule 1: a light but bulky parcel is billed by volumetric weight.
test("volumetric weight wins for a light bulky parcel", () => {
  const r = computeShipping({ weightGrams: 500, dims: { l: 50, w: 40, h: 30 }, zone: "A" });
  assert.equal(r.billableGrams, 12000); // 50*40*30/5 = 12000 g > 500 g
  assert.equal(r.totalMinor, 2900); // 500 + 200*12
});

// Rule 2: billable kg rounds UP.
test("billable kg rounds up past a kilo boundary", () => {
  const r = computeShipping({ weightGrams: 1001, dims: { l: 10, w: 10, h: 10 }, zone: "A" });
  assert.equal(r.totalMinor, 900); // 1001 g -> 2 kg -> 500 + 200*2
});

// Rule 4: oversize surcharge when any dimension exceeds 100 cm.
test("oversize dimension adds the surcharge", () => {
  const r = computeShipping({ weightGrams: 2000, dims: { l: 120, w: 10, h: 10 }, zone: "A" });
  assert.equal(r.billableGrams, 2400); // volumetric 120*10*10/5 = 2400 > 2000
  assert.equal(r.totalMinor, 2600); // (500 + 200*3) + 1500 oversize
});

// Rule 6: free shipping waives base+weight but surcharges still apply.
test("free shipping still charges insurance surcharge", () => {
  const r = computeShipping({
    weightGrams: 2000,
    dims: { l: 10, w: 10, h: 10 },
    zone: "A",
    declaredValueMinor: 60000,
  });
  assert.equal(r.totalMinor, 600); // base+weight waived; insurance = 1% of 60000
});
