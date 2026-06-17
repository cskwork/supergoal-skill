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

## Navigation map (load first; build on first entry; self-heal on drift)

Complex apps (auth gates, popups, new tabs, deep routes) burn QA budget re-discovering how to reach a
screen. The repo's `.domain-agent/qa/nav-map.md` is the durable map that makes navigation cheap and
repeatable, gives DEBUG observe-first the `screen -> API` routing it needs, and routes LEGACY to the
exact screen whose API it must baseline before a refactor. It is
repo-local and gitignored (`reference/domain-context.md`); no app-specific selector, route, or
credential ever lives in this skill.

1. **Load first.** Before driving, read `.domain-agent/qa/nav-map.md` if present and navigate by its
   entry/auth flow, route list, popup/new-tab triggers, tab-switch notes, and stable selectors.
2. **Build on first entry (when absent).** Within the action budget, do one light mapping pass and save
   it: the entry/auth flow; the `screen -> URL` route list; every click that opens a **new tab or
   popup** and the resulting target; how to switch the driver to that target; stable selectors for key
   controls; and each screen's real API calls from `agent-browser network requests` (method + path).
   Write `.domain-agent/qa/nav-map.md` and index it in `index.md`.
3. **Self-heal on drift.** When a saved entry no longer matches the live site - a selector ref is gone,
   a route 404s/redirects, a popup opens a different target, or an API path/method changed - re-map only
   that slice, correct that row, and bump `config.json.lastUpdated`. Never re-crawl the whole app. This
   is how a site change flows back into the map inside the workflow, so the next DEBUG/QA run navigates
   the current site.

**New tab / popup handling.** When an action opens a new tab or popup, switch the driver to that target
and re-`snapshot` before interacting, then record `trigger -> target` in nav-map (confirm the exact
agent-browser tab/target subcommand via `agent-browser skills get core --full`).

## API behavior baseline (LEGACY preserve)

Before refactoring or integrating against an existing API, capture its exact behavior so the refactor
preserves it (preserve the contract; DEBUG's `screen -> endpoint` only localizes). Save to the run vault
`<vault>/qa/api-baseline-<endpoint>.md`: method + path + status + a representative request and the
response shape (the contract, not every value).

- **UI-reachable** - reach the screen via `qa/nav-map.md` and capture real calls with `agent-browser
  network requests --filter <api-prefix>` (through `qa-tester`); promote a confirmed `screen -> API` row
  back into nav-map.
- **Backend-only (no UI)** - capture at the HTTP level: a recorded curl/HAR or an HTTP probe (e.g. the
  `verify` skill) against the running endpoint.

After the refactor, re-capture the same call and diff against the baseline; unintended drift is a red to
resolve (role-loop Verify). Baselines are per-run vault evidence, never the domain pack - strip secrets,
tokens, and PII from saved bodies.

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
