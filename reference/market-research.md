# Market research — the GREENFIELD Validate phase

oh-my-symphony has **no demand-validation step** — it starts at Brief and never asks *whether to
build*. This is the single biggest gap `/supergoal` closes. Validate runs **before any Build
ticket opens**: cheap evidence first, code second. Kills the most expensive failure mode — shipping
something nobody wanted.

Scope honestly: the research found **no reliable market-sizing/pricing data sources** in the
verified set, so this phase produces **directional demand evidence and a scoped MVP**, not a market
forecast. State that limitation in the Validation section. The product stance the research supports is to
**position on verifiability, not hype** — `/supergoal` is a supervised, gated delivery loop for
bounded objectives, not a hands-off autonomous engineer (openaitoolshub.org Devin eval; cognition.ai).

## What Validate must produce (the `## Validation` section of `brief.md`)

1. **Problem & target user** — Jobs-To-Be-Done: "When [situation], I want to [motivation], so I can
   [outcome]." One sentence. If you can't write it, the objective is too vague — ask the user.
2. **Demand evidence** (gather in a parallel fan-out — this is wide-and-shallow work):
   - Competitor / substitute scan: who solves this now, what they charge, what users complain about
     (app-store reviews, forums, issue trackers).
   - Search/keyword signal: are people actively looking for this?
   - Existing-solution check: is there an off-the-shelf tool that already does it (build-vs-adopt)?
3. **Riskiest assumption** — the one belief that, if false, sinks the product. Name it.
4. **MVP scope** — the smallest thing that tests the riskiest assumption and delivers the core JTBD.
   Everything not essential to that → explicit non-goal.
5. **Decision line** (the exit gate). End the `## Validation` section of `brief.md` with exactly one
   line — `Decision: GO` or `Decision: NO-GO` — because the delivery gate matches that line, not
   prose. Put the reasoning above it:
   - **GO** — demand evidence is real, no adequate existing solution, MVP scope is bounded.
   - **NO-GO** — an existing tool already does it / no demand signal / objective too vague after one
     clarifying question. → **Stop and report. Do not build on spec.**

## Dispatch

Validate is wide-and-shallow → **fan out**: one subagent per evidence stream (competitors / search
signal / existing solutions), each returns a compressed summary into the Validation section of
`brief.md`. The Analyst (Opus) then writes the JTBD, riskiest assumption, MVP scope, and Decision.

Web access: prefer the session's search tools. If this environment routes web access through
`ctx_*` / context-mode tools (see project CLAUDE.md), use those; never use blocked `curl`/`wget`.

## Why a gate here, not a vibe

Autonomous coding completes only ~14-15% of complex real-world tasks unassisted (Answer.AI Devin
eval; Cognition 79/570 ≈ 13.9%). Building the wrong thing wastes that scarce capability entirely.
A 20-minute evidence pass that prevents one wrong build pays for itself many times over.
