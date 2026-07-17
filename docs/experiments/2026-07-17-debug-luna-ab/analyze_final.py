#!/usr/bin/env python3
"""Confirmatory analysis: one-sided stratified (by task) permutation test on resolved.

Usage: analyze_final.py <arm_a> <arm_b> [n_mc]
H1: arm_a resolved rate > arm_b. Cells = completed runs only; strata = tasks.
Within each task, pool the two arms' binary rewards and permute arm assignment
(preserving each arm's cell count); statistic = total resolved(a) - resolved(b).
"""
import sys, random, subprocess, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from collect_results import walk_cells  # noqa: E402


def main():
    arm_a, arm_b = sys.argv[1], sys.argv[2]
    n_mc = int(sys.argv[3]) if len(sys.argv) > 3 else 200000
    rows = [r for r in walk_cells() if r["outcome"] == "completed" and r["reward"] is not None]
    strata = {}
    for r in rows:
        if r["arm_label"] in (arm_a, arm_b):
            strata.setdefault(r["task"], {arm_a: [], arm_b: []}).setdefault(r["arm_label"], []).append(r["reward"])
    obs = 0
    layout = []
    for task, d in sorted(strata.items()):
        a, b = d.get(arm_a, []), d.get(arm_b, [])
        if not a or not b:
            print(f"  [skip stratum {task}: a={len(a)} b={len(b)}]")
            continue
        obs += sum(a) - sum(b)
        layout.append((task, a, b))
        print(f"  {task}: {arm_a} {sum(a)}/{len(a)}  {arm_b} {sum(b)}/{len(b)}")
    print(f"observed diff (resolved_{arm_a} - resolved_{arm_b}) = {obs}")
    rng = random.Random(20260717)
    ge = 0
    for _ in range(n_mc):
        s = 0
        for _, a, b in layout:
            pool = a + b
            rng.shuffle(pool)
            s += sum(pool[:len(a)]) - sum(pool[len(a):])
        if s >= obs:
            ge += 1
    p = (ge + 1) / (n_mc + 1)
    print(f"one-sided stratified permutation p = {p:.5f}  (MC n={n_mc}, seed fixed)")


if __name__ == "__main__":
    main()
