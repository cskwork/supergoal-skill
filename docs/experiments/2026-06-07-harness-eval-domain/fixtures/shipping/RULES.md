# Shipping domain rules

Implement `computeShipping(parcel)` in `src/shipping.mjs`. Money is integer MINOR units.

Input:
```
{ weightGrams, dims: { l, w, h },  // cm
  zone,                            // 'A' | 'B' | 'C'
  declaredValueMinor }             // optional, default 0
```

Return `{ billableGrams, totalMinor }`.

Zone rates (minor units): A = base 500 + 200/kg, B = base 800 + 350/kg, C = base 1200 + 500/kg.

Domain rules (the point of the task — get them exactly right):

1. **Volumetric weight** = `ceil(l * w * h / 5)` grams. **Billable weight = max(actual weight,
   volumetric weight)** — a light but bulky parcel is charged by volume.
2. **Billable kg rounds UP** to the next whole kg: `kg = max(1, ceil(billableGrams / 1000))`. 1001 g
   is 2 kg, not 1.
3. **weight charge** = `perKg * kg`; **base+weight** = `base + weight charge`.
4. **Oversize surcharge**: if ANY dimension > 100 cm, add 1500.
5. **Insurance surcharge**: if `declaredValueMinor > 10000`, add `ceil(declaredValueMinor * 100 /
   10000)` (1% of declared value, rounded up).
6. **Free shipping**: if `declaredValueMinor >= 50000`, the base+weight charge is WAIVED (0) — but
   **surcharges (oversize, insurance) still apply.**
7. `totalMinor` = `(freeShipping ? 0 : base+weight) + surcharges`.
