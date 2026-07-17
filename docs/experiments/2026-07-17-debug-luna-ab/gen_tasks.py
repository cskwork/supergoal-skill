#!/usr/bin/env python3
"""Convert validated SWE-bench_Lite sympy instances into DeepSWE v1.1 task dirs.

Sources per-instance JSON from ../2026-07-04-swt-assertflip-realbug-ab/instances*/,
emits tasks under /tmp/deep-swe-sg/tasks/sympy-<num>-<slug>/, and writes Dockerfiles
that layer on one shared local base image (sympy-swe-base:v1). Reference frame files
(grader.py, test.sh skeleton) are copied from the stock skrub task so the verifier
protocol stays byte-identical with upstream.

Usage: python3 gen_tasks.py [--out /tmp/deep-swe-sg/tasks]
Then:  bash build_images.sh   (emitted next to the task dirs' parent)
"""
import json, glob, os, re, sys, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
INST_GLOB = os.path.join(HERE, "..", "2026-07-04-swt-assertflip-realbug-ab", "instances*", "sympy__sympy-{num}.json")
SKRUB = "/tmp/deep-swe-sg/tasks/skrub-duration-encoding"
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "/tmp/deep-swe-sg/tasks"

TASKS = {
    "21627": ("cosh-is-zero-recursion", "Fix RecursionError in is_zero of nested cosh expression"),
    "20442": ("convert-to-orthogonal-units", "Fix convert_to combining orthogonal units"),
    "21055": ("refine-complex-arg", "Make refine() simplify complex arguments under assumptions"),
    "23191": ("vector-pretty-print-order", "Fix jumbled pretty_print output for sympy.vector objects"),
    "24909": ("milli-prefix-product", "Fix milli prefix times unit evaluating to 1"),
    "22714": ("point2d-evaluate-false", "Fix Point2D crash under evaluate(False)"),
    # PREREG re-roll replacements (2026-07-17, after 1-seed ceiling screen dropped 3 dual-solves)
    "24102": ("parse-mathematica-greek", "Fix parse_mathematica failing on Greek characters"),
    "21847": ("itermonomials-min-degrees", "Fix itermonomials dropping monomials with min_degrees"),
    "23262": ("lambdify-single-tuple", "Fix python code printer for one-element tuples"),
}

BASE_DOCKERFILE = """FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates procps \\
 && rm -rf /var/lib/apt/lists/*
# setuptools: old sympy imports distutils; the setuptools shim keeps that working
RUN pip install --no-cache-dir setuptools mpmath==1.3.0 pytest
ENV PYTHONPATH=/app
WORKDIR /app
RUN git clone https://github.com/sympy/sympy .
CMD ["/bin/bash"]
"""

ENV_DOCKERFILE = """FROM sympy-swe-base:v1
# Git time-travel (skrub pattern): default branch AT the base commit, future
# history/tags gc'd so the reference solution cannot leak from the clone.
RUN git checkout -B master {sha} \\
 && git remote remove origin \\
 && for b in $(git for-each-ref --format='%(refname:short)' refs/heads | grep -vx master); do git branch -D "$b" || true; done \\
 && for t in $(git tag); do git merge-base --is-ancestor "$t" HEAD 2>/dev/null || git tag -d "$t"; done \\
 && git reflog expire --expire=now --all \\
 && git gc --prune=now \\
 && git config core.hooksPath /dev/null
CMD ["/bin/bash"]
"""

TESTS_DOCKERFILE = """# Verifier image: the task image with the hidden tests baked in.
# tests/ is the build context; the agent never sees this container.
FROM {image}

COPY test.sh /tests/test.sh
COPY test.patch /tests/test.patch
COPY grader.py /tests/grader.py
COPY config.json /tests/config.json
RUN chmod +x /tests/test.sh
"""

TASK_TOML = """schema_version = "1.1"
artifacts = ["/logs/artifacts/model.patch"]
[task]
name = "local/{task_id}"
description = ""
authors = []
keywords = []
[metadata]
ext_id = "local-{task_id}"
task_id = "{task_id}"
display_title = "{title}"
display_description = "{title}"
original_title = "{orig_title}"
category = "bug_fix"
language = "python"
repository_url = "https://github.com/sympy/sympy"
base_commit_hash = "{sha}"
[verifier]
environment_mode = "separate"
timeout_sec = 1800.0

[verifier.env]
[verifier.environment]
build_timeout_sec = 1800.0
cpus = 2
memory_mb = 8192
storage_mb = 20480
allow_internet = false

[agent]
timeout_sec = 5400.0
[environment]
build_timeout_sec = 1800.0
docker_image = "{image}"
os = "linux"
cpus = 2
memory_mb = 8192
storage_mb = 20480
gpus = 0
allow_internet = false
mcp_servers = []

[environment.env]
[solution.env]
"""

PRE_ARTIFACTS = """#!/bin/bash
# Capture the agent's committed work as the submission artifact: the diff
# between the starting commit and the agent's final HEAD.
set -uo pipefail
cd /app || exit 0
mkdir -p /logs/artifacts
git config --global --add safe.directory /app 2>/dev/null || true
git diff --binary {sha} HEAD > /logs/artifacts/model.patch 2>/dev/null || true
echo "[pre_artifacts] captured $(wc -c < /logs/artifacts/model.patch) bytes"
"""

