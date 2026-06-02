# QA — black-box exercise of the running app

The QA phase (GREENFIELD/LEGACY, and any web-bug check in DEBUG) drives the real app as a user would
and records **user-observable** evidence in the vault. Path depends on app type.

## Always: run the browser inside a subagent

Dispatch the `qa-tester` subagent to drive the app. Raw page dumps, screenshots, and console logs
stay in **its** context; it returns only a compressed summary + the evidence file paths. Never run
agent-browser from the orchestrator — that floods the conductor's context.

## Web / browser app

1. **Serve.** If the app has a server, start it on localhost in the background (`run_in_background`),
   poll the port/health URL until ready, record the URL. Serve from the Verify `git worktree` (the
   committed build state), not a dirty tree, so QA exercises exactly what ships. Tear it down at end.
   **No server (a static file or single HTML)?** There is nothing to serve — agent-browser opens the
   file directly via its `file://` path from the Verify worktree. Do not improvise another renderer;
   the rest of this section is unchanged.
2. **Tool — `agent-browser` CLI only** (https://github.com/vercel-labs/agent-browser): in this skill,
   "agent-browser" means the shell command `agent-browser`, not the Codex Browser plugin, `iab`,
   Playwright MCP, Computer Use, or another browser surface. The `qa-tester` subagent first records:
   `command -v agent-browser`, `agent-browser --version`, `agent-browser skills get core --full`, and
   `agent-browser doctor`. In sandboxed harnesses, run this preflight with the same permission tier
   needed for QA; socket/state permission failures require escalation, not fallback. Browser target
   checks such as `agent.browsers.list()`, `iab`, `node_repl`, or `npx playwright` are not this
   preflight. If `doctor` still fails, stop before page actions and return `BLOCKED` with the exact
   failing command/output and needed permission or install step.
   **Install is two steps** — both are required before the browser can open:
   (1) `npm install -g agent-browser` (skip if already on PATH); (2) `agent-browser install` —
   downloads the Chrome-for-Testing binary the CLI drives (first time only; a no-op once present; add
   `--with-deps` on Linux for system libs). Skipping step (2) is the common trap: the CLI is on PATH
   but `open` fails with no browser binary, which is **not** "install impossible" — run step (2), do
   not fall back. Only if BOTH steps are genuinely blocked, STOP and prompt the user. The subagent then
   drives the app with `open`, `snapshot` (a11y tree with refs), `click`/`type`/`fill`, `screenshot`.
   **Fallback (only if install is truly impossible):** a headless Chrome/Edge driver may stand in for
   agent-browser, but two rules hold. (a) It still runs **inside this `qa-tester` subagent, never the
   orchestrator** — raw screenshots and dumps must not reach the conductor's context. (b) It is doing
   the **QA** job here (golden + edge + a11y + the as-is/to-be capture); it is **never** folded into
   **Verify**, which stays a pure `run-to-prove` re-run with no browser. A render screenshot is not a
   substitute for Verify's claim re-execution.
3. **Exit gate.** Golden path + edge cases + a11y (`snapshot`) all pass. UI/UX jobs also run the
   taste Pre-Flight Check (`reference/ui-ux.md`).
4. **As-is → to-be (the user-observable proof).** Capture the change at the same route/viewport:
   `qa/as-is-<view>.png` before, `qa/to-be-<view>.png` after. For a DEBUG web bug, as-is = the
   reproduced failure, to-be = the fixed behavior. Identical framing = an honest diff.

## CLI / library (no browser)

Integration smoke only: real invocation against a fixture, diff stdout vs a known-good snapshot.

## Record in the vault (QA docs)

Put evidence under `<vault>/qa/` and summarize in `verification.md` `## QA`:
- a `Tool:` line naming the driver (`Tool: agent-browser`); if it is NOT agent-browser, a `Fallback:`
  line stating why agent-browser was impossible — a silent headless-Chrome fallback is banned,
- an `agent-browser doctor` preflight record for every browser QA run,
- commands run + pass/fail per check,
- the `as-is`/`to-be` screenshot paths (exact names `qa/as-is-<view>.png` / `qa/to-be-<view>.png`,
  browsable in the committed changelog),
- served URL + teardown note.
The vault is committed, so this QA record is the proof the user can open and compare.

## Exit gate (machine-checkable)

The QA phase does not pass until `bash templates/qa-gate.sh <vault> <browser|cli>` exits 0. For a
browser app it requires `qa/as-is-*` + `qa/to-be-*` evidence files, a `## QA` `Tool:` line, and — for
any non-agent-browser driver — a `Fallback:` justification. This is the backstop that stops a run from
silently rendering with headless Chrome and skipping the as-is/to-be proof; it is the QA-phase parallel
to `validate-gate.sh` and `delivery-gate.sh`, and is never edited to pass.

## Repeated QA → make it a repeatable script

The first QA pass may be hand-driven. If the same flow runs again (a Verify/QA rewind re-opens Build,
or the user asks to re-check), STOP hand-driving and propose a **Playwright CLI** script: convert the
agent-browser steps into `qa/<flow>.spec.ts` in the vault, run that on every re-check, and note its
path in `## QA`. One script makes the as-is/to-be diff reproducible instead of re-typed.
