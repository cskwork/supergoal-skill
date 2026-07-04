#!/usr/bin/env python3
"""Haiku 3-way analysis: no-skill(0) vs shipped(B) vs assertflip(A) on real sympy bugs, fail-to-pass.
Reads graded_haiku.json (one file, all three arms). Stratified permutation within instance."""
import json, os, random
from collections import defaultdict

HERE = os.path.dirname(__file__)
rows = json.load(open(os.path.join(HERE, "graded_haiku.json")))
byinst = defaultdict(lambda: defaultdict(list))
for r in rows:
    byinst[r["id"]][r["arm"]].append(r["valid_f2p"])

def rate(arm):
    v = sum(r["valid_f2p"] for r in rows if r["arm"] == arm)
    n = sum(1 for r in rows if r["arm"] == arm)
    return v, n

print("=== per-instance valid_f2p (0=no-skill, B=shipped, A=assertflip) ===")
for iid in sorted(byinst):
    d = byinst[iid]
    def s(a): return f"{sum(d[a])}/{len(d[a])}" if d[a] else "-"
    print(f"  {iid.split('-')[1]}: 0 {s('0'):>4}   B {s('B'):>4}   A {s('A'):>4}")

print("\n=== overall ===")
for arm, name in [("0", "no-skill"), ("B", "shipped-skill"), ("A", "assertflip-skill")]:
    v, n = rate(arm)
    print(f"  {name:16} {v}/{n} = {100*v/n:.0f}%" if n else f"  {name}: -")

def perm_p(armX, armY, N=50000, seed=3):
    random.seed(seed)
    insts = [i for i in byinst if byinst[i][armX] and byinst[i][armY]]
    def diff():
        xs = []; ys = []
        for i in insts:
            xs += byinst[i][armX]; ys += byinst[i][armY]
        return sum(xs)/len(xs) - sum(ys)/len(ys)
    obs = diff()
    pools = {i: (byinst[i][armX] + byinst[i][armY], len(byinst[i][armX])) for i in insts}
    cnt = 0
    for _ in range(N):
        xs = []; ys = []
        for i in insts:
            vals, nx = pools[i]; v = vals[:]; random.shuffle(v)
            xs += v[:nx]; ys += v[nx:]
        d = sum(xs)/len(xs) - sum(ys)/len(ys)
        if abs(d) >= abs(obs)-1e-12: cnt += 1
    return obs, cnt/N, len(insts)

print("\n=== pairwise stratified permutation (50k) ===")
for x, y, lbl in [("B", "0", "shipped vs no-skill"), ("A", "0", "assertflip vs no-skill"), ("A", "B", "assertflip vs shipped")]:
    obs, p, ni = perm_p(x, y)
    print(f"  {lbl:24}: diff={obs:+.3f}  p={p:.3f}  (n_inst={ni})")
