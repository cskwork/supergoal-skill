#!/usr/bin/env python3
"""Grade haiku 3-way repro tests by TRUE fail-to-pass vs gold code patch.
Arms: 0=no-skill, B=shipped, A=assertflip. Candidates under SCR/swt/abh/<id>__<arm>__r<run>/test_repro.py.
valid_f2p = candidate FAILS on base (ran, not collection/import error) AND PASSES once gold code fix applied.
Out-of-band deterministic: agent self-report ignored. SCR from SWT_SCR env (see lib.py). Emits graded_haiku.json here."""
import json, os, re, sys, glob, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from lib import load_instances, checkout_base, apply_patch, ENV, SYMPY, SCR

HERE = os.path.dirname(__file__)
AB = os.path.join(SCR, "swt/abh")
validated = {v["id"] for v in json.load(open(os.path.join(SCR, "swt/validated_all.json")))}
insts = load_instances()
# Grading touches only the main clone (worktrees untouched), so allow .pyc caching:
# git clean -fdq between instances wipes bytecode; within an instance repeated imports reuse it.
GENV = {k: v for k, v in ENV.items() if k != "PYTHONDONTWRITEBYTECODE"}

def run_candidate(testpath, timeout=120):
    try:
        r = subprocess.run([sys.executable, "-m", "pytest", "-q", "--no-header", "-p", "no:cacheprovider", testpath],
                           cwd=SYMPY, env=GENV, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return 124, "timeout"
    o = (r.stdout or "") + (r.stderr or "")
    if r.returncode == 0: cls = "pass"
    elif ("errors during collection" in o) or ("collected 0 items" in o) or ("ModuleNotFoundError" in o) or ("ImportError" in o) or ("INTERNALERROR" in o) or ("SyntaxError" in o): cls = "collection"
    elif "AssertionError" in o: cls = "assertion"
    else: cls = "error"
    return r.returncode, cls

cands = {}  # id -> list of (arm, run, testpath)
for d in sorted(glob.glob(os.path.join(AB, "*__*__r*"))):
    m = re.match(r"(sympy__sympy-\d+)__([0AB])__r(\d+)$", os.path.basename(d))
    if not m: continue
    iid, arm, run = m.group(1), m.group(2), int(m.group(3))
    if iid not in validated: continue
    cands.setdefault(iid, []).append((arm, run, os.path.join(d, "test_repro.py")))

rows = []
for iid, lst in cands.items():
    inst = insts[iid]
    checkout_base(inst)
    base = {}
    for arm, run, tp in lst:
        base[(arm, run)] = run_candidate(tp) if os.path.isfile(tp) else (1, "missing")
    ok, err = apply_patch(inst["patch"])
    fix = {}
    if ok:
        for arm, run, tp in lst:
            fix[(arm, run)] = run_candidate(tp) if os.path.isfile(tp) else (1, "missing")
        apply_patch(inst["patch"], reverse=True)
    else:
        for arm, run, tp in lst: fix[(arm, run)] = (1, "patch_apply_fail")
    for arm, run, tp in lst:
        brc, bcls = base[(arm, run)]; frc, fcls = fix[(arm, run)]
        valid = (brc != 0) and (bcls not in ("collection", "missing", "timeout")) and (frc == 0)
        rows.append({"id": iid, "arm": arm, "run": run, "base_cls": bcls, "fix_cls": fcls, "valid_f2p": bool(valid)})
    v = sum(1 for r in rows if r["id"] == iid and r["valid_f2p"])
    print(f"  {iid}: graded {len(lst)}  valid_f2p={v}/{len(lst)}", flush=True)
    json.dump(rows, open(os.path.join(SCR, "swt", "graded_haiku.partial.json"), "w"), indent=1)  # checkpoint in scratch, not repo

json.dump(rows, open(os.path.join(HERE, "graded_haiku.json"), "w"), indent=1)

def rate(pred):
    xs = [r for r in rows if pred(r)]; return sum(r["valid_f2p"] for r in xs), len(xs)
print("\n=== valid_f2p by arm (overall) ===")
for arm, name in [("0", "no-skill"), ("B", "shipped"), ("A", "assertflip")]:
    v, n = rate(lambda r: r["arm"] == arm); print(f"  {name:10} {v}/{n}  ({100*v/n:.0f}%)" if n else f"  {name}: -")
from collections import Counter
print("\nbase_cls:", dict(Counter(r["base_cls"] for r in rows)))
print("fix_cls :", dict(Counter(r["fix_cls"] for r in rows)))
print("wrote", os.path.join(HERE, "graded_haiku.json"))
