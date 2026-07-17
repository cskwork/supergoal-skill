#!/usr/bin/env python3
"""Read held-out A/B rewards DIRECTLY from verifier/reward.json (proxy-fabrication guard).

Walks /tmp/sg-debug-luna/runs/<seed-label>/<task>/**/verifier/reward.json and tabulates
reward + f2p/p2p per (task, seed, arm). Seed-label convention:
  main-s<N>  -> baseline arm (score.baseline) + v091 arm (score.harness, skill=current HEAD)
  v090-s<N>  -> v090 arm (score.harness, skill=/tmp/sg-v090)
Also cross-checks summary.json skill_commit so an arm can't be silently mislabeled.
"""
import json, os, sys, glob, re

RUNS = "/tmp/sg-debug-luna/runs"


def reward_of(job_root):
    rj = glob.glob(os.path.join(job_root, "**", "verifier", "reward.json"), recursive=True)
    if not rj:
        return None
    d = json.load(open(rj[0]))
    return {"reward": d.get("reward"), "f2p": f"{d.get('f2p_passed')}/{d.get('f2p_total')}",
            "p2p": f"{d.get('p2p_passed')}/{d.get('p2p_total')}", "path": rj[0]}


def arms_in_seeddir(seed_task_dir):
    """Return {arm_label: reward-dict} by reading each job's reward.json under a seed/task dir."""
    out = {}
    sm = os.path.join(seed_task_dir, "summary.json")
    commit = None
    if os.path.exists(sm):
        s = json.load(open(sm))
        commit = (s.get("skill_commit") or "")[:9]
    for job in sorted(glob.glob(os.path.join(seed_task_dir, "jobs", "*"))):
        name = os.path.basename(job)
        arm = "baseline" if name.startswith("baseline-") else ("harness" if name.startswith("harness-") else "?")
        r = reward_of(job)
        if r:
            r["skill_commit"] = commit
            out[arm] = r
    return out


def main():
    tasks = sys.argv[1].split(",") if len(sys.argv) > 1 else [
        "sympy-20212-zero-pow-neg-inf",
        "sympy-24066-collect-factor-exp-dimensionless",
        "sympy-24213-collect-factor-equivalent-dims",
    ]
    # arm mapping: which seed-label prefix carries which logical arm
    # main-s* -> baseline (from baseline job) + v091 (from harness job)
    # v090-s* -> v090 (from harness job)
    rows = []  # (task, seed_n, arm, reward, f2p, p2p, commit)
    for sd in sorted(glob.glob(os.path.join(RUNS, "*"))):
        label = os.path.basename(sd)
        m = re.match(r"(main|v090|v091)-s(\d+)$", label)
        if not m:
            continue
        family, sn = m.group(1), m.group(2)
        for task in tasks:
            std = os.path.join(sd, task)
            if not os.path.isdir(std):
                continue
            arms = arms_in_seeddir(std)
            if family == "main":
                if "baseline" in arms:
                    rows.append((task, sn, "baseline", *_v(arms["baseline"])))
                if "harness" in arms:
                    rows.append((task, sn, "v091", *_v(arms["harness"])))
            elif family == "v090":
                if "harness" in arms:
                    rows.append((task, sn, "v090", *_v(arms["harness"])))
    # print table
    print(f"{'task':42} {'seed':4} {'arm':9} {'rew':3} {'f2p':6} {'p2p':7} {'skill_commit':12}")
    for r in sorted(rows):
        t = r[0].replace("sympy-", "").replace("-", " ")[:40]
        print(f"{t:42} {r[1]:4} {r[2]:9} {str(r[3]):3} {r[4]:6} {r[5]:7} {str(r[6]):12}")
    # aggregate resolved per (task, arm)
    print("\n=== resolved (reward=1) sums per task x arm ===")
    agg = {}
    for r in rows:
        agg.setdefault((r[0], r[2]), []).append(r[3])
    tasks_seen = sorted(set(k[0] for k in agg))
    arms_seen = ["baseline", "v090", "v091"]
    hdr = f"{'task':42} " + " ".join(f"{a:9}" for a in arms_seen)
    print(hdr)
    for t in tasks_seen:
        cells = []
        for a in arms_seen:
            v = agg.get((t, a), [])
            cells.append(f"{sum(x==1 for x in v)}/{len(v)}" if v else "-")
        print(f"{t.replace('sympy-','')[:40]:42} " + " ".join(f"{c:9}" for c in cells))
    print("\n=== TOTAL resolved per arm ===")
    for a in arms_seen:
        vals = [r[3] for r in rows if r[2] == a]
        print(f"  {a:9}: {sum(x==1 for x in vals)}/{len(vals)} resolved")


def _v(r):
    return (r["reward"], r["f2p"], r["p2p"], r.get("skill_commit"))


if __name__ == "__main__":
    main()
