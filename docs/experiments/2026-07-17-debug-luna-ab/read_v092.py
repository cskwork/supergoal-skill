#!/usr/bin/env python3
"""Read v091-vs-v092 candidate-edit A/B directly from verifier/reward.json.

Seed labels: v091b-s<N> (current HEAD) and v092-s<N> (/tmp/sg-v092, exception-owner edit).
Also prints which file each patch touched (owner sympy/core vs symptom elsewhere) for mechanism.
"""
import json, os, glob, re

RUNS = "/tmp/sg-debug-luna/runs"
TASKS = ["sympy-21379-subs-polynomialerror", "sympy-21171-latex-singularityfunction-exp"]


def job_info(job):
    rj = glob.glob(os.path.join(job, "**", "verifier", "reward.json"), recursive=True)
    p = glob.glob(os.path.join(job, "**", "artifacts", "model.patch"), recursive=True)
    rew = json.load(open(rj[0]))["reward"] if rj else None
    files = []
    if p:
        files = [l.split(" b/")[0].replace("diff --git a/", "")
                 for l in open(p[0]) if l.startswith("diff --git")]
    site = "-"
    if files:
        core = any(f.startswith("sympy/core/mod.py") for f in files)
        site = "owner:mod.py" if core else ("src:" + ",".join(os.path.basename(f) for f in files if not f.startswith("sympy") or "/tests/" not in f)[:30])
    return rew, site


def main():
    rows = []
    for sd in sorted(glob.glob(os.path.join(RUNS, "*"))):
        m = re.match(r"(v091b|v092)-s(\d+)$", os.path.basename(sd))
        if not m:
            continue
        arm, sn = m.group(1), m.group(2)
        for task in TASKS:
            for job in glob.glob(os.path.join(sd, task, "jobs", "harness-*")):
                rew, site = job_info(job)
                if rew is not None:
                    rows.append((task, int(sn), arm, rew, site))
    print(f"{'task':30} {'seed':4} {'arm':6} {'rew':3} {'patch-site'}")
    for r in sorted(rows):
        print(f"{r[0].replace('sympy-','')[:30]:30} {r[1]:<4} {r[2]:6} {r[3]:<3} {r[4]}")
    print("\n=== resolved per task x arm ===")
    agg = {}
    for r in rows:
        agg.setdefault((r[0], r[2]), []).append(r[3])
    for t in TASKS:
        line = t.replace("sympy-", "")[:30].ljust(32)
        for a in ["v091b", "v092"]:
            v = agg.get((t, a), [])
            line += f"{a}={sum(x==1 for x in v)}/{len(v)}  "
        print(line)
    print("\n=== TOTAL ===")
    for a in ["v091b", "v092"]:
        v = [r[3] for r in rows if r[2] == a]
        print(f"  {a}: {sum(x==1 for x in v)}/{len(v)} resolved")


if __name__ == "__main__":
    main()
