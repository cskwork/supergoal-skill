# Market research - GREENFIELD Validate

Validate asks whether to build before Build opens. It seeks directional demand evidence and a bounded
MVP, not market sizing or pricing forecasts. State that limitation. Position `/supergoal` as a
supervised, gated delivery loop for bounded objectives, not a hands-off engineer.

## `brief.md` `## Validation` must include

1. **Problem & target user.** One Jobs-To-Be-Done sentence: "When [situation], I want [motivation], so
   I can [outcome]." If you cannot write it, ask the user.
2. **Demand evidence** via fan-out:
   - Competitors/substitutes: who solves this, pricing, user complaints.
   - Search/keyword signal: are people looking?
   - Existing-solution check: build vs adopt.
3. **Riskiest assumption.** Name the belief that sinks the product if false.
4. **MVP scope.** Smallest thing that tests the riskiest assumption and serves the JTBD. Everything
   else is a non-goal.
5. **Decision line.** End with exactly one line:
   - `Decision: GO` when demand is real, no adequate existing solution exists, and MVP is bounded.
   - `Decision: NO-GO` when an existing tool suffices, no demand signal appears, or the objective stays
     vague after one question. Stop; do not build on spec.

## Dispatch

Validate is wide-and-shallow. Fan out one subagent per evidence stream. The Analyst persona
(`agents/analyst.md`) writes JTBD, riskiest assumption, MVP scope, and Decision into `brief.md`.

Use the session's web/search tools. If the environment uses `ctx_*` / context-mode tools, use those;
do not force blocked `curl`/`wget`.

## Why gated

Autonomous coding capacity is scarce. A short evidence pass that prevents one wrong build pays for
itself.
