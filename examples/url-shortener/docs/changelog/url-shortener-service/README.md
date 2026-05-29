# README — url-shortener-service run log

## Audit log / decisions

2026-05-29T22:20 Intake: mode=GREENFIELD (build+ship a new service).

2026-05-29T22:20 Validate: GO. Self-hosted/privacy niche is real; demand given by user request. No market-sizing data available — logged as limitation.

2026-05-29T22:20 Plan: zero-dep Node (node:http/crypto/fs/test) so the delivery gate runs offline. File-backed atomic store for MVP; DB swap = future work. plan.md FROZEN.

2026-05-29T22:20 Topology: single-driver Build (one cohesive service = deep-narrow); committee reviewers fan out at the soft gate.

2026-05-29T22:35 Build cycle 1: builder reported 43/43 tests passing.

2026-05-29T22:40 Verify cycle 1: RED. Adversarial verifier reproduced 43/43 clean but found 2 real SSRF bypasses the builder's own tests missed: `[::ffff:127.0.0.1]` and `localhost.` both ACCEPTED by validate.js. auth/atomicity/open-redirect held. -> rewind to Build (Fix). error_signature=ssrf-bypass-v1.

2026-05-29T22:50 Build cycle 2 (Fix): closed both SSRF bypasses (FQDN-dot strip + IPv6 loopback/link-local/unique-local/embedded-v4 handling), added regression tests. 49/49 pass.

2026-05-29T22:55 Verify cycle 2: GREEN. Independent re-probe of 17 SSRF vectors all reject; public v4/v6 accept; no regression. 2 LOW residuals documented (NAT64, ::ffff:0.0.0.0).

2026-05-29T23:05 Committee (soft gate): architect APPROVE, security APPROVE (0 CRITICAL/HIGH, 1 MEDIUM), code-review APPROVE, QA 11/11 APPROVED FOR DELIVERY. MEDIUM = malformed percent-encoding on /:code & /api/stats/:code throws URIError -> 500 (unauth). Decision: fix it (cheap, real operability bug) before Deliver.
