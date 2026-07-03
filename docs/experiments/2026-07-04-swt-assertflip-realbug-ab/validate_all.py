#!/usr/bin/env python3
"""Validate fail-to-pass for every sympy instance: gold F2P test must FAIL on base and PASS with gold code patch.
Keeps only validated instances (writes validated.json)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import load_instances, checkout_base, apply_patch, testfile_from_patch, f2p_nodes, run_pytest, SCR

insts = {k: v for k, v in load_instances().items() if k.startswith("sympy__sympy-")}
print(f"validating {len(insts)} sympy instances\n")
validated = []
for iid, inst in insts.items():
    checkout_base(inst)
    tf = testfile_from_patch(inst["test_patch"])
    ok_t, err_t = apply_patch(inst["test_patch"])
    if not ok_t:
        print(f"  {iid}: SKIP (test_patch apply failed: {err_t[:120]})"); continue
    nodes = f2p_nodes(inst)
    # base: each F2P should FAIL (rc!=0) and actually run (not collection error)
    base_ok = True; base_cls = []
    for n in nodes:
        target = n if "::" in n else f"{tf}::{n.split('::')[-1]}"
        rc, cls, tail = run_pytest(target)
        base_cls.append(cls)
        if rc == 0 or cls == "collection":
            base_ok = False
    # apply gold code patch -> fixed: each F2P should PASS
    ok_c, err_c = apply_patch(inst["patch"])
    fix_ok = ok_c; fix_cls = []
    if ok_c:
        for n in nodes:
            target = n if "::" in n else f"{tf}::{n.split('::')[-1]}"
            rc, cls, tail = run_pytest(target)
            fix_cls.append(cls)
            if rc != 0:
                fix_ok = False
    valid = base_ok and fix_ok
    print(f"  {iid}: base_fail={base_ok}{base_cls} fix_pass={fix_ok}{fix_cls} -> {'VALID' if valid else 'DROP'}")
    if valid:
        validated.append({"id": iid, "testfile": tf, "f2p": nodes})

json.dump(validated, open(os.path.join(SCR, "swt/validated.json"), "w"), indent=1)
print(f"\nVALIDATED {len(validated)}/{len(insts)} -> swt/validated.json")
print([v["id"] for v in validated])
