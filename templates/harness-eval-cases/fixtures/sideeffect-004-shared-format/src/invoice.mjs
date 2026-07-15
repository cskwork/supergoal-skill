import { formatMoney } from "./format.mjs";

export function renderInvoice(order) {
  const lines = order.items.map(
    (it) => `${it.name} x${it.qty} ${formatMoney(it.price * it.qty)}`,
  );
  const total = order.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  lines.push(`TOTAL ${formatMoney(total)}`);
  return lines.join("\n");
}
