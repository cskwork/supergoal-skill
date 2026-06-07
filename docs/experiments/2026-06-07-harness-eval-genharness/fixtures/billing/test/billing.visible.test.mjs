import test from "node:test";
import assert from "node:assert/strict";
import { computeInvoice } from "../src/billing.mjs";

test("standard line totals with 20% tax", () => {
  const r = computeInvoice({ lines: [{ qty: 2, unitPriceMinor: 1000, category: "standard" }] });
  assert.equal(r.subtotal, 2000);
  assert.equal(r.totalTax, 400);
  assert.equal(r.shipping, 0);
  assert.equal(r.grandTotal, 2400);
});

test("exempt category is not taxed", () => {
  const r = computeInvoice({ lines: [{ qty: 1, unitPriceMinor: 5000, category: "exempt" }] });
  assert.equal(r.subtotal, 5000);
  assert.equal(r.totalTax, 0);
  assert.equal(r.grandTotal, 5000);
});

test("per-line percentage discount then tax", () => {
  const r = computeInvoice({
    lines: [{ qty: 1, unitPriceMinor: 1000, category: "standard", lineDiscountBps: 1000 }],
  });
  assert.equal(r.subtotal, 900);
  assert.equal(r.totalTax, 180);
  assert.equal(r.grandTotal, 1080);
});

test("reduced-rate line at 5%", () => {
  const r = computeInvoice({ lines: [{ qty: 1, unitPriceMinor: 2000, category: "reduced" }] });
  assert.equal(r.subtotal, 2000);
  assert.equal(r.totalTax, 100);
  assert.equal(r.grandTotal, 2100);
});
