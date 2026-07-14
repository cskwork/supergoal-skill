#!/usr/bin/env bash
# /supergoal WAYFINDER + PROTOTYPE contract.
# Fails if the ticket-frontier route or throwaway prototype route drifts out of
# the router, reference map, README, or landing page.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal WAYFINDER + PROTOTYPE contract   skill: $ROOT"
echo "=================================================================="

assert_file "wayfinder reference exists" "reference/wayfinder.md"
assert_file "prototype reference exists" "reference/prototype.md"
assert_file "Vercel hosting reference exists" "reference/vercel-host.md"

# Router and public docs expose both modes.
assert_text_ci_normalized "SKILL routes WAYFINDER" "SKILL.md" "WAYFINDER"
assert_text_ci_normalized "SKILL points to wayfinder reference" "SKILL.md" "reference/wayfinder.md"
assert_text_ci_normalized "SKILL routes PROTOTYPE" "SKILL.md" "PROTOTYPE"
assert_text_ci_normalized "SKILL points to prototype reference" "SKILL.md" "reference/prototype.md"
assert_text_ci_normalized "README documents WAYFINDER" "README.md" "WAYFINDER"
assert_text_ci_normalized "README documents PROTOTYPE" "README.md" "PROTOTYPE"
assert_text_ci_normalized "README.ko documents WAYFINDER" "README.ko.md" "WAYFINDER"
assert_text_ci_normalized "README.ko documents PROTOTYPE" "README.ko.md" "PROTOTYPE"
assert_text_ci_normalized "landing counts twelve modes" "docs/index.html" "Twelve modes"
assert_text_ci_normalized "landing has wayfinder card" "docs/index.html" "WAYFINDER"
assert_text_ci_normalized "landing has prototype card" "docs/index.html" "PROTOTYPE"

# WAYFINDER preserves the upstream ticket-frontier idea without making it product delivery.
assert_text_ci_normalized "wayfinder is not product delivery" "reference/wayfinder.md" "writes no product code by default"
assert_text_ci_normalized "wayfinder supports issue tracker" "reference/wayfinder.md" "native tracker"
assert_text_ci_normalized "greenfield keeps broad builds in greenfield" "SKILL.md" 'broad/foggy builds first use a `wayfinder/` Frontier Map inside the run vault'
assert_text_ci_normalized "greenfield frame uses internal scope gate" "reference/role-loop.md" 'use `reference/wayfinder.md` inside this same run vault'
assert_text_ci_normalized "role-loop defines greenfield scope gate" "reference/role-loop.md" "GREENFIELD scope gate"
assert_text_ci_normalized "role-loop keeps broad greenfield mode" "reference/role-loop.md" 'keep the mode `GREENFIELD`'
assert_text_ci_normalized "role-loop carries only frontier checks" "reference/role-loop.md" 'carry only that ticket'\''s acceptance checks into `GOAL.md` / `PLAN.md`'
assert_text_ci_normalized "wayfinder defines greenfield scope gate" "reference/wayfinder.md" "## GREENFIELD scope gate"
assert_text_ci_normalized "wayfinder keeps user-facing route greenfield" "reference/wayfinder.md" 'keep the top-level mode `GREENFIELD`'
assert_text_ci_normalized "wayfinder copies only selected ticket checks" "reference/wayfinder.md" 'copy only that ticket'\''s acceptance checks into the delivery `GOAL.md` / `PLAN.md`'
assert_text_ci_normalized "README explains broad greenfield frontier map" "README.md" "Broad new-app builds stay GREENFIELD"
assert_text_ci_normalized "README.ko explains broad greenfield frontier map" "README.ko.md" "넓은 새 앱 build는 GREENFIELD에 남기되"
assert_text_ci_normalized "landing explains broad greenfield frontier map" "docs/index.html" "broad GREENFIELD builds first use an internal wayfinder map"
assert_text_ci_normalized "wayfinder nests local markdown under run vault" "reference/wayfinder.md" 'current run vault'\''s `wayfinder/` subfolder'
assert_text_ci_normalized "wayfinder names canonical vault path" "reference/wayfinder.md" "docs/changelog/<YYYY-MM>/<DD-topic>/wayfinder/"
refute_text_ci_normalized "wayfinder rejects old standalone docs path" "reference/wayfinder.md" "docs/wayfinder/<slug>"
assert_text_ci_normalized "wayfinder map has destination" "reference/wayfinder.md" "Destination"
assert_text_ci_normalized "wayfinder records blocker edges" "reference/wayfinder.md" "Blocked by:"
assert_text_ci_normalized "wayfinder names frontier" "reference/wayfinder.md" "Frontier"
assert_text_ci_normalized "wayfinder requires vertical tickets" "reference/wayfinder.md" "vertical slice"
assert_text_ci_normalized "wayfinder tickets are goal detail slices" "reference/wayfinder.md" '`GOAL.md` detail slice'
assert_text_ci_normalized "wayfinder tickets name routes" "reference/wayfinder.md" "Route: GREENFIELD|DEBUG|LEGACY|QA-ONLY|REVIEW-ONLY|PROTOTYPE"
assert_text_ci_normalized "wayfinder owns spec-depth requests" "SKILL.md" "spec / requirements first / break down"
assert_text_ci_normalized "wayfinder forbids parallel docs spec workflow" "reference/wayfinder.md" 'do not create a parallel `docs/spec/<feature-slug>/` workflow'
assert_text_ci_normalized "wayfinder keeps glossary depth" "reference/wayfinder.md" "Glossary"
assert_text_ci_normalized "wayfinder keeps user story depth" "reference/wayfinder.md" "As a [role], I want [feature], so that [benefit]"
assert_text_ci_normalized "wayfinder keeps EARS depth" "reference/wayfinder.md" "WHEN [event] THEN [system] SHALL [response]"
assert_text_ci_normalized "wayfinder keeps edge cases" "reference/wayfinder.md" "Edge cases"
assert_text_ci_normalized "wayfinder keeps decision records" "reference/wayfinder.md" "Decision records"
assert_text_ci_normalized "wayfinder grills load-bearing decisions" "reference/wayfinder.md" "Grill load-bearing decisions one question at a time"
assert_text_ci_normalized "wayfinder explores code instead of asking" "reference/wayfinder.md" "inspect the code instead of asking"
assert_text_ci_normalized "wayfinder depth never replaces ground truth" "reference/wayfinder.md" "never replace ground truth"
assert_text_ci_normalized "wayfinder works one ticket per session" "reference/wayfinder.md" "one frontier ticket per session"
assert_text_ci_normalized "wayfinder carries frontier criteria to goal" "reference/wayfinder.md" 'carry only that ticket'\''s acceptance checks into `GOAL.md`'
assert_text_ci_normalized "wayfinder stops after one ticket" "reference/wayfinder.md" "do not start a second ticket in the same context"
assert_text_ci_normalized "wayfinder asks for context clear" "reference/wayfinder.md" "clear context before the next ticket"
assert_text_ci_normalized "wayfinder asks for integration test" "reference/wayfinder.md" "integration test / end-to-end check"

