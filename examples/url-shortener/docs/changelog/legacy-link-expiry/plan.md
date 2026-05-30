# Plan (FROZEN pending approval) — link expiry (TTL)

Surgical, backward-compatible. No DB/migration. Reuses existing modules and style.

## Changes
1. `src/validate.js` — add `validateTtl(raw)`: `undefined` -> `{ok,ttlSeconds:null}`; else must be an
   integer in `[1, 31536000]` (<=1 year) -> `{ok,ttlSeconds}`; otherwise `{ok:false,reason}`. Mirrors
   `validateTargetUrl`'s return shape.
2. `src/config.js` — add `defaultTtlSeconds: parsePositiveInt(env.DEFAULT_TTL_SECONDS, 0)` (0 = none).
3. `src/store.js` — `create(url, expiresAt = null)`; include `expiresAt` in the frozen record literal.
   Load/persist unchanged (old records keep `expiresAt === undefined`, handled as never-expire).
4. `src/server.js`
   - `handleShorten`: after URL validation, `validateTtl(body?.ttlSeconds)` -> 400 `invalid_ttl` on
     failure. Effective ttl = request value, else `config.defaultTtlSeconds`. If effective > 0,
     `expiresAt = new Date(Date.now()+ttl*1000).toISOString()`, else `null`. Pass to `store.create`.
   - `handleRedirect`: **expiry check BEFORE counting a hit** — `record = store.get(code)`; if none ->
     404; if `record.expiresAt && Date.now() > Date.parse(record.expiresAt)` -> **410 `link_expired`**
     (no hit counted); else `incrementHit` + 302.
   - `handleStats`: add `expiresAt: record.expiresAt ?? null` and
     `expired: !!record.expiresAt && Date.now() > Date.parse(record.expiresAt)`.

## Decisions (baked in unless approval changes them)
- Expired redirect status: **410 Gone** (`link_expired`) — distinguishes "expired" from "never existed".
- **Lazy** expiry (checked on read); no background sweep (no scheduler dependency).
- Expired links **do not count hits** (check before increment) and are **never redirected**.
- Max TTL 1 year; `ttlSeconds:0`/omitted + no default -> never expires.

## Acceptance (Verify/QA)
- Full existing suite stays green (no regressions).
- New: create-with-ttl sets expiresAt; expired link -> 410 + hits unchanged; non-expired ttl ->
  302; stats includes expiresAt/expired; **old record (no expiresAt) never expires**; bad ttl -> 400.
- No unrelated refactor / formatting churn.

## Human Feedback

### Plain-language brief
Add an optional expiration time for shortened links without breaking old links. If a link has expired,
the service should stop redirecting people and should return a clear "gone" response instead. Links
that were created before this feature, or links created without an expiration, must keep working as
they do today.

### Technical brief
Add TTL support by extending validation, config, store records, redirect handling, stats output, and
tests. The change should reuse the existing JSON record shape and treat missing `expiresAt` as
never-expiring for backward compatibility. Redirect must check expiry before incrementing hits. The
existing suite must stay green, and new integration tests should cover expired, unexpired, invalid,
default, and old-record cases. Build can start only after approval is recorded for the `Build` phase.

### Terms
- TTL: time to live, the number of seconds a link should remain usable.
- Backward compatibility: keeping old saved records working after the new field is introduced.
- Lazy expiry: checking whether a link is expired when it is used, instead of running a background cleanup job.

### Approval request
Approve Build, request changes to the plan, or stop.

## Architecture

| Concern | Location | Note |
|---|---|---|
| Record shape & construction | `src/store.js:15`, `:41` | only place records are made; `Object.freeze({code,url,hits,createdAt})` |
| Persist / load | `src/store.js:21-31` (load), `:87-92` (persist) | JSON-agnostic. **Old records lack `expiresAt` -> `undefined` -> treat as never-expire. No migration.** |
| Read without mutation | `src/store.js:60-63` `get()` | already exists — use for expiry-check-before-increment |
| Redirect + hit | `src/server.js:87-94` `handleRedirect` | currently `incrementHit` then 302; expiry check must run BEFORE increment |
| Stats response | `src/server.js:96-112` `handleStats` | add `expiresAt` + `expired` to payload |
| Config parsing | `src/config.js:11-24` | add `defaultTtlSeconds` via existing `parsePositiveInt` (`:43`) |
| Body parse / validation | `src/server.js:61-84` (`handleShorten`), `src/validate.js:12-43` | reusable `validate.js` module exists — add `validateTtl` there |
| Tests | `test/store.test.js`, `test/integration.test.js` (`startServer` `:15-41`) | extend with existing helpers |

Surgical change set: `src/store.js` (create accepts expiresAt), `src/config.js` (+1), `src/validate.js` (+validateTtl), `src/server.js` (shorten validate ttl, redirect expiry check, stats fields), + tests. No DB, no migration, no unrelated refactors.
