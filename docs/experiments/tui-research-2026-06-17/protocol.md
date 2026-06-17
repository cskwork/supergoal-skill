I have everything needed. The host's `subagent-tracking.json` (schemaVersion, per-entity `updated_at`, ISO-8601 UTC timestamps) and the skill's flat `state.json` are the two real precedents. Here is the spec.

---

# Supergoal STATE + Coordination Protocol — Live Multi-Agent Workflow Dashboard

**Status:** spec. **Scope:** the state-emission + coordination layer only (not the Textual reader UI). **Baseline-first invariant:** this layer must be *droppable* — if no agent ever emits, every existing gate and mode still passes unchanged. It adds observability, never a delivery gate.

## 0. Decision summary

| Question | Decision |
|---|---|
| Emission mechanism | **(b) one heartbeat JSON per agent, replaced atomically (temp+rename)** — NOT JSONL, NOT SQLite |
| Where | A shared **run-registry dir** outside any target repo: `${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}/<run_epoch>/agents/<agent_id>.json` |
| How emitted | A tiny POSIX-sh helper `sg-emit` called at each phase transition + a Claude Code **Stop hook** for liveness/cleanup. No locking, no branch touch. |
| Liveness | Reader-side: `pid` not alive **OR** `now - updated_at > stale_secs` ⇒ render `dead`/`stale`. Writers never reap. |
| Lock-free correctness | One writer per file (the owning agent). Cross-agent reads are whole-file reads of atomically-renamed files. No shared mutable file ⇒ no lock needed. |

### Why heartbeat-JSON over the alternatives

- **(a) append-only JSONL** — great audit trail, but the reader must replay the whole log to derive *current* state, and concurrent appends to a *shared* file need O_APPEND atomicity guarantees that break for records >`PIPE_BUF` (4096B on Linux/macOS) and over network FS. Per-agent JSONL fixes the sharing problem but still forces tail-replay. **Rejected:** the dashboard wants "where is each agent *now*", which is a point-in-time snapshot — exactly what a replaced heartbeat gives in one `read()`. (Keep JSONL only as an optional secondary audit stream — §7.)
- **(c) SQLite** — real multi-writer safety via WAL, but: a writer lock (even brief) couples agents, a crashed writer mid-transaction can hold the lock, it needs a client lib in every emit path (kills "tiny sh helper" + near-zero overhead), and it is corruption-prone on networked/worktree filesystems. **Rejected** as over-engineering against baseline-first.
- **(b) heartbeat-JSON, chosen** — mirrors the host's own `subagent-tracking.json` shape (schemaVersion, `updated_at`, ISO-8601 UTC) and the skill's `state.json` precedent. One file per writer = zero contention. Atomic `rename(2)` = a reader never sees a half-written file. Trivially tailable (`cat`, `inotify`, 1s poll). Crash-safe (a dead writer leaves its last good file; reader ages it out).

## 1. File layout & naming

```
${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}/
└── <run_epoch>/                     # one orchestration; run_epoch = unix seconds at conductor start
    ├── run.json                     # written ONCE by conductor: run_id, started_at, label
    └── agents/
        ├── <agent_id>.json          # heartbeat, one per agent, replaced atomically
        ├── <agent_id>.json.tmp.<pid>  # transient; renamed over the above
        └── <agent_id>.events.jsonl  # OPTIONAL audit stream (§7), append-only, per-agent
```

- **Registry lives outside the target repo** — deliberately. Agents work on different repo paths / branches / worktrees; a shared dashboard must not write into any one of them (would dirty `git status`, which ARCH/REVIEW-ONLY/`/build auto` treat as a baseline violation). `$HOME/.supergoal/runs` is the neutral ground. Overridable via `SUPERGOAL_RUN_DIR` for CI/sandbox.
- **`agent_id`** = stable per agent for the run: `${repo_basename}-${branch}-${short_worktree_hash}-${pid}`, slugified to `[a-z0-9._-]`. Embeds repo + branch + worktree so the same physical agent is identifiable even when two agents share a branch (the `pid` + worktree hash disambiguate). Example: `acme-api-feat-login-9f3a2b-48217.json`.
- **`run_epoch`** groups all agents of one dashboard view. A fresh dashboard run = a fresh dir; old runs are self-cleaning by mtime (§5).

