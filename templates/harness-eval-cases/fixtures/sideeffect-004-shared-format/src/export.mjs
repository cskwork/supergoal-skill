import { formatMoney } from "./format.mjs";

// Consumers split rows on "," - the amount column must never contain a comma
// or extra characters.
export function toCsv(rows) {
  return [
    "id,desc,amount",
    ...rows.map((r) => `${r.id},${r.desc},${formatMoney(r.amount)}`),
  ].join("\n");
}
