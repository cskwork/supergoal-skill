# Run audit log — LEGACY link-expiry (TTL)

Feature: optional time-to-live for short links. Expired links return 410 Gone, are not redirected, and do not count hits. Backward-compatible with pre-feature records (no `expiresAt` field -> never expires). No DB migration required.

## Timeline

| Phase | Status | Notes |
|---|---|---|
| Intake | DONE | Objective: add ttlSeconds to POST /shorten; store expiresAt; 410 on expired redirect; stats surface expiresAt/expired |
| Explore | DONE | Read-only; mapped 7 touch-points across store/config/validate/server/tests (see plan.md ## Architecture) |
| Plan | DONE | Frozen surgical plan; decisions baked in (410 Gone, lazy expiry, check-before-increment) |
| Human Feedback | DONE | Plain-language + technical briefs added to plan.md; Build approved in state.json |
| Build | DONE (1 cycle) | 7 files changed, 231 insertions; no unrelated churn |
| Verify | DONE (1 cycle) | 68/68 tests pass; live probes confirm TTL flow and backward-compat |
| Review | DONE | security APPROVE; code-review APPROVE (LOW only) |
| Deliver | DONE | — |

## Audit log / decisions

- **Expired redirect status: 410 Gone** (`link_expired`) — chosen over 404 to distinguish "link existed but expired" from "link never existed".
- **Lazy expiry** (checked on read) — no background scheduler dependency; simple and sufficient for the use-case.
- **Check-before-increment** — `handleRedirect` reordered: `store.get()` -> expiry check -> `store.incrementHit()`. Expired access never counts as a hit.
- **Max TTL 1 year** (31536000 s); `ttlSeconds:0` or omitted + no default -> never expires.
- **No migration** — old records lack `expiresAt`; `undefined` is treated as never-expire throughout. JSON persist/load unchanged.
- **Human Feedback approval** — implementation started only after Build approval was recorded in `state.json`.
- **Committee sign-off** — security APPROVE, code-review APPROVE (LOW findings only, no blockers).
