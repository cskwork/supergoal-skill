import test from "node:test";
import assert from "node:assert/strict";
import { computeInvoice } from "../src/billing.mjs";

// Rule 2: tax is per-line then summed, not the rate applied to the summed subtotal.
test("tax is computed per line then summed, not on the rounded subtotal", () => {
  const r = computeInvoice({
    lines: [
      { qty: 1, unitPriceMinor: 30, category: "reduced" },
      { qty: 1, unitPriceMinor: 30, category: "reduced" },
    ],
  });
  assert.equal(r.totalTax, 4); // 2 + 2 per line; round(60*5%)=3 is the wrong (subtotal) answer
});

// Rule 3: banker's rounding (half to even), not half-up.
test("rounding ties go to even (bankers), not half-up", () => {
  const r = computeInvoice({ lines: [{ qty: 1, unitPriceMinor: 50, category: "reduced" }] });
  assert.equal(r.totalTax, 2); // 2.5 -> 2 (even); half-up would give 3
});

// Rule 5: order discount reduces the subtotal only, never the tax.
test("order-level discount reduces subtotal only, not tax", () => {
  const r = computeInvoice({
    lines: [{ qty: 1, unitPriceMinor: 1000, category: "standard" }],
    orderDiscountMinor: 500,
  });
  assert.equal(r.totalTax, 200); // taxed before the order discount
  assert.equal(r.grandTotal, 700); // (1000 - 500) + 200
});

// Rule 6: shipping is added after tax and is not taxed.
test("shipping is added after tax and is not taxed", () => {
  const r = computeInvoice({
    lines: [{ qty: 1, unitPriceMinor: 1000, category: "standard" }],
    shippingMinor: 300,
  });
  assert.equal(r.totalTax, 200);
  assert.equal(r.grandTotal, 1500); // 1000 + 200 + 300
});
