#!/usr/bin/env python3
"""Aggregate run-full-cycle cells under /tmp/sg-debug-luna/runs/<seed>/<task>/ into a TSV,
plus (optionally) a stratified one-sided permutation test between two arms.

Usage:
  collect_results.py                      # TSV to stdout + results.tsv here
  collect_results.py --test candX v090    # permutation p-value candX > v090 on reward
"""
import json, glob, os, sys, random

RUNS = "/tmp/sg-debug-luna/runs"
HERE = os.path.dirname(os.path.abspath(__file__))


def walk_cells():
    rows = []
    for summary_path in sorted(glob.glob(f"{RUNS}/*/*/summary.json")):
        seed, task = summary_path.split("/")[-3:-1]
        s = json.load(open(summary_path))
        for arm_name, arm in (s.get("arms") or {}).items():
            label = arm_label(seed, arm_name)
            outcome = arm.get("process_outcome")
            m = extract_metrics(arm)
            reward_path_metrics = m or {}
            rows.append({
                "seed": seed, "task": task, "arm": arm_name, "arm_label": label,
                "outcome": outcome,
                "reward": reward_path_metrics.get("reward"),
                "f2p_passed": reward_path_metrics.get("f2p_passed"),
                "f2p_total": reward_path_metrics.get("f2p_total"),
                "p2p_passed": reward_path_metrics.get("p2p_passed"),
                "p2p_total": reward_path_metrics.get("p2p_total"),
                "agent_s": agent_seconds(arm),
                "skill_commit": (s.get("skill_commit") or "")[:9] if arm_name != "baseline" else "",
            })
    return rows


def arm_label(seed, arm_name):
    # seed dirs are like it0-s1 / candX-s2; harness arm identity comes from the seed dir prefix
    prefix = seed.split("-s")[0]
    return "baseline" if arm_name == "baseline" else prefix


def extract_metrics(arm):
    try:
        evals = arm["collection"]["job_result"]["stats"]["evals"]
        for ev in evals.values():
            if ev.get("metrics"):
                return ev["metrics"][0]
    except (KeyError, TypeError):
        pass
    # fallback: read reward.json from job artifacts
    job_root = (arm.get("collection") or {}).get("job_root")
    if job_root:
        for p in glob.glob(f"{job_root}/**/verifier/reward.json", recursive=True):
            return json.load(open(p))
    return None


def agent_seconds(arm):
    try:
        jr = arm["collection"]["job_result"]
        from datetime import datetime
        a = datetime.fromisoformat(jr["started_at"]); b = datetime.fromisoformat(jr["finished_at"])
        return round((b - a).total_seconds())
    except Exception:
        return None


def permutation_test(rows, arm_a, arm_b, n=100000, metric="reward"):
    """One-sided: H1 = arm_a > arm_b. Stratified by (task, seed-number) pairs when both exist;
    otherwise pools per task. Pairs cells by task+seed suffix."""
    def cells(label):
        return {(r["task"], r["seed"].split("-s")[-1]): r[metric]
                for r in rows if r["arm_label"] == label and r[metric] is not None}
    A, B = cells(arm_a), cells(arm_b)
    keys = sorted(set(A) & set(B))
    if not keys:
        print("no paired cells"); return
    diffs = [A[k] - B[k] for k in keys]
    obs = sum(diffs)
    rng = random.Random(20260717)
    ge = 0
    for _ in range(n):
        s = sum(d if rng.random() < 0.5 else -d for d in diffs)
        if s >= obs:
            ge += 1
    print(f"paired cells={len(keys)} obs_diff={obs} one-sided p={(ge+1)/(n+1):.4f}")
    for k, d in zip(keys, diffs):
        if d: print("  ", k, "delta", d)


def main():
    rows = walk_cells()
    cols = ["seed", "task", "arm", "arm_label", "outcome", "reward", "f2p_passed",
            "f2p_total", "p2p_passed", "p2p_total", "agent_s", "skill_commit"]
    out = ["\t".join(cols)]
    for r in rows:
        out.append("\t".join("" if r[c] is None else str(r[c]) for c in cols))
    tsv = "\n".join(out)
    print(tsv)
    open(os.path.join(HERE, "results.tsv"), "w").write(tsv + "\n")
    if "--test" in sys.argv:
        i = sys.argv.index("--test")
        permutation_test(rows, sys.argv[i + 1], sys.argv[i + 2])


if __name__ == "__main__":
    main()
