# Harness Spec

## Goal

`<one sentence>`

## Runtime

- runtime_adapter: `<codex|claude-code|pi-agent|mcp|mixed|portable>`
- draft_root: `<path for reviewable spec/generated previews; not active unless adapter says so>`
- active_install_target: `<active runtime registry path, or none for spec-only>`
- auto_continue_after_approval: `<yes|no>`
- rollback: `<how to remove generated active files and restore overwritten files>`

## Pattern

- selected_pattern: `<Pipeline|Fan-out/fan-in|Expert pool|Producer-reviewer|Supervisor|Hierarchical delegation>`
- reason: `<why this is the smallest useful pattern>`
- rejected_patterns: `<short list>`

## Agents

| Agent | Role | Inputs | Draft output | Active install path | Allowed tools | Quality contract |
|---|---|---|---|---|---|---|
| `<name>` | `<role>` | `<files/data>` | `<draft artifact>` | `<active file or none>` | `<tools>` | `<objective checks>` |

## Skills

| Skill | Trigger | Used by | References | Draft output | Active install path | Verification |
|---|---|---|---|---|---|---|
| `<name>` | `<phrases>` | `<agents>` | `<files>` | `<draft artifact>` | `<active file or none>` | `<checks>` |

## Orchestrator

- sequence: `<phase list>`
- handoff_files: `<paths>`
- gates: `<approval/checks>`
- retry_bound: `<number>`

## Human Feedback

- approval_status: `<PENDING|APPROVED|REJECTED>`
- approved_files: `<paths>`
- overwrite_allowed: `<yes/no + paths>`
- approved_active_install_target: `<path or none>`
- approval_scope: `<what can continue automatically after approval>`

## Verification

- draft_checks: `<frontmatter/template/data-flow checks>`
- active_registry_check: `<how to prove runtime can see installed files>`
- trigger_checks: `<should-trigger and near-miss prompts>`
- rollback_check: `<how rollback was checked or why not run>`
