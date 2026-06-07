// MiniBill invoice engine (incomplete). Make computeInvoice satisfy the rules in RULES.md.
// The current implementation passes the simple cases but mishandles several domain rules.
const RATES = { standard: 2000, reduced: 500, exempt: 0 };

export function computeInvoice(invoice) {
  const { lines = [], orderDiscountMinor = 0, shippingMinor = 0 } = invoice;
  let subtotal = 0;
  for (const line of lines) {
    const gross = line.qty * line.unitPriceMinor;
    const disc = Math.round((gross * (line.lineDiscountBps || 0)) / 10000);
    subtotal += gross - disc;
  }
  const taxable = Math.max(0, subtotal - orderDiscountMinor) + shippingMinor;
  const rate = RATES[lines[0]?.category] ?? RATES.standard;
  const totalTax = Math.round((taxable * rate) / 10000);
  const grandTotal = Math.max(0, taxable + totalTax);
  return { subtotal, totalTax, shipping: shippingMinor, grandTotal };
}
