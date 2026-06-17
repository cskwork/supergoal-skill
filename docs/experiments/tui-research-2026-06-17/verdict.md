All load-bearing claims verified. I found one concrete fabrication in the cross-design integration. Final verdict below.

---

# Adversarial Verification — Supergoal Observability Dashboard

**VERDICT: ship-with-fixes.** The research is grounded, the concurrency core is sound, but there is one fabricated path that breaks the two designs against each other, and the TUI/protocol as specced is heavier than the core ask. Fix the path mismatch and trim before building.

---

## 1. FABRICATION — what I checked

Spot-checked the four most load-bearing claims. **All four are grounded, not invented:**

| Claim | Status |
|---|---|
| `textual_serve.server.Server(command, host, port, title)`, subprocess-per-visit over websocket, **does not auto-open browser** | CONFIRMED verbatim against textual-serve README |
| `post_message` thread-safe + recommended; `call_from_thread` the alternative; `@work(thread=True)` exists | CONFIRMED verbatim against Textual Workers guide |
| doubt-driven CLAIM→EXTRACT→DOUBT→RECONCILE→STOP, 3-cycle hard bound, "doubt theater" anti-signal, 4-way precedence | CONFIRMED verbatim against addyosmani SKILL.md |
| diagnose feedback-loop-first, 10-rung cheapest-first ladder, 3-5 ranked falsifiable hypotheses, `[DEBUG-xxxx]` tags, 6 phases | CONFIRMED verbatim against mattpocock SKILL.md |

Remaining Textual APIs named (`DataTable.update_cell`, `RichLog.write`, `reactive`/`watch_*`, `set_interval`, `Static`, `Header`/`Footer`, `cursor_type`) are all standard current Textual — no hallucination signals. The §6 "what Textual cannot do" list is honest and correct (no header right-slot, no per-cell hover tooltip, no full-cell bg fill, suspend ignored under serve, file-watching not built-in). That self-limiting section is a strong credibility signal.

