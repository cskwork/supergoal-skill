# QA - black-box exercise of the running app

QA drives the real app like a user and records user-observable evidence. It applies to
GREENFIELD/LEGACY and web-bug checks in DEBUG.

## Always use the `qa-tester` subagent

Browser dumps, screenshots, and console logs stay in `qa-tester` context. The conductor receives only
the summary and evidence paths. Do not run browser QA from the conductor.

## Browser app

1. **Serve.** Start the app from the working tree (or the Verify worktree when one is used), poll
   until ready, record URL, tear down at end. Static/single HTML opens via `file://` from that tree.
2. **Use `agent-browser` CLI.** It means the shell command `agent-browser`, not Codex Browser,
   Playwright MCP, Computer Use, `iab`, or ad hoc Chrome. Preflight and record:
   `command -v agent-browser`, `agent-browser --version`, `agent-browser skills get core --full`,
   `agent-browser doctor`.
3. **Install if needed.** Two steps: `npm install -g agent-browser` if absent, then
   `agent-browser install` for Chrome-for-Testing. Missing browser binary is not fallback-worthy; run
   step 2. If both steps are genuinely blocked, stop and ask the user.
4. **Drive flows.** Use `open`, `snapshot`, `click`/`type`/`fill`, `screenshot`. Golden path, edge cases,
   and a11y must pass. UI/UX jobs also run `reference/ui-ux.md` pre-flight (Expressive or Functional
   tier), record a `UI-tier: Expressive|Functional` line in `## QA`, and enumerate the text/background
   pairs to `qa/contrast-pairs.json` — `qa-gate.sh` runs the contrast gate on it and blocks on any FAIL.
5. **Fallback only when install is impossible.** A headless Chrome/Edge driver may replace
   `agent-browser` only inside `qa-tester`, never the conductor, and only for QA. The Verify step
   still re-runs the project's REAL tests with no browser.
6. **Capture as-is/to-be.** Same route and viewport:
   `qa/as-is-<view>.png` before, `qa/to-be-<view>.png` after. For DEBUG, as-is is the failure and to-be
   is fixed behavior.

## Authenticated sessions (attach-to-browser)

`agent-browser` is the default driver. When a flow needs a real, already-logged-in session that
`agent-browser`'s fresh Chrome-for-Testing cannot carry, switch to **attach-to-browser** — drive the
user's existing browser over the Playwright CLI (`https://github.com/cskwork/attach-to-browser-skill`).
Still run and record the `agent-browser doctor` preflight first (the gate requires it for every browser
run; it documents that agent-browser was checked). Then record the driver on the `Tool:` line (e.g.
`Tool: attach-to-browser`) and justify on the `Fallback:` line (`Fallback: authenticated session
required; agent-browser cannot carry the logged-in session`), so the QA gate's non-agent-browser check
is satisfied. Capture as-is/to-be the same way. This is a sanctioned driver, not a silent shortcut; a
headless-Chrome render is still only for impossible installs.

## CLI / library

Run an integration smoke: real invocation against a fixture, stdout/stderr/exit-code compared to
known-good output.

## Vault record

Put evidence under `<vault>/qa/` and summarize in `verification.md` `## QA`:

- `Tool: <driver>`; if not `agent-browser`, add `Fallback: <why agent-browser was impossible>`.
- `agent-browser doctor` preflight for every browser QA run.
- Commands run and pass/fail per check.
- Exact `qa/as-is-<view>.png` and `qa/to-be-<view>.png` paths.
- Served URL and teardown note.

## Exit gate

QA passes only when `bash templates/qa-gate.sh <vault> <browser|cli>` exits 0. Browser runs require
as-is/to-be evidence, a `Tool:` line, and non-agent-browser `Fallback:` justification. Never edit the
gate to pass.

## Repeatable script

First QA may be hand-driven. On any re-check, stop hand-driving and propose a Playwright CLI script in
`qa/<flow>.spec.ts`; record its path in `## QA`.
