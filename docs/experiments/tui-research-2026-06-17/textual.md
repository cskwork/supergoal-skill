I now have everything needed. Compiling the brief.

---

# Textual Capabilities Brief — Multi-Agent Observability Dashboard (in-browser)

Researched against current docs (Textual ≥ 0.x / 1.x line, June 2026). All command/API names verified.

## 1. In-browser serving over HTTP

Two distinct tools — pick by where it must be reachable.

**`textual-serve` (self-hosted, the right choice for a local dashboard)**
- Install: `pip install textual-serve`
- Minimal server (own Python entrypoint):
  ```python
  from textual_serve.server import Server
  server = Server("python -m my_dashboard")   # the command that launches your Textual App
  server.serve()
  ```
- Mechanism: on each browser visit, the server spawns the app **as a subprocess**; browser ↔ app talk over a **websocket** using a custom protocol. It is NOT a shell-in-browser — users are confined to the app's UI. Multiple apps/sessions are hosted **concurrently across available CPUs**.
- CLI shortcut: `textual serve "python -m my_dashboard"` (the `textual` CLI wraps the same server). Default host/port is localhost:8000-class; `Server(command, host=, port=, title=)` parameters control bind address/port. Multi-session = one subprocess per browser tab.
- This is what you want when agents + dashboard run on the same box/VM and you just want a local URL.

**`textual-web` (zero-config public tunnel, beta)**
- Install: `pipx install textual-web`
- Run an app defined in TOML: `textual-web --config serve.toml`, with `[app.Name]` → `command = "..."` (and optional `slug` for the URL).
- Gives a **public URL** (app runs on your machine, reachable over the internet). `--signup` writes `ganglion.toml` with `[account].api_key` → stable URLs tied to your account slug; without it URLs are random per run.
- Serve a terminal instead: `textual-web -t` (macOS/Linux only).
- **Gotchas:** beta; **sessions not yet persistent** — closing the tab closes the app; terminal-serving is a security risk ("don't share with anyone you wouldn't trust on your machine"); color-heavy apps may glitch.

**Cross-cutting serving gotcha:** under either server, `App.suspend()` / `suspend_process` is **ignored** and **app suspension is unavailable** — don't rely on Ctrl-Z/external-editor flows in the served dashboard.

## 2. Pushing EXTERNAL events into the UI without blocking

Textual is asyncio and **not thread-safe**. The idiomatic pattern for "another process/agent writes files or emits events":

**Run the ingest off the UI loop with a worker:**
- `@work(thread=True)` decorator or `self.run_worker(fn, thread=True)` for blocking I/O (reading a socket, named pipe, `inotify`/file watch, SQLite poll, subprocess stdout). API is identical to async workers.
- For async I/O sources, use a plain `@work` (async) worker instead — no thread needed.

**Get data back into widgets safely — two thread-safe escape hatches (only these two):**
1. **`self.post_message(MyEvent(...))`** — preferred. Define a `class Tick(Message)` subclass, post it from the worker thread, handle in `on_tick`/`on_my_event` on the main loop. Batch multiple UI updates this way. (`post_message` is explicitly documented thread-safe.)
2. **`self.call_from_thread(widget.update, value)`** — runs a callable on the main thread and returns its result. Use for one-off direct calls.
- **Do NOT** call widget methods or set reactive attributes directly from a thread worker — "unpredictable results."

**State → UI binding (no manual refresh):**
- `reactive(default)` class attributes with `watch_<name>(self, old, new)` auto-fire on assignment and trigger re-render.
- Watch another object's reactive from outside: `self.watch(obj, "attr", callback, init=False)`.
- So: worker reads external source → `post_message` → handler assigns `self.tasks = new_tasks` (a reactive) → `watch_tasks` repaints the DataTable. External writer never blocks the render loop.

**Polling source (file/SQLite) without threads:**
- `self.set_interval(1.0, self.poll)` schedules an async callback on the loop. Fine for cheap polls; push heavy reads into a thread worker and message the result back.

## 3. Dashboard layout widgets

