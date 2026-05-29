# Brief — URL shortener service

## Goal
A production-grade, self-hostable HTTP URL shortener with API-key auth, abuse protection, and stats.

## Audience
Teams that want a private/self-hosted short-link service (no third-party tracking) embedded in their
own tooling — internal redirects, campaign links, docs.

## Acceptance criteria (machine-checkable)
1. `npm test` exits 0 with unit + integration tests covering every endpoint and every error path below.
2. Endpoints behave exactly as the contract in `plan.md` (status codes, headers, error envelope).
3. Security: API keys never hardcoded (read from env), compared in constant time; target-URL
   validation rejects non-http(s) and SSRF-class hosts; redirect uses the stored URL only (no
   open-redirect via user-supplied `Location`).
4. Concurrency: persistence is atomic (no torn writes) and serialized; concurrent creates never
   corrupt the store or collide on codes.
5. Operability: `GET /health` liveness; structured JSON logs with a request id; graceful shutdown on
   SIGTERM.

## Non-goals
- No web UI, no user accounts, no database server (file-backed store is acceptable for the MVP).
- No custom vanity codes, no link expiry (explicit future work).
- No clustering/HA (single-process MVP).

## Validation

### JTBD
When an internal team needs to share or embed short links, they want a private short-link service
they control, so they can avoid leaking click data to a third party and keep links alive on their
own domain.

### Demand evidence (directional — see limitation note)
- The category is proven at scale (Bitly, TinyURL, t.co) — demand for URL shortening is not in doubt.
- The *differentiated* demand is **self-hosting / privacy / control**: recurring asks in r/selfhosted
  and the popularity of self-hosted OSS shorteners (Shlink, Kutt, YOURLS) confirm a real niche that
  the hosted incumbents don't serve.
- Build-vs-adopt: mature OSS exists, so a real product would differentiate (simpler ops, API-first,
  zero-dep). For THIS run the "customer" is the explicit user request to produce production-grade
  code — demand is given.

### Riskiest assumption
That a file-backed store is adequate for the MVP's concurrency/durability needs. Mitigated by making
writes atomic + serialized and documenting the DB swap as future work.

### MVP scope
Shorten (auth) → redirect → stats (auth) → health, with auth + rate limiting + SSRF-safe validation.
Everything in "Non-goals" (brief) is deferred.

Decision: GO
Rationale: explicit user request for a production-grade build; bounded, well-specified, verifiable.
Limitation: this is a build/verification exercise, not independent market sizing — no pricing or TAM
data was gathered (none was available in the research set).