## 2. Heartbeat JSON schema

`schemaVersion` gates forward-compat (host precedent). All timestamps **ISO-8601 UTC with `Z`** (matches `subagent-tracking.json`). Every field flat or one level deep so a `jq`/Textual reader needs no joins.

```jsonc
{
  "schemaVersion": 1,
  "agent_id": "acme-api-feat-login-9f3a2b-48217",
  "repo_path": "/Users/danny/work/acme-api",        // absolute worktree path
  "repo": "acme-api",                                 // basename, for column grouping
  "branch": "feat/login",                             // advisory only — multiple agents may share it
  "worktree": "/Users/danny/work/acme-api",           // worktree root (== repo_path unless linked worktree)
  "mode": "GREENFIELD",                               // supergoal mode (enum, §SKILL.md table)
  "phase": "Critic",                                  // Frame|Build|Critic|Fixer|Verify|Done  (loop)
  "current_task": "Add JWT refresh endpoint",         // human label of the active task, nullable
  "task_status": "in-progress",                       // backlog|in-progress|review|done|blocked
  "started_at": "2026-06-17T09:00:00Z",               // agent registration time (immutable)
  "updated_at": "2026-06-17T09:14:51Z",               // bumped on EVERY emit — the liveness clock
  "pid": 48217,                                        // OS pid of the emitting agent process
  "host": "danny-mbp",                                 // disambiguate pid across machines
  "note": "2 reds open from critic",                  // free-text, <=120 chars, nullable
  "tasks": [                                           // the Jira-like board, full snapshot each emit
    {"id":"t1","title":"Add JWT refresh endpoint","status":"in-progress","phase":"Critic","updated_at":"2026-06-17T09:14:51Z"},
    {"id":"t2","title":"Rotate refresh token on use","status":"backlog","phase":null,"updated_at":"2026-06-17T09:00:00Z"},
    {"id":"t0","title":"Login happy path","status":"done","phase":"Verify","updated_at":"2026-06-17T09:12:10Z"}
  ]
}
```

