# Plan (FROZEN) — URL shortener service

Stack: Node.js ≥18, ESM, **zero runtime dependencies** (node:http, node:crypto, node:fs/promises,
node:test). Self-contained so the delivery gate (`npm test` → `node --test`) runs offline.

## File layout
```
package.json            type:module, bin, scripts {start, test:"node --test"}
bin/shortener.js        entry: read env config, start server, wire SIGTERM
src/config.js           parse env (PORT, BASE_URL, API_KEYS, DATA_FILE, RL_CAPACITY, RL_REFILL_PER_SEC)
src/codec.js            base62 + crypto-random collision-resistant code generation
src/validate.js         URL validation: http(s) only, length cap, reject SSRF hosts
src/store.js            atomic + serialized JSON store: create/get/incrementHit/stats
src/ratelimit.js        token-bucket per key: allow() -> {ok, retryAfter}
src/auth.js             timing-safe API-key check
src/logger.js           structured JSON log lines {ts, level, msg, requestId, ...}
src/server.js           http handler: routing, error envelope, request id, returns {server, close}
test/codec.test.js test/validate.test.js test/store.test.js test/ratelimit.test.js test/integration.test.js
README.md
```

## Endpoint contract
| Method | Path | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/health` | none | 200 `{status:"ok"}` | — |
| POST | `/shorten` | X-API-Key | 201 `{code, shortUrl}` | 400 invalid url, 401 bad/missing key, 429 rate-limited (+`Retry-After`) |
| GET | `/:code` | none | 302 `Location: <stored url>` (+hit++) | 404 unknown code |
| GET | `/api/stats/:code` | X-API-Key | 200 `{code,url,hits,createdAt}` | 401, 404 |

Error envelope (all errors): `{ "error": { "code": "<machine_code>", "message": "<human>" } }`.

## Security requirements (gate-checked by security-reviewer)
- API keys from `API_KEYS` env (csv); never hardcoded; compared with `crypto.timingSafeEqual`.
- `validate.js` rejects: non-http(s) schemes; hosts `localhost`, `127.0.0.0/8`, `10/8`,
  `172.16/12`, `192.168/16`, `169.254/16` (link-local/metadata), `::1`, `0.0.0.0`; URLs > 2048 chars.
- Redirect `Location` is ALWAYS the stored, previously-validated URL — never echo user input.

## Concurrency requirements
- All store writes go through a single async mutex (promise-chain) so writes serialize.
- Persistence is atomic: write temp file then `fs.rename` (atomic on same volume).
- Code generation retries on the rare collision; never overwrites an existing code.

## Slices & acceptance checks
1. codec — unit: codes are base62, length ≥7, 10k generated are unique. 
2. validate — unit: accepts valid https; rejects each SSRF host + non-http scheme + over-length.
3. store — unit: create/get/hit/stats; atomic write leaves no temp file; concurrent creates all persist.
4. ratelimit — unit: allows up to capacity, blocks after, refills over time, returns retryAfter.
5. auth — unit: accepts configured key, rejects wrong/missing, constant-time path.
6. server/integration — spin up on ephemeral port: health; create+redirect+hit count; 404; 401 (bad+missing key); 400 (bad url + SSRF url); 429 after exceeding capacity; stats.

## Human Feedback

### Plain-language brief
Build a small private URL shortener that can run without outside services. A user with an API key can
submit a long link and receive a short code. Anyone who opens the short code is redirected to the
saved link, and the service counts visits. The plan keeps the first version intentionally simple:
local JSON storage, clear API errors, rate limits, and URL safety checks before anything is shipped.

### Technical brief
Implement a zero-dependency Node HTTP service with separate modules for config, URL validation,
storage, rate limiting, auth, logging, and routing. The risky areas are SSRF prevention, concurrent
file-backed writes, and auth behavior. The implementation should add unit tests for each module and
integration tests for the HTTP paths, then write `claims.md` with `run-to-prove: npm test`. Build can
start only after approval is recorded for the `Build` phase.

### Terms
- SSRF: a server-side request forgery issue where a submitted URL tricks the service into reaching a private internal address.
- Atomic write: a save operation that writes a temporary file and renames it so partial data is not left behind.
- Rate limit: a rule that slows or blocks repeated requests after a configured allowance is used.

### Approval request
Approve Build, request changes to the plan, or stop.

Exit gate for Build: each slice's tests written and `npm test` green locally + a `claims.md` entry
with `run-to-prove: npm test`.
