#!/usr/bin/env python3
"""Grade arm S (supergoal DEBUG critic-loop) repro tests by TRUE fail-to-pass vs gold code patch.
Candidates under SCR/swt/abh/<id>__S__r<run>/test_repro.py. Out-of-band deterministic (agent self-report ignored).
Emits graded_supergoal.json here. SCR from SWT_SCR env (see lib.py). Bytecode cache on for speed (main clone only)."""
import json, os, re, sys, glob, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from lib import load_instances, checkout_base, apply_patch, ENV, SYMPY, SCR

HERE = os.path.dirname(__file__)
AB = os.path.join(SCR, "swt/abhS")  # fresh dir for the domain-general-critic run
validated = {v["id"] for v in json.load(open(os.path.join(SCR, "swt/validated_all.json")))}
insts = load_instances()
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

cands = {}
for d in sorted(glob.glob(os.path.join(AB, "*__S__r*"))):
    m = re.match(r"(sympy__sympy-\d+)__S__r(\d+)$", os.path.basename(d))
    if not m: continue
    iid, run = m.group(1), int(m.group(2))
    if iid not in validated: continue
    cands.setdefault(iid, []).append(("S", run, os.path.join(d, "test_repro.py")))

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
    json.dump(rows, open(os.path.join(SCR, "swt", "graded_supergoal.partial.json"), "w"), indent=1)

json.dump(rows, open(os.path.join(HERE, "graded_supergoal.json"), "w"), indent=1)
v = sum(r["valid_f2p"] for r in rows); n = len(rows)
print(f"\narm S (supergoal): {v}/{n} = {100*v/n:.0f}%" if n else "arm S: -")
from collections import Counter
print("base_cls:", dict(Counter(r["base_cls"] for r in rows)))
print("wrote", os.path.join(HERE, "graded_supergoal.json"))
