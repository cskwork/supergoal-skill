# agent-browser - the default browser driver

Policy: agent-browser is the default browser driver for supergoal QA, DEBUG observe-first, and LEGACY
baseline work. The package is `vercel-labs/agent-browser`. Run it inside `qa-tester`; record
`Tool: agent-browser`.

## Install check

1. `command -v agent-browser`; if absent, `npm install -g agent-browser`.
2. `agent-browser install` downloads Chrome for Testing. On Linux, use
   `agent-browser install --with-deps` when system libraries are missing.
3. Diagnose launch failures with `agent-browser doctor` (`--offline --quick` without network).
4. If agent-browser still cannot complete reliable QA, use the documented Playwright CLI fallback
   and record the required reason. Do not silently switch drivers.

## Open, inspect, interact, capture

```bash
agent-browser open <url>
agent-browser snapshot -i
agent-browser click @e1
agent-browser fill @e2 "text"
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot qa/evidence.png --full
```

Use refs from the latest snapshot; re-snapshot after navigation or material DOM changes. Other common
actions: `type`, `press`, `hover`, `select`, `check`, `scroll`, and semantic locators such as
`agent-browser find role button click --name "Submit"`.

## Network (DEBUG and LEGACY)

```bash
agent-browser network requests
agent-browser network requests --filter api --type xhr,fetch
agent-browser network request <requestId>
```

The list establishes screen-to-API traffic; request detail provides method, URL, status, headers, and
body. Promote confirmed mappings into `qa/nav-map.md`.

## Tabs and popups

`agent-browser tab` lists stable IDs such as `t1`. Use `tab new [url]`, `tab <tN>`, and
`tab close [tN]`. After switching to a popup/new tab, take a fresh snapshot before interacting.

## State and authentication

- Save after login: `agent-browser state save auth.json`; reuse with
  `agent-browser --state auth.json open <url>` (or `state load auth.json` in the active session).
- Isolate runs with `--session <id>`; add `--restore` to persist cookies/localStorage across restarts.
- Reuse a Chrome login snapshot with `--profile <name>` or import from a trusted running browser via
  `agent-browser --auto-connect state save auth.json`.
- Auth state contains session tokens. Never commit it; delete it when no longer needed.

## Console and page errors

`agent-browser console` shows browser logs/warnings/errors. `agent-browser errors` shows uncaught page
exceptions. Use `--json` where structured evidence helps and `--clear` before reproducing a symptom.

## Close

Always run `agent-browser close` when finished (`close --all` only when every active session belongs to
the task).

Full command list: `agent-browser --help`, `agent-browser skills get agent-browser --full`, or
https://github.com/vercel-labs/agent-browser.
