const RATES = {
  SAVE10: 0.10,
  VIP15: 0.10,
};

export function discountedTotal(totalMinor, code) {
  const rate = RATES[code] ?? 0;
  return Math.round(totalMinor * (1 - rate));
}