| Need | Widget | Key API |
|---|---|---|
| Jira-like task board | `DataTable` | `add_columns(*hdr)`, `add_rows(rows)` → returns `RowKey`s; `update_cell(row_key, col_key, val)` for live status flips; `add_column`/`add_row` incremental; sortable, cursor types |
| Agent hierarchy / call tree | `Tree` | nodes via `root.add(...)`, expandable |
| Selectable agent/event list | `ListView` (+ `ListItem`) | |
| Per-agent panels (one tab each) | `TabbedContent` / `TabPane` (+ `Tabs`) | `add_pane()` to add an agent tab at runtime |
| Live scrolling log per agent | `RichLog` | `.write(renderable)` — accepts Rich text/markup, ANSI |
| Workflow-stage / progress | `ProgressBar` | `.update(total=, progress=, advance=)` |
| Chrome | `Header`, `Footer` | yield in `compose`; Footer shows key bindings |

**Per-agent panel pattern:** `TabbedContent` with one `TabPane` per agent, each containing a small `DataTable` (its tasks) + a `RichLog` (its stream). Add panes dynamically as agents register. **Live workflow-stage indicator:** a row of `ProgressBar`s or a single `DataTable` row whose cell is updated via `update_cell` per stage transition; drive it from a reactive `stage` attribute so the watcher repaints automatically. Layout the panels with `Horizontal`/`Vertical`/`Grid` containers + TCSS (`grid-size`, `fr` units) for a multi-panel dashboard.

## 4. Running alongside agents / headless / auto-launch

- **Served = effectively headless already.** Under `textual-serve`/`textual-web` the app is a **subprocess with no controlling terminal**; agents can run in other processes and feed it via files/socket/SQLite (Section 2). This is the clean separation: agents = producers, dashboard process = consumer + web server.
- **Background launch:** start `Server(...).serve()` (or `textual serve "..."`) as a detached background process when your agent run begins; it stays up serving the URL while agents work. There is no separate "headless" flag needed for the served path.
- **Auto-open in browser:** Textual itself doesn't pop a browser for the served app — wrap it: after starting the server, call `webbrowser.open("http://localhost:<port>")` from your launcher script. (`textual serve` prints the URL to stdout; parse or hardcode the known port.)
- **Direct terminal run** (non-served) uses `App().run()` (blocking) or `await App().run_async()` inside an existing loop; `run(inline=True)` renders inline below the prompt (**not on Windows**) — useful if you also want a terminal view, but inline is not the browser path.

## Recommended architecture for your case
Agents emit events to a shared sink (SQLite WAL file or a named pipe / unix socket). Dashboard `App` runs a `@work(thread=True)` reader on that sink, converts each event into a custom `Message`, `post_message`s it; handlers mutate `reactive` state (`tasks`, `stage`, per-agent logs) whose watchers repaint `DataTable`/`ProgressBar`/`RichLog`. Serve the whole app with `textual-serve` locally (concurrent multi-viewer, confined to the UI), and auto-open the localhost URL from the launcher. Use `textual-web --signup` only if you need an internet-reachable URL and can tolerate beta + non-persistent sessions.

### Doc pages read
- Guide/App Basics — `textual.textualize.io/guide/app/` (run, inline, suspend-under-textual-web limitation)
- textual-web README — `github.com/Textualize/textual-web` (commands, ganglion.toml, ports, multi-session, limitations)
- textual-serve README — `github.com/textualize/textual-serve` (`Server` class, subprocess+websocket, concurrent hosting)
- Guide/Workers — `textual.textualize.io/guide/workers` (`@work(thread=True)`, `get_current_worker`, posting messages, `call_from_thread`)
- Guide/Reactivity — `textual.textualize.io/guide/reactivity` and API/dom_node `watch(...)`
- Guide/Events — `textual.textualize.io/guide/events` (custom `Message`, `post_message`)
- API/App — `call_from_thread` (thread-safety note, `post_message` recommended)
- Widget pages — `widgets/data_table`, `widgets/progress_bar`; Header/Footer via `guide/CSS`

**Two corrections to common assumptions worth flagging:** (a) there is no monolithic `textual serve` library API — browser serving is the separate `textual-serve` package's `Server` class (the `textual serve` CLI just wraps it); (b) `textual-web` sessions are **not** persistent yet, so it's unsuitable as the always-on dashboard host — use `textual-serve` for that.