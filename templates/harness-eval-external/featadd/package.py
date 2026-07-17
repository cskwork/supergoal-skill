#!/usr/bin/env python3
"""Package a FeatAdd-generated regression into a DeepSWE v1.1 debug task.

Input (from gen.sh work dir): base_commit, feature.diff (applied to make the buggy base state),
fix.diff (the gold solution), B (fail-to-pass node ids), P1 (pass-to-pass node ids), test module.

Emits /tmp/deep-swe-sg/tasks/featadd-<id>/ with the same verifier protocol as gen_tasks.py, plus
an environment image that layers feature.diff on sympy-swe-base:v1 so the agent starts from the
broken (feature-applied, B-failing) state and must restore B without reverting the feature.

Usage: package.py <id> <slug> <title> <base_sha> <work_dir> <test_module>
  work_dir must contain feature.diff, fix.diff, B.txt (one node id/line), P1.txt
"""
import json, os, sys, shutil

BASE_IMAGE = "sympy-swe-base:v1"
SKRUB = "/tmp/deep-swe-sg/tasks/skrub-duration-encoding"
OUT = "/tmp/deep-swe-sg/tasks"

# Env image: layer the feature diff onto the shared base, commit -> the buggy starting state.
ENV_DOCKERFILE = """FROM {base_image}
COPY feature.diff /tmp/feature.diff
RUN git checkout -B master {sha} \\
 && git apply --whitespace=nowarn /tmp/feature.diff \\
 && git -c user.name=featadd -c user.email=featadd@local commit -aqm "feature: {id}" \\
 && git remote remove origin 2>/dev/null || true \\
 && git reflog expire --expire=now --all && git gc --prune=now \\
 && git config core.hooksPath /dev/null
CMD ["/bin/bash"]
"""

TESTS_DOCKERFILE = """FROM {image}
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
ext_id = "featadd-{task_id}"
task_id = "{task_id}"
display_title = "{title}"
display_description = "{title}"
original_title = "{title}"
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
set -uo pipefail
cd /app || exit 0
mkdir -p /logs/artifacts
git config --global --add safe.directory /app 2>/dev/null || true
# Grade only the agent's work on top of the feature-applied base commit.
git diff --binary HEAD > /logs/artifacts/model.patch 2>/dev/null || true
echo "[pre_artifacts] captured $(wc -c < /logs/artifacts/model.patch) bytes"
"""

SOLVE_SH = """#!/bin/bash
cd /app
git apply --whitespace=nowarn /solution/solution.patch
git add -A
git -c user.name="oracle" -c user.email="oracle@local" commit -q --no-verify -m "Apply reference fix" || true
"""

RUN_TESTS_MIDDLE = """# >>> RUN TESTS (task-specific) <<<
require_cmd() {{ command -v "$1" >/dev/null 2>&1 || {{ log "ERROR: missing $1"; exit 127; }}; }}
require_cmd python3
set +e
run_log python3 -m pytest -q -p no:cacheprovider --junitxml=/logs/verifier/junit.xml {module}
set -e
# >>> END RUN TESTS <<<"""

INSTRUCTION = """{title}

A new feature was recently added to this codebase. After that change, the following existing
tests in `{module}` began to fail:

{failing}

Investigate why the feature broke them and fix the code so those tests pass again. Do not remove
or weaken the new feature, and do not edit the tests.

IMPORTANT: Please work on this in a new branch and commit everything when you are done.
"""


def build_test_sh(module):
    src = open(os.path.join(SKRUB, "tests", "test.sh")).read()
    import re
    middle = RUN_TESTS_MIDDLE.format(module=module)
    out = re.sub(r"# >>> RUN TESTS \(task-specific\) <<<.*?# >>> END RUN TESTS <<<",
                 middle.replace("\\", "\\\\"), src, flags=re.S)
    assert "junitxml=/logs/verifier/junit.xml" in out
    return out


def main():
    _id, slug, title, sha, work, module = sys.argv[1:7]
    task_id = f"featadd-{_id}-{slug}"
    image = f"featadd-{_id}:v1"
    root = os.path.join(OUT, task_id)
    modpath = module[:-3].replace("/", ".")  # sympy/.../test_x.py -> sympy...test_x
    B = [l.strip() for l in open(os.path.join(work, "B.txt")) if l.strip()]
    P1 = [l.strip() for l in open(os.path.join(work, "P1.txt")) if l.strip()]
    to_junit = lambda n: f"{modpath}.{n}"
    f2p = [to_junit(n) for n in B]
    p2p = [to_junit(n) for n in P1]

    if os.path.exists(root):
        shutil.rmtree(root)
    for d in ("tests", "environment", "solution"):
        os.makedirs(os.path.join(root, d))
    w = lambda rel, text, exe=False: (open(os.path.join(root, rel), "w").write(text),
                                      exe and os.chmod(os.path.join(root, rel), 0o755))
    w("task.toml", TASK_TOML.format(task_id=task_id, title=title, sha=sha, image=image))
    w("instruction.md", INSTRUCTION.format(title=title, module=module,
                                           failing="\n".join(f"- {n}" for n in B)))
    w("pre_artifacts.sh", PRE_ARTIFACTS, exe=True)
    shutil.copy(os.path.join(work, "feature.diff"), os.path.join(root, "environment", "feature.diff"))
    w("environment/Dockerfile", ENV_DOCKERFILE.format(base_image=BASE_IMAGE, sha=sha, id=_id))
    w("solution/solution.patch", open(os.path.join(work, "fix.diff")).read())
    w("solution/solve.sh", SOLVE_SH, exe=True)
    w("tests/Dockerfile", TESTS_DOCKERFILE.format(image=image))
    w("tests/test.patch", "")  # tests already in the image; no separate test patch
    w("tests/test.sh", build_test_sh(module))
    shutil.copy(os.path.join(SKRUB, "tests", "grader.py"), os.path.join(root, "tests", "grader.py"))
    w("tests/config.json", json.dumps({
        "base_commit": sha, "f2p_node_ids": f2p, "p2p_node_ids": p2p,
        "grade": {"format": "junit", "tool_label": "pytest-junitxml",
                  "reports": ["/logs/verifier/junit.xml"]}}, indent=1))
    print(f"packaged {task_id}: f2p={len(f2p)} p2p={len(p2p)} image={image} sha={sha[:12]}")
    print(f"  build: docker build -t {image} {root}/environment")


if __name__ == "__main__":
    main()
