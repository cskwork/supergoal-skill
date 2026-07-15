# playwright-cli - browser-driver fallback

Policy: playwright-cli is fallback-only for supergoal QA, DEBUG observe-first, and LEGACY baseline
work. The package is `@playwright/cli` (microsoft/playwright-cli). Use it only when `agent-browser`
cannot complete reliable QA. Run it inside `qa-tester`, never `qa-auditor` or the conductor, and record
both lines:

```text
Tool: playwright-cli
Fallback: <why agent-browser could not QA properly>
```

## Get the fallback driver (inside the subagent)

1. `command -v playwright-cli`; if absent, `npm install -g @playwright/cli@0.1.14` (Node 18+).
   This is the gate-tested package pin. Update this reference and rerun `bash tests/run-all.sh` before
   moving it.
2. `playwright-cli install --skills` installs matching upstream instructions; otherwise use
   `playwright-cli --help`.
3. Headless is default; use `--headed` to watch. Open system Chrome with
   `playwright-cli open <url> --browser=chrome`, or install Chromium with
   `npx playwright install chromium`.
4. If installation is blocked, stop and ask the user. Do not substitute another browser tool.

## Drive a page

- `playwright-cli open <url>` / `goto <url>` - open / navigate (`file://` for static HTML).
- `playwright-cli snapshot` - get element refs; re-snapshot after navigation.
- `playwright-cli click <ref>` / `type <text>` / `fill <ref> <text> [--submit]` /
  `hover|select|check` - interact by ref, CSS selector, or locator.
- `playwright-cli screenshot [ref] --filename=<path>` - capture evidence.
- `playwright-cli press <key>`, `go-back|go-forward|reload`, `resize <w> <h>`, `close`.

## Network capture

- `playwright-cli requests` - list requests since page load.
- `playwright-cli request <index>` - inspect one request/response.
- `playwright-cli console [min-level]` - inspect console output at the symptom boundary.

Promote a confirmed screen-to-API mapping into `qa/nav-map.md`.

## Tabs and authentication

- Tabs: `tab-list`, `tab-new [url]`, `tab-select <index>`, `tab-close [index]`; snapshot after switch.
- Named session: `playwright-cli -s=<name> <cmd>` or `PLAYWRIGHT_CLI_SESSION`.
- Persistent profile: `--persistent`.
- Auth state: `state-save <file>`, then `state-load <file>`.
- Existing browser over CDP: inspect `playwright-cli open --help` for attach flags.

## Repeatable spec

After the exploratory run, save repeatable coverage under `qa/<flow>.spec.ts` (`run-code` / locators)
and record its path in `## QA`.

Full command list: `playwright-cli --help` or the upstream skill
(`playwright-cli install --skills`; https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli).