Field rules:
- `tasks` is a **full snapshot**, not a delta — every emit carries the whole board. The board is small (a run's task list), so re-serializing it is cheap and makes the reader stateless (no event replay to reconstruct columns). This is the key reason heartbeat beats JSONL for *this* surface.
- `task_status` / per-task `status` enum = Jira columns: `backlog | in-progress | review | done | blocked`. `review` maps to Critic-active, `done` to Verify-passed.
- `phase` (top-level) = the agent's *current* loop position; per-task `phase` = where that task last advanced. A task can be `done` while the agent's overall `phase` is still `Verify`.
- Nullable: `current_task`, `note`, per-task `phase`. Never null: identity + timestamps + `pid`.

## 3. Emit helper contract — `sg-emit`

A single POSIX-sh helper (shipped at `templates/observability/sg-emit.sh`). Near-zero overhead: no network, no lock, one `printf` + one `mv`. Idempotent and crash-safe.

```
sg-emit \
  --phase Critic \
  --task "Add JWT refresh endpoint" \
  --task-status in-progress \
  [--mode GREENFIELD] [--note "2 reds open"] \
  [--tasks-file /path/board.json]      # optional: full tasks[] array; else preserved from prior file
```

**Contract:**
1. Reads identity from env, set once at registration (§4): `SG_RUN_DIR`, `SG_RUN_EPOCH`, `SG_AGENT_ID`, `SG_REPO_PATH`, `SG_REPO`, `SG_BRANCH`, `SG_WORKTREE`, `SG_MODE`, `SG_STARTED_AT`. If `SG_AGENT_ID` unset ⇒ **exit 0 silently** (observability is opt-in; absence is not an error — baseline-first).
2. Computes `updated_at = date -u +%Y-%m-%dT%H:%M:%SZ`, `pid=$$` of the *agent*, `host=$(hostname -s)`.
3. Merges: if `--tasks-file` given, use it; else carry forward `tasks[]` from the existing heartbeat (so a phase-only ping doesn't wipe the board). Updates the matching task's `status`/`phase` when `--task` is named.
4. **Atomic write:** serialize to `$DEST.tmp.$$`, then `mv -f` over `$DEST`. `rename(2)` within one dir is atomic on POSIX local FS ⇒ readers see either the old or the new file, never a torn one. `mv` also handles the case where the temp and dest are same-filesystem (they are, same dir).
5. Best-effort: any failure (disk full, perms) ⇒ **exit 0, write a one-line warning to stderr**. The helper must never abort the agent's real work. (Mirrors the §0 invariant.)
6. Overhead budget: < 15ms wall, no subprocess beyond `date`/`mv`. Call frequency = once per phase transition (~5–20 calls per task), never in a tight loop.

**Reference implementation core (the load-bearing 6 lines):**
```sh
DEST="$SG_RUN_DIR/$SG_RUN_EPOCH/agents/$SG_AGENT_ID.json"
TMP="$DEST.tmp.$$"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
# build JSON via jq (preserves prior tasks[] when --tasks-file absent), then:
jq -n --argjson prior "$(cat "$DEST" 2>/dev/null || echo null)" ... > "$TMP" 2>/dev/null \
  && mv -f "$TMP" "$DEST" || { rm -f "$TMP"; echo "sg-emit: skipped" >&2; exit 0; }
```

### Claude Code hook wiring (zero per-call ceremony)

Two hooks make emission automatic without the persona authoring emit calls by hand:

- **Stop hook** → `sg-emit --phase Done --task-status done` then touch `updated_at` a final time, so a clean exit is recorded. This is the only *mandatory* hook (liveness honesty).
- **PostToolUse hook (optional, advisory)** → a thin matcher that bumps `updated_at` (heartbeat-only, no field change) after each tool batch, so a long Build phase still looks alive between explicit phase emits. Keep it field-stable to avoid flapping the board.

Explicit phase emits (Frame/Build/Critic/Fixer/Verify) are called by the **conductor** at role transitions in `reference/role-loop.md`, not by the isolated personas (personas can't see each other; the conductor owns the loop boundary — consistent with the existing "conductor sums sub-budgets into `state.json`" pattern in `qa-only.md:61`).

## 4. Lifecycle

| Stage | Trigger | Action |
|---|---|---|
| **Register** | Conductor enters a mode (Frame step, `role-loop.md:22` neighborhood) | Create `run.json` once; export `SG_*` identity env; first `sg-emit --phase Frame --task-status backlog`. `started_at` set here, immutable. |
| **Phase update** | Each loop transition Build→Critic→Fixer→Verify | `sg-emit --phase <P>` — carries forward `tasks[]`, bumps `updated_at`. |
| **Task add** | New task surfaced (incl. from `surfaced-requirements.md`) | `sg-emit --tasks-file <board>` with the new task appended at `backlog`. |
| **Task move** | Task changes column | `sg-emit --task <t> --task-status <col>`; Build⇒`in-progress`, Critic⇒`review`, Verify-pass⇒`done`, red/blocker⇒`blocked`. |
| **Clean exit** | Stop hook | final emit `phase=Done`; file left in place (reader shows `done`, then ages out). |
| **Crash** | process dies | last heartbeat remains; **no writer cleanup** (would need a lock). Reader detects death (§5). |

### Stale / dead detection — reader-side only, lock-free

The reader (Textual dashboard) classifies each heartbeat **without writing anything**:

```
alive   : pid running on this host  AND  (now - updated_at) <= warn_secs   (default 45s)
stale   : (now - updated_at) >  warn_secs  AND  <= dead_secs               (default 180s)
dead    : pid not alive (kill -0 fails, same host)  OR  (now - updated_at) > dead_secs
done    : phase == "Done"
```

- `kill -0 <pid>` only valid when `host == this host`; cross-host ⇒ fall back to timestamp staleness alone.
- The reader may **archive** a `dead`/`done` agent file (move to `agents/_archive/`) — but that's a reader convenience, never required, and the reader is a single process so it's the only mutator of `_archive/`. Writers never read or reap peers.
- **No agent ever waits on, locks, or branch-locks another.** Shared-branch agents are independent rows; `branch` is a display/grouping field, not a mutex.

## 5. Run cleanup

- Self-pruning by mtime: on conductor register, delete `run_epoch` dirs older than `SUPERGOAL_RUN_TTL_DAYS` (default 3). Pure housekeeping, no coordination.
- Per-run dirs are disposable; nothing downstream depends on them (baseline-first: deleting the whole `~/.supergoal/runs` tree breaks nothing).

## 6. Concurrency hazards & how the design avoids each

| Hazard | Avoided by |
|---|---|
| **Torn read** (reader sees half-written JSON) | Write to `.tmp.$$`, atomic `mv -f` (rename) within the same dir. Reader's `read()` returns old-complete or new-complete, never partial. |
| **Lost update / two writers clobber** | **One writer per file.** Each agent owns exactly `<agent_id>.json`. There is no shared mutable file ⇒ no write-write race ⇒ no lock. (Contrast SQLite/shared-JSONL which *would* need one.) |
| **Shared-branch collision** | Branch is data, not a lock. Two agents on `feat/login` write two distinct files (`pid` differs in `agent_id`). Coordination is advisory: the dashboard *shows* both; it never serializes them. |
| **`.tmp` name collision** | Suffix `.tmp.$$` (pid). Same agent is single-process ⇒ no overlap. Crash leftovers are pruned on next register or by TTL. |
| **Crashed writer mid-emit** | Crash before `mv` leaves a stale `.tmp.$$` (harmless, pruned) and the prior good `.json` intact. Crash never corrupts the live file because the live file is only ever replaced, never edited in place. |
| **Networked/worktree FS (rename not atomic across mounts)** | Temp file is in the **same dir** as dest (same mount) ⇒ rename stays atomic. Registry on local `$HOME` by default avoids NFS entirely. |
| **Clock skew across hosts** | Liveness primarily uses `kill -0` on same host; cross-host uses timestamps with generous `dead_secs`. `host` field disambiguates pid reuse. |
| **PID reuse after death** | `kill -0` can false-positive if the OS reused the pid. Mitigated by AND-ing with `updated_at` freshness; a reused pid won't be refreshing *this* file. |

## 7. Optional audit stream (do not require)

If a post-mortem trail is wanted, `sg-emit` may *also* append one line to `<agent_id>.events.jsonl` (same dir, per-agent ⇒ still single-writer, still lock-free; lines kept < 4096B so a single `write()` is atomic via `O_APPEND`). The dashboard ignores it; it exists only for offline replay. Off by default to honor the near-zero-cost rule.

## 8. Baseline-first compliance check

- **Adds value:** the dashboard answers "which agent, which mode, which phase, which task-column, alive?" across concurrent shared-branch agents — impossible today (8/10 modes emit only markdown; `.omx/state/*` is host-owned and per-session, not per-agent-workflow).
- **Near-zero cost:** one `date`+`mv` per phase transition; opt-in (`SG_AGENT_ID` unset ⇒ no-op); best-effort (never aborts work).
- **Not ceremony / not a gate:** no existing gate reads these files; no mode *fails* if emission is absent or partial. It is strictly additive telemetry, deletable wholesale. This is the line that keeps it from becoming the "gated ceremony" the project already removed (per the `supergoal-baseline-first` memory).

---

## Files to add (none modified destructively)

- `templates/observability/sg-emit.sh` — the helper (§3).
- `templates/observability/heartbeat.schema.json` — the schema (§2), for the reader to validate against (host `schemaVersion` precedent).
- `templates/observability/hooks/stop.sh` + `posttooluse.sh` — hook shims (§3).
- `reference/observability.md` — the lifecycle + reader liveness rules (§4–5), loaded only when a dashboard run is requested.
- One anchor line in `reference/role-loop.md` Frame/transition steps: "if `SG_AGENT_ID` set, call `sg-emit` at each phase" (advisory, guarded by the env check so it's a no-op otherwise).

**Single load-bearing concurrency claim to remember:** correctness comes entirely from *one writer per file + atomic rename*. Every other property (lock-free, crash-safe, shared-branch-safe, tailable) follows from that, with no lock anywhere in the system.