// Shared formatting helpers. Several modules depend on the exact plain output.
export function formatMoney(amount) {
  const n = Math.round(amount * 100) / 100;
  return String(n);
}

export function pad(value, width) {
  return String(value).padStart(width, " ");
}
