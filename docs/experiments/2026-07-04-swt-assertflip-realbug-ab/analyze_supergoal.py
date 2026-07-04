#!/usr/bin/env python3
"""Supergoal arm S (DEBUG critic-loop) vs arm 0 (no-skill), real sympy bugs, fail-to-pass.
Arm 0 rows reused from graded_haiku.json; arm S from graded_supergoal.json (same env, model, deterministic grading).
Stratified permutation within instance. Pre-registered primary: S vs 0, p<0.05 => meaningful improvement."""
import json, os, random
from collections import defaultdict

HERE = os.path.dirname(__file__)
rows0 = [r for r in json.load(open(os.path.join(HERE, "graded_haiku.json"))) if r["arm"] == "0"]
rowsS = json.load(open(os.path.join(HERE, "graded_supergoal.json")))
rows = rows0 + rowsS
byinst = defaultdict(lambda: defaultdict(list))
for r in rows:
    byinst[r["id"]][r["arm"]].append(r["valid_f2p"])

def rate(arm):
    v = sum(r["valid_f2p"] for r in rows if r["arm"] == arm)
    n = sum(1 for r in rows if r["arm"] == arm)
    return v, n

print("=== per-instance valid_f2p (0=no-skill, S=supergoal critic-loop) ===")
for iid in sorted(byinst):
    d = byinst[iid]
    def s(a): return f"{sum(d[a])}/{len(d[a])}" if d[a] else "-"
    print(f"  {iid.split('-')[1]}: 0 {s('0'):>4}   S {s('S'):>4}")

print("\n=== overall ===")
for arm, name in [("0", "no-skill"), ("S", "supergoal")]:
    v, n = rate(arm)
    print(f"  {name:12} {v}/{n} = {100*v/n:.0f}%" if n else f"  {name}: -")

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

print("\n=== pre-registered primary: supergoal vs no-skill (stratified permutation, 50k) ===")
obs, p, ni = perm_p("S", "0")
print(f"  supergoal vs no-skill: diff={obs:+.3f}  p={p:.3f}  (n_inst={ni})")
print(f"  VERDICT: {'MEANINGFUL (p<0.05) -> bake into supergoal' if p < 0.05 else 'null (p>=0.05) -> no significant lift'}")
