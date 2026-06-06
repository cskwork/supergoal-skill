# Harness Spec

## Goal

`<one sentence>`

## Runtime

- runtime_adapter: `<codex|claude-code|pi-agent|mcp|mixed|portable>`
- install_target: `<path or none>`
- rollback: `<how to remove generated files>`

## Pattern

- selected_pattern: `<Pipeline|Fan-out/fan-in|Expert pool|Producer-reviewer|Supervisor|Hierarchical delegation>`
- reason: `<why this is the smallest useful pattern>`
- rejected_patterns: `<short list>`

## Agents

| Agent | Role | Inputs | Outputs | Allowed tools | Quality contract |
|---|---|---|---|---|---|
| `<name>` | `<role>` | `<files/data>` | `<artifact>` | `<tools>` | `<objective checks>` |

## Skills

| Skill | Trigger | Used by | References | Verification |
|---|---|---|---|---|
| `<name>` | `<phrases>` | `<agents>` | `<files>` | `<checks>` |

## Orchestrator

- sequence: `<phase list>`
- handoff_files: `<paths>`
- gates: `<approval/checks>`
- retry_bound: `<number>`

## Human Feedback

- approval_status: `<PENDING|APPROVED|REJECTED>`
- approved_files: `<paths>`
- overwrite_allowed: `<yes/no + paths>`
