# Harness Patterns

Pick the smallest pattern that preserves quality. A harness is useful only when structure reduces risk more than it adds overhead.

## Pipeline

Sequential phases where each output feeds the next.

Use for: research -> design -> build -> verify, migration plans, documents with review stages.

Risk: one slow or weak phase blocks the run. Keep each phase independently checkable.

## Fan-out/fan-in

Parallel specialists inspect the same input, then an integrator merges findings.

Use for: research, code review, security/performance/accessibility review, evidence gathering.

Risk: duplicated work and conflicting claims. Require source labels and a merge rule.

## Expert pool

A router selects only the needed specialist.

Use for: varied task types where one expert is usually enough.

Risk: bad routing. Keep router criteria explicit and allow escalation to another expert.

## Producer-reviewer

One agent creates; another reviews against objective gates.

Use for: code, docs, UI specs, generated assets, tests.

Risk: endless loops. Set a retry bound and preserve reviewer evidence.

## Supervisor

A central conductor assigns work dynamically.

Use for: large task lists, file batches, migrations, triage queues.

Risk: conductor bottleneck. Give workers cohesive chunks and shared status files.

## Hierarchical delegation

A lead decomposes into sub-leads and workers.

Use for: naturally nested domains.

Risk: context loss. Keep depth <=2 unless the runtime has reliable state recovery.

## Selection Rule

- One simple task: no harness.
- Two dependent phases: Pipeline.
- Multiple independent perspectives: Fan-out/fan-in.
- Choose one specialist by input type: Expert pool.
- Output must be challenged: Producer-reviewer.
- Many work items with changing distribution: Supervisor.
- Nested domain decomposition: Hierarchical delegation.
