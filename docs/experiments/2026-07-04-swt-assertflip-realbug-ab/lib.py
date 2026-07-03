"""Shared helpers: sympy from-source env, gold-patch apply, fail-to-pass grading."""
import json, os, re, subprocess, sys, glob

SCR = "/private/tmp/claude-501/-Users-danny-Documents-PARA-Resource-supergoal-skill/9457cce6-054c-4818-bc0e-40c304fc2d06/scratchpad"
SYMPY = os.path.join(SCR, "swt/sympy")
INST_DIR = os.path.join(SCR, "swt/instances")
ENV = dict(os.environ, PYTHONPATH=SYMPY, PYTHONDONTWRITEBYTECODE="1")

def load_instances():
    out = {}
    for f in sorted(glob.glob(os.path.join(INST_DIR, "*.json"))):
        d = json.load(open(f)); out[d["instance_id"]] = d
    return out

def g(cmd, timeout=300):
    return subprocess.run(cmd, cwd=SYMPY, capture_output=True, text=True, timeout=timeout)

def checkout_base(inst):
    g(["git", "checkout", "-f", inst["base_commit"]])
    g(["git", "clean", "-fdq"])

def write_patch(text, name):
    p = os.path.join(SCR, "swt", name); open(p, "w").write(text); return p

def apply_patch(text, reverse=False):
    p = write_patch(text, "_tmp.diff")
    args = ["git", "apply"] + (["-R"] if reverse else []) + [p]
    r = g(args); return r.returncode == 0, r.stderr.strip()

def testfile_from_patch(test_patch):
    m = re.search(r"^\+\+\+ b/(.+)$", test_patch, re.M)
    return m.group(1) if m else None

def f2p_nodes(inst):
    return json.loads(inst["FAIL_TO_PASS"]) if isinstance(inst["FAIL_TO_PASS"], str) else inst["FAIL_TO_PASS"]

def run_pytest(target, timeout=300):
    """Return (rc, classification, tail). classification: pass|assertion|error|collection|timeout."""
    try:
        r = subprocess.run([sys.executable, "-m", "pytest", "-q", "--no-header", "-p", "no:cacheprovider", target],
                           cwd=SYMPY, env=ENV, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return 124, "timeout", "timeout"
    o = (r.stdout or "") + (r.stderr or "")
    if r.returncode == 0:
        cls = "pass"
    elif "errors during collection" in o or "ERROR" in o and "collected 0 items" in o or "ModuleNotFoundError" in o or "ImportError" in o or "INTERNALERROR" in o:
        cls = "collection"
    elif "AssertionError" in o:
        cls = "assertion"
    else:
        cls = "error"
    tail = " | ".join([l for l in o.strip().splitlines() if l.strip()][-2:])
    return r.returncode, cls, tail[:300]
