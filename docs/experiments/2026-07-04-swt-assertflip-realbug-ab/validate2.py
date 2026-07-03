#!/usr/bin/env python3
"""Validate instances2 AND confirm WRONG-VALUE nature: gold F2P must fail via ASSERTION (not error/collection)
on base, and pass with gold patch. Keeps only wrong-value + fail-to-pass instances -> validated2.json."""
import json, os, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from lib import checkout_base, apply_patch, testfile_from_patch, run_pytest, SCR

INST2 = os.path.join(SCR, "swt/instances2")
insts = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(INST2, "*.json")))]
print(f"validating {len(insts)} candidates for wrong-value + fail-to-pass\n")
kept = []
for inst in insts:
    iid = inst["instance_id"]
    checkout_base(inst)
    tf = testfile_from_patch(inst["test_patch"])
    ok_t, err_t = apply_patch(inst["test_patch"])
    if not ok_t:
        print(f"  {iid}: SKIP (test_patch apply failed)"); continue
    nodes = json.loads(inst["FAIL_TO_PASS"]) if isinstance(inst["FAIL_TO_PASS"], str) else inst["FAIL_TO_PASS"]
    base_cls = []
    base_ok = True
    for n in nodes:
        target = n if "::" in n else f"{tf}::{n.split('::')[-1]}"
        rc, cls, tail = run_pytest(target)
        base_cls.append(cls)
        if rc == 0 or cls == "collection": base_ok = False
    wrong_value = base_ok and all(c == "assertion" for c in base_cls)
    ok_c, _ = apply_patch(inst["patch"])
    fix_ok = ok_c
    if ok_c:
        for n in nodes:
            target = n if "::" in n else f"{tf}::{n.split('::')[-1]}"
            rc, cls, tail = run_pytest(target)
            if rc != 0: fix_ok = False
    keep = wrong_value and fix_ok
    print(f"  {iid}: base_cls={base_cls} wrong_value={wrong_value} fix_pass={fix_ok} -> {'KEEP' if keep else 'drop'}")
    if keep:
        kept.append({"id": iid, "testfile": tf, "f2p": nodes})

json.dump(kept, open(os.path.join(SCR, "swt/validated2.json"), "w"), indent=1)
print(f"\nKEPT (wrong-value) {len(kept)}/{len(insts)}: {[k['id'] for k in kept]}")