**One fabrication / internal contradiction (MUST-FIX #1):** The two sibling designs disagree on where state lives, and the TUI design invented a path that contradicts the protocol design *and* the local inventory.

- STATE PROTOCOL design: registry is `${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}/<run_epoch>/agents/<agent_id>.json` — **deliberately outside the target repo** with an explicit, correct rationale (writing into the repo dirties `git status`, which ARCH/REVIEW-ONLY treat as a baseline violation).
- TEXTUAL TUI design §0: reads `<target-repo>/.omx/state/agents/<agent-id>.json` and §5 claims it reads "the same `.omx/state` surface the host harness already writes."

These cannot both be true. The TUI is pointed at a path the protocol never writes. Worse, §5's justification is **factually wrong against the local inventory**: `.omx/state/*` is host-owned, per-session, schemaVersion'd telemetry — it does **not** contain per-agent `agent_id.json` heartbeats with a `tasks[]` board. The TUI claim "reads the same surface the harness already writes, plus new per-agent files" conflates two unrelated surfaces. **Pick one path.** The protocol's `$HOME/.supergoal/runs` is the correct choice (its git-cleanliness rationale is sound); the TUI must be repointed there and §0/§5 rewritten. As written, the dashboard would read an empty/nonexistent directory.

Minor schema drift (same root cause): protocol uses `phase` + ISO-8601-Z `updated_at`; TUI consumes `stage` + epoch-float `updated_at`. Reconcile field names and timestamp type, or the reader silently shows blanks.

---

## 2. CONCURRENCY SOUNDNESS — solid, with one real bug

The core claim — **correctness from "one writer per file + atomic rename"** — is correct and the right call over JSONL/SQLite for a point-in-time snapshot surface.

- **Torn read: avoided.** temp+`mv -f` within the same dir → `rename(2)` atomic on POSIX local FS. Reader sees old-complete or new-complete. Correct.
- **Same branch/worktree corruption: cannot happen.** `agent_id` embeds `pid`, so two agents on `feat/login` own two distinct files. Branch is a display field, not a mutex. This is the design's strongest point and it holds — there is genuinely no shared mutable file, so no lock is needed.
- **Stale/dead detection: robust.** Reader-side only (`kill -0` AND/OR `updated_at` age), writers never reap. PID-reuse false-positive correctly mitigated by AND-ing with freshness. Cross-host `kill -0` correctly downgraded to timestamp-only. Good.

**Real bugs to fix:**

- **MUST-FIX #2 — read/write race in `sg-emit`'s carry-forward.** §3 step 3: "carry forward `tasks[]` from the existing heartbeat." The helper reads `$DEST`, merges, writes `$TMP`, renames. The single-writer guarantee holds *only if one agent never runs two `sg-emit` calls concurrently*. The conductor drives phase emits AND a PostToolUse hook bumps `updated_at` — these are two emit paths for the same `agent_id` file. If a hook-emit and a phase-emit overlap, the second read can miss the first's `tasks[]` write (lost update). The `.tmp.$$` suffix does **not** save you — both writers rename over the same `$DEST`, last-writer-wins, and the carry-forward read is non-atomic w.r.t. the rename. Fix: serialize emits *within* an agent (the agent is single-process, so a simple in-process flag/flock on a per-agent lock file), or make the PostToolUse heartbeat write a *separate* `.heartbeat` file the reader maxes against, never touching the board file. The design asserts "same agent is single-process ⇒ no overlap" — that's true for processes but false for two async emit triggers in the same process.

- **SHOULD-FIX #3 — `jq` dependency contradicts "tiny POSIX-sh helper, no client lib."** §3 rejects SQLite partly because it "needs a client lib in every emit path," then the reference implementation shells out to `jq` for the merge. `jq` is not POSIX and not guaranteed present. Either declare `jq` a hard dependency (and drop the "no lib" rejection argument as inconsistent) or do the merge without it. Minor, but the stated rationale is self-undercutting.

- **SHOULD-FIX #4 — networked-FS claim is overstated.** §6 says rename "stays atomic" because temp is in the same dir. True for same-mount, but the design also says the registry defaults to `$HOME`, which on many corp/VM setups *is* NFS. `rename(2)` atomicity on NFS is not guaranteed across all servers. The mitigation ("local `$HOME` avoids NFS") is an assumption, not a guarantee — call it out as a known limitation rather than "avoids NFS entirely."

---

## 3. BASELINE-FIRST FIT — mostly compliant, two risks

The explicit invariant ("droppable; if no agent emits, every gate still passes; `SG_AGENT_ID` unset ⇒ exit 0 silently; no gate reads these files") is correctly stated and is the right framing. The IMPROVEMENTS table's REJECTED list is disciplined and correct — it rejects `/build auto` chaining, blanket ADRs, the HTML/Mermaid report, and (crucially) **the TUI-as-skill-feature itself**, with sound reasoning. That self-rejection is the most baseline-first-aligned judgment in the whole package.

**Risks:**

- **MUST-FIX #5 — the launch overlay can stall a run despite claims.** TUI §5 says `bash tui/launch.sh &` is "fire-and-forget, never blocks." But `launch.sh` contains a bounded busy-wait (`for _ in $(seq 1 30); do ... sleep 0.2; done`) = up to 6s, and a `nohup python -m tui.serve` spawn. Backgrounded with `&` it won't block the *shell*, but if the SKILL.md anchor invokes it synchronously in an agent turn (the wording is ambiguous), the agent waits. Tighten the SKILL.md line to mandate `&` + immediate return, and move the port-wait *inside* the backgrounded process, not the caller. Otherwise an opt-in observability toy adds latency to every run that sets `SUPERGOAL_TUI=1`.

- **SHOULD-FIX #6 — protocol's hook wiring risks becoming de-facto ceremony.** The "Stop hook is the only *mandatory* hook (liveness honesty)" line is a yellow flag. A mandatory hook that every served run must wire is one config-edit away from being a step the user must maintain. Keep it strictly optional; if the Stop hook is absent, the reader just ages the agent to `dead` via timestamp — which the design already supports. Drop the word "mandatory."

The TUI does **not** become a delivery gate — confirmed: no `*-gate.sh` entry, the only added test is a producer/consumer parse check. Good.

---

## 4. OVER-ENGINEERING — yes, trim hard

The protocol (8 sections, audit JSONL, archive dir, TTL pruning, 9-field schema + per-task sub-objects, two hooks) and the TUI (6 widgets, file-watch worker + liveness tick + per-agent 500-deque log buffers, idempotent dual-guard launcher, follow-latest) together are **materially heavier than the core ask**.

**Smallest version that delivers the actual request** (real-time per-agent mode+stage, repo/branch/worktree, Jira-like tasks, in-browser, lock-free):

1. **State:** keep heartbeat-JSON + atomic rename (this IS the load-bearing idea — keep it). **Cut for v1:** the optional JSONL audit stream (§7), the `_archive/` move, TTL auto-pruning (a cron/manual `rm` suffices), and the PostToolUse heartbeat hook (which is also the source of MUST-FIX #2 — removing it eliminates the intra-agent race entirely). One file per agent, replaced on phase transition, reader ages by timestamp. That's the whole protocol.
2. **Schema:** flatten. `agent_id, repo, branch, worktree, mode, phase, current_task, updated_at, pid, host, tasks[]`. Drop top-level `task_status` (redundant with per-task `status`), drop per-task `phase` (the inventory shows no mode emits task-level phase today — it's speculative). `note` optional.
3. **TUI:** the file-watch worker is over-engineered for the v1 cadence (phase transitions are seconds-to-minutes apart, not ms). `set_interval(1.0)` polling mtimes is zero-new-dependency, and §6 already admits `watchdog` is an undesirable new dep. **Ship the poll, skip `watchdog`.** Keep the liveness tick (needed regardless). Keep DataTable roster + DataTable board + RichLog + Static stage strip. Cut `follow-latest`, per-agent deque log buffers (tail the selected agent's file on selection), and the `lsof`+pidfile dual-guard (a single pidfile check is enough for a local dev toy).

This cuts roughly half the surface while delivering every item in the literal ask. The full protocol's JSONL/archive/TTL machinery is real engineering for a problem (audit replay, retention) nobody asked for yet — add it when a post-mortem need actually appears, per the project's own deprecation/lazy-doc ethos.

---

## Must-fix list (concrete)

1. **Path contradiction (fabrication):** TUI reads `<repo>/.omx/state/...`; protocol writes `$HOME/.supergoal/runs/...`. They don't meet. Repoint TUI to the protocol path; delete the false "reads the same `.omx/state` the harness writes" claim — `.omx/state` has no per-agent heartbeat board. Reconcile `phase`/`stage` and the `updated_at` type while you're there.
2. **Intra-agent lost-update race:** two emit triggers (conductor phase + PostToolUse hook) on one `agent_id.json` with non-atomic read-merge-rename can drop `tasks[]`. Serialize per-agent emits, or remove the PostToolUse board-write (recommended — also simplifies v1).
3. **`jq` dependency** contradicts the "no client lib" rejection of SQLite. Declare it or drop the inconsistent argument.
4. **NFS rename atomicity** is asserted, not guaranteed — downgrade to a stated limitation.
5. **Launch latency:** ensure the overlay truly returns immediately (`&`, port-wait inside the child), or it stalls opt-in runs.
6. **Drop "mandatory" Stop hook** — keep all emission optional so it can't drift into ceremony.

**Fabrication flags:** one — the `.omx/state` cross-surface conflation in TUI §0/§5 (item 1). Everything else verified grounded.

The IMPROVEMENTS prose-edit set (DEBUG ranked-hypotheses + feedback-loop-first, GREENFIELD reframe-to-measurable + adversarial-Critic, the cross-cutting 3-cycle bound) is fully grounded and independently shippable — none depend on the dashboard, and they carry the real correctness gains. Ship those first; the dashboard is the optional, trim-then-build layer.