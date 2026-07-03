#!/usr/bin/env python3
"""Grade model-produced repro tests by TRUE fail-to-pass against the gold code patch.
valid_f2p = candidate FAILS on base (and actually ran, not a collection/import error)
            AND PASSES once the gold code fix is applied.
Grouped by instance: one checkout + one gold-patch apply per instance (candidates share)."""
import json, os, re, sys, glob, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from lib import load_instances, checkout_base, apply_patch, ENV, SYMPY, SCR

AB = os.path.join(SCR, "swt/ab")
validated = {v["id"]: v for v in json.load(open(os.path.join(SCR, "swt/validated.json")))}
insts = load_instances()

def run_candidate(testpath, timeout=180):
    try:
        r = subprocess.run([sys.executable, "-m", "pytest", "-q", "--no-header", "-p", "no:cacheprovider", testpath],
                           cwd=SYMPY, env=ENV, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return 124, "timeout"
    o = (r.stdout or "") + (r.stderr or "")
    if r.returncode == 0: cls = "pass"
    elif ("errors during collection" in o) or ("collected 0 items" in o) or ("ModuleNotFoundError" in o) or ("ImportError" in o) or ("INTERNALERROR" in o) or ("SyntaxError" in o): cls = "collection"
    elif "AssertionError" in o: cls = "assertion"
    else: cls = "error"
    return r.returncode, cls

# gather candidate dirs grouped by instance
cands = {}  # id -> list of (arm, run, testpath)
for d in sorted(glob.glob(os.path.join(AB, "*__*__r*"))):
    m = re.match(r"(sympy__sympy-\d+)__([AB])__r(\d+)$", os.path.basename(d))
    if not m: continue
    iid, arm, run = m.group(1), m.group(2), int(m.group(3))
    if iid not in validated: continue
    tp = os.path.join(d, "test_repro.py")
    cands.setdefault(iid, []).append((arm, run, tp))

rows = []
for iid, lst in cands.items():
    inst = insts[iid]
    checkout_base(inst)
    # BASE results (no code patch)
    base = {}
    for arm, run, tp in lst:
        if not os.path.isfile(tp): base[(arm,run)] = (1, "missing"); continue
        base[(arm,run)] = run_candidate(tp)
    # apply gold code fix
    ok, err = apply_patch(inst["patch"])
    fix = {}
    if ok:
        for arm, run, tp in lst:
            if not os.path.isfile(tp): fix[(arm,run)] = (1, "missing"); continue
            fix[(arm,run)] = run_candidate(tp)
        apply_patch(inst["patch"], reverse=True)
    else:
        for arm, run, tp in lst: fix[(arm,run)] = (1, f"patch_apply_fail")
    for arm, run, tp in lst:
        brc, bcls = base[(arm,run)]; frc, fcls = fix[(arm,run)]
        valid = (brc != 0) and (bcls not in ("collection","missing","timeout")) and (frc == 0)
        rows.append({"id":iid,"arm":arm,"run":run,"base_cls":bcls,"fix_cls":fcls,"valid_f2p":bool(valid)})
    v = sum(1 for r in rows if r['id']==iid and r['valid_f2p'])
    print(f"  {iid}: graded {len(lst)}  valid_f2p={v}/{len(lst)}")

json.dump(rows, open(os.path.join(SCR, "swt/graded.json"), "w"), indent=1)

def rate(pred):
    xs=[r for r in rows if pred(r)]; return sum(r["valid_f2p"] for r in xs), len(xs)
print("\n=== valid_f2p by arm (overall) ===")
for arm in ["A","B"]:
    v,n = rate(lambda r: r["arm"]==arm); print(f"  arm {arm}: {v}/{n}  ({100*v/n:.0f}%)" if n else f"  arm {arm}: -")
print("\n=== per-instance A vs B ===")
for iid in sorted(cands):
    av,an=rate(lambda r: r["id"]==iid and r["arm"]=="A"); bv,bn=rate(lambda r: r["id"]==iid and r["arm"]=="B")
    print(f"  {iid}: A {av}/{an}  B {bv}/{bn}")
from collections import Counter
print("\nbase_cls counts:", dict(Counter(r["base_cls"] for r in rows)))
print("fix_cls counts:", dict(Counter(r["fix_cls"] for r in rows)))
