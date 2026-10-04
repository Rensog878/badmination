---
name: gsd-runner
description: >-
  Executes complex software tasks using the GSD (Get Shit Done) Core methodology.
  Breaks goals into atomic milestones, enforces specification-first development,
  and mandates empirical verification before declaring any task complete.
---

# GSD Runner Skill

Use this skill when tackling any feature, refactor, or multi-step integration in Badmination.

## Workflow

### 1. Goal Analysis & Spec Lock
- Analyze the user's objective.
- Define the **Scope Boundary**: explicitly state what is in-scope and what is out-of-scope.
- Specify the **Definition of Done (DoD)** with measurable criteria.

### 2. Milestone Sequencing
Break the task into sequential, atomic milestones:
1. **Foundation**: Types, schemas, database models, utility helpers.
2. **Business Logic**: Server actions, state management, API routes, scoring rules.
3. **User Interface**: Components, forms, accessible styling, touch targets.
4. **Integration**: Connecting UI to server actions and real-time feeds.
5. **Verification**: Compiler check (`npm run build`), linting, and runtime verification.

### 3. Execution & Verification
- Execute one milestone at a time.
- Verify immediately after changes.
- Never mark a milestone done until verified with empirical tool output.
