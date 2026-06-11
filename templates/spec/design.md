# Design: <feature name>

<!-- Spec phase 2 of 3. HOW the approved requirements are met - written only after
     requirements.md is approved; contract in reference/spec.md.
     Each component cites the requirement numbers it serves. Design for current
     requirements, not hypothetical futures. Approved before tasks.md. -->

## Overview

<!-- High-level summary of the approach, 3-5 sentences. -->

## Architecture

<!-- Major components, their relationships, and the data flow. Mermaid or ASCII is fine. -->

## Components and interfaces

### <Component name>

**Purpose:** <what this component does>
**Responsibilities:**
- <responsibility>

**Interface:** input <what it receives> / output <what it produces> / dependencies <what it requires>

_Requirements: <N.N, N.N>_

## Data models

### <Entity name>

| Field | Type | Required | Validation |
|---|---|---|---|
| <field> | <type> | <yes/no> | <rule> |

**Relationships:** <links to other entities>

## Error handling

| Scenario | Response | Action |
|---|---|---|
| <failure scenario> | <user-visible response> | <system action: log/retry/alert> |

## Testing strategy

- **Unit:** <critical logic to cover>
- **Integration:** <component interactions to cover>
- **E2E:** <critical user paths>

## Decisions

<!-- Grill each decision (options + recommendation, one at a time) before recording.
     Record one only when ALL three hold: hard to reverse, surprising without context,
     a real trade-off. Cheap, reversible choices: decide autonomously, note in place. -->

### Decision: <brief title>

**Context:** <situation requiring a decision>
**Options considered:**
1. <option> - pros: <benefits> / cons: <drawbacks>
2. <option> - pros: <benefits> / cons: <drawbacks>
**Decision:** <chosen option>
**Rationale:** <why - the constraint or requirement that settled it>
