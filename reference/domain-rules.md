# Domain rules - priority digest

For domain-specific work, carry <=10 abstract priority rules from `ten-rules`. They guide
Plan/Build/Review quality only. They never replace hard gates; `delivery-gate.sh` still decides.

## Produce at Step 0 / Intake

1. **Route.** Match the objective to `ten-rules` domain(s). If unavailable, infer domains from first
   principles. Multiple domains may stack.
2. **Distill.** Write <=10 one-line principle rules total. Keep them abstract, not task steps.
3. **Record once.** Add `## Priority Rules` to the run `README.md`; keep them in conductor context.

## Apply per role

Inject only the role-relevant subset into locked prompts. Do not widen vault read scope.

- Architect: shape `plan.md`.
- Builder: honor rules while implementing.
- Committee: flag violations as findings.
- Verifier: do not inject rules; it stays claims + source only.

## Coverage checklist (gated, separate)

The digest is advisory. Verify also derives a concrete coverage checklist from the same domain routing:
UI means a11y/responsive/error states; data pipeline means idempotency/schema/PII; API means error paths
and auth ordering; security input means bypass families. `verification.md` `## Coverage` maps each item
to evidence or lists it under `Not covered:` with justification.

## Conservative updates

Refine only when objective or plan materially changes. Keep rules abstract and log the reason in
`README.md` as `RULES-UPDATE:`.

## Format

```md
## Priority Rules
Domain(s): <e.g. web-design + ecommerce-retail> (source: ten-rules)
1. <abstract one-line rule>
...
10. <abstract one-line rule>
```
