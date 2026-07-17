#!/bin/bash
set -euo pipefail
cd /Users/danny/Documents/PARA/Resource/supergoal-skill/docs/experiments/2026-07-17-debug-luna-ab
docker build -t sympy-swe-base:v1 -f base.Dockerfile .
docker build -t sympy-swe-24102:v1 /tmp/deep-swe-sg/tasks/sympy-24102-parse-mathematica-greek/environment
docker build -t sympy-swe-21847:v1 /tmp/deep-swe-sg/tasks/sympy-21847-itermonomials-min-degrees/environment
docker build -t sympy-swe-23262:v1 /tmp/deep-swe-sg/tasks/sympy-23262-lambdify-single-tuple/environment
echo "all images built"