SOLVE_SH = """#!/bin/bash

cd /app

# Apply the solution patch
git apply --whitespace=nowarn /solution/solution.patch

# Commit the solution like a normal submission (only committed work is graded).
git checkout -b feature/solution 2>/dev/null || true
git add -A
git -c user.name="oracle" -c user.email="oracle@local" commit -q --no-verify -m "Apply reference solution" || true
"""

RUN_TESTS_MIDDLE = """# >>> RUN TESTS (task-specific) <<<
require_cmd() {{ command -v "$1" >/dev/null 2>&1 || {{ log "ERROR: missing $1; PATH=$PATH"; exit 127; }}; }}
require_cmd python3

set +e
run_log python3 -m pytest -q -p no:cacheprovider --junitxml=/logs/verifier/junit.xml \\
  {test_files}
set -e
# >>> END RUN TESTS <<<"""


def load_instance(num):
    files = glob.glob(INST_GLOB.format(num=num))
    assert files, f"instance {num} not found"
    return json.load(open(files[0]))


def node_ids(inst):
    def parse(key):
        v = inst[key]
        return json.loads(v) if isinstance(v, str) else v
    touched = [l[6:] for l in inst["test_patch"].splitlines() if l.startswith("+++ b/")]
    # A test_patch may also touch test-infra files (e.g. quality_unicode allowlists);
    # the graded node ids live in the actual test module(s).
    tfiles = [f for f in touched if re.search(r"tests/test_[^/]+\.py$", f)]
    assert len(tfiles) == 1, f"expected 1 test module, got {tfiles} from {touched}"
    mod = tfiles[0][:-3].replace("/", ".")
    to_junit = lambda name: f"{mod}.{name}"
    return tfiles, [to_junit(n) for n in parse("FAIL_TO_PASS")], [to_junit(n) for n in parse("PASS_TO_PASS")]


def build_test_sh(test_files):
    src = open(os.path.join(SKRUB, "tests", "test.sh")).read()
    middle = RUN_TESTS_MIDDLE.format(test_files=" \\\n  ".join(test_files))
    out = re.sub(r"# >>> RUN TESTS \(task-specific\) <<<.*?# >>> END RUN TESTS <<<",
                 middle.replace("\\", "\\\\"), src, flags=re.S)
    assert "junitxml=/logs/verifier/junit.xml" in out, "middle splice failed"
    return out


def emit(num, slug, title):
    inst = load_instance(num)
    sha = inst["base_commit"]
    task_id = f"sympy-{num}-{slug}"
    image = f"sympy-swe-{num}:v1"
    root = os.path.join(OUT, task_id)
    if os.path.exists(root):
        shutil.rmtree(root)
    os.makedirs(os.path.join(root, "tests"))
    os.makedirs(os.path.join(root, "environment"))
    os.makedirs(os.path.join(root, "solution"))

    tfiles, f2p, p2p = node_ids(inst)
    ps = inst["problem_statement"].rstrip()
    orig_title = ps.splitlines()[0].strip().replace('"', "'")[:120]

    w = lambda rel, text, exe=False: (
        open(os.path.join(root, rel), "w").write(text),
        exe and os.chmod(os.path.join(root, rel), 0o755),
    )
    w("task.toml", TASK_TOML.format(task_id=task_id, title=title, orig_title=orig_title, sha=sha, image=image))
    w("instruction.md", ps + "\n\nIMPORTANT: Please work on this in a new branch and commit everything when you are done.\n")
    w("pre_artifacts.sh", PRE_ARTIFACTS.format(sha=sha), exe=True)
    w("environment/Dockerfile", ENV_DOCKERFILE.format(sha=sha))
    w("solution/solution.patch", inst["patch"])
    w("solution/solve.sh", SOLVE_SH, exe=True)
    w("tests/Dockerfile", TESTS_DOCKERFILE.format(image=image))
    w("tests/test.patch", inst["test_patch"])
    w("tests/test.sh", build_test_sh(tfiles), exe=True)
    shutil.copy(os.path.join(SKRUB, "tests", "grader.py"), os.path.join(root, "tests", "grader.py"))
    w("tests/config.json", json.dumps({
        "base_commit": sha,
        "f2p_node_ids": f2p,
        "p2p_node_ids": p2p,
        "grade": {"format": "junit", "tool_label": "pytest-junitxml",
                  "reports": ["/logs/verifier/junit.xml"]},
    }, indent=1))
    print(f"emitted {task_id}: f2p={len(f2p)} p2p={len(p2p)} files={tfiles} sha={sha[:12]} image={image}")
    return num, sha, image


def main():
    os.makedirs(OUT, exist_ok=True)
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    built = [emit(num, slug, title) for num, (slug, title) in TASKS.items()
             if only is None or num in only]
    base_path = os.path.join(HERE, "base.Dockerfile")
    open(base_path, "w").write(BASE_DOCKERFILE)
    lines = ["#!/bin/bash", "set -euo pipefail", f"cd {HERE}",
             "docker build -t sympy-swe-base:v1 -f base.Dockerfile ."]
    for num, _sha, image in built:
        task_id = [d for d in os.listdir(OUT) if d.startswith(f"sympy-{num}-")][0]
        lines.append(f"docker build -t {image} {os.path.join(OUT, task_id, 'environment')}")
    lines.append('echo "all images built"')
    build_sh = os.path.join(HERE, "build_images.sh")
    open(build_sh, "w").write("\n".join(lines) + "\n")
    os.chmod(build_sh, 0o755)
    print(f"wrote {build_sh}")


if __name__ == "__main__":
    main()
