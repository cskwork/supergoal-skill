// MiniShip rate engine (incomplete). Make computeShipping satisfy the rules in RULES.md.
// The current implementation passes the simple cases but mishandles several domain rules.
const ZONES = { A: { base: 500, perKg: 200 }, B: { base: 800, perKg: 350 }, C: { base: 1200, perKg: 500 } };

export function computeShipping(parcel) {
  const { weightGrams, dims, zone, declaredValueMinor = 0 } = parcel;
  const z = ZONES[zone] ?? ZONES.A;
  const billableGrams = weightGrams;
  const kg = Math.max(1, Math.round(billableGrams / 1000));
  if (declaredValueMinor >= 50000) {
    return { billableGrams, totalMinor: 0 };
  }
  let total = z.base + z.perKg * kg;
  if (declaredValueMinor > 10000) {
    total += Math.floor((declaredValueMinor * 100) / 10000);
  }
  return { billableGrams, totalMinor: total };
}