# PROTOTYPE keeps the prototype answer separate from delivery proof.
assert_text_ci_normalized "prototype is throwaway" "reference/prototype.md" "throwaway proof"
assert_text_ci_normalized "prototype asks one question" "reference/prototype.md" "answers one question"
assert_text_ci_normalized "prototype records decision signal" "reference/prototype.md" "Decision signal"
assert_text_ci_normalized "prototype requires one command or URL" "reference/prototype.md" "one command or one URL"
assert_text_ci_normalized "prototype forbids production mutations" "reference/prototype.md" "No production migrations"
assert_text_ci_normalized "prototype has logic path" "reference/prototype.md" "Logic/state prototype"
assert_text_ci_normalized "prototype has UI variant path" "reference/prototype.md" "three structurally different variants"
assert_text_ci_normalized "prototype UI loads superdesign" "reference/prototype.md" 'load and follow the installed `superdesign` skill'
assert_text_ci_normalized "prototype UI preserves superdesign gates" "reference/prototype.md" "preflight and rendered-verification gates"
assert_text_ci_normalized "prototype runnable UI uses superdesign build mode" "reference/prototype.md" "CREATE or REDESIGN"
assert_text_ci_normalized "prototype missing superdesign stops" "reference/prototype.md" "stop and ask the user to install it"
assert_text_ci_normalized "prototype nonvisual paths skip superdesign" "reference/prototype.md" "Do not load SuperDesign for logic/state or data/API prototypes"
assert_text_ci_normalized "prototype has data API path" "reference/prototype.md" "Data/API prototype"
assert_text_ci_normalized "prototype captures the answer" "reference/prototype.md" "answer to the question"
assert_text_ci_normalized "prototype must delete or quarantine" "reference/prototype.md" "Delete or quarantine"
assert_text_ci_normalized "prototype offers public Vercel hosting" "reference/prototype.md" "public, shareable URL"
assert_text_ci_normalized "prototype requires approval before Vercel deploy" "reference/prototype.md" "Do not deploy before the user explicitly agrees"
assert_text_ci_normalized "prototype routes approved hosting" "reference/prototype.md" "reference/vercel-host.md"
assert_text_ci_normalized "SKILL maps Vercel hosting reference" "SKILL.md" "reference/vercel-host.md"
assert_text_ci_normalized "Vercel hosting verifies CLI auth" "reference/vercel-host.md" "vercel whoami"
assert_text_ci_normalized "Vercel hosting explains interactive login" "reference/vercel-host.md" "vercel login"
assert_text_ci_normalized "Vercel hosting requires isolated project" "reference/vercel-host.md" "isolated Vercel project"
assert_text_ci_normalized "Vercel hosting performs dry run" "reference/vercel-host.md" "vercel deploy --dry"
assert_text_ci_normalized "Vercel hosting deploys production URL" "reference/vercel-host.md" "vercel deploy --prod"
assert_text_ci_normalized "Vercel hosting checks anonymous access" "reference/vercel-host.md" "signed-out browser"
assert_text_ci_normalized "prototype cannot satisfy delivery done" "reference/prototype.md" 'PROTOTYPE cannot satisfy delivery `Done`'
assert_text_ci_normalized "SKILL reference map routes prototype UI to superdesign" "SKILL.md" 'UI/interaction prototypes must also load the installed `superdesign` skill'
assert_text_ci_normalized "README documents superdesign prototype route" "README.md" "UI/interaction prototypes load SuperDesign"
assert_text_ci_normalized "README.ko documents superdesign prototype route" "README.ko.md" "UI/interaction prototype은 SuperDesign을 로드"
assert_text_ci_normalized "landing documents superdesign prototype route" "docs/index.html" "UI/interaction prototypes load SuperDesign"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
