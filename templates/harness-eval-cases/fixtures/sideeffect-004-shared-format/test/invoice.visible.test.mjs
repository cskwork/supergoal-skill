import assert from "node:assert/strict";
import { test } from "node:test";
import { renderInvoice } from "../src/invoice.mjs";

test("invoice renders currency-style amounts", () => {
  const inv = renderInvoice({ items: [{ name: "Desk", qty: 1, price: 1234.5 }] });
  assert.match(inv, /Desk x1 \$1,234\.50/);
  assert.match(inv, /TOTAL \$1,234\.50/);
});

test("invoice always shows two decimals", () => {
  const inv = renderInvoice({ items: [{ name: "Pen", qty: 2, price: 3.5 }] });
  assert.match(inv, /Pen x2 \$7\.00/);
  assert.match(inv, /TOTAL \$7\.00/);
});
