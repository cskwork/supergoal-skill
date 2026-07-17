#!/bin/bash
set -euo pipefail
cd /Users/danny/Documents/PARA/Resource/supergoal-skill/docs/experiments/2026-07-17-debug-luna-ab
docker build -t sympy-swe-base:v1 -f base.Dockerfile .
docker build -t sympy-swe-21171:v1 /tmp/deep-swe-sg/tasks/sympy-21171-latex-singularityfunction-exp/environment
docker build -t sympy-swe-21379:v1 /tmp/deep-swe-sg/tasks/sympy-21379-subs-polynomialerror/environment
echo "all images built"
