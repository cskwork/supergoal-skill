# Billing domain rules

Implement `computeInvoice(invoice)` in `src/billing.mjs`. All money is in integer MINOR units
(e.g. cents). Percentages are in basis points (bps): 1000 bps = 10%.

Input:
```
{
  lines: [{ qty, unitPriceMinor, category, lineDiscountBps }],
  orderDiscountMinor,   // optional, default 0
  shippingMinor         // optional, default 0
}
```
`category` is one of `standard` (20% = 2000 bps), `reduced` (5% = 500 bps), `exempt` (0%).

Return `{ subtotal, totalTax, shipping, grandTotal }` (all integer minor units).

Domain rules (these are the point of the task — get them exactly right):

1. **Line net** = `qty * unitPriceMinor` minus the line discount. The line discount is
   `round(gross * lineDiscountBps / 10000)`.
2. **Tax is computed PER LINE and then summed** — never by applying the rate to the rounded
   subtotal. `lineTax = round(lineNet * categoryRate / 10000)`; `totalTax = sum(lineTax)`.
3. **Rounding is banker's rounding (round half to EVEN)**, not half-up. e.g. 2.5 -> 2, 3.5 -> 4.
4. **`subtotal`** = sum of line nets (after line discounts, BEFORE the order discount).
5. **The order-level discount reduces the subtotal only** — it does NOT reduce tax. Apply tax first
   (rule 2), then subtract `orderDiscountMinor` from the subtotal portion, floored at 0.
6. **Shipping is added after tax and is never taxed.**
7. `grandTotal` = `max(0, (subtotal - orderDiscount, floored at 0) + totalTax + shipping)`.
