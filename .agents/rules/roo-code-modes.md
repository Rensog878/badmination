# Roo Code Multi-Mode Specialization Architecture

## Overview
Inspired by Roo Code (Roo Cline), this protocol equips the agent with distinct operational **modes**. Each mode specializes tool usage, reasoning style, and boundaries for maximum focus and efficiency.

---

### 1. 🏗️ ARCHITECT Mode
- **Focus**: High-level system design, schema design, technology stack evaluation, and directory structure.
- **When to Activate**:
  - Designing a new subsystem (e.g. Tournament Brackets, Real-time Score Feeds, Payments).
  - Schema migrations or architectural refactoring.
  - Designing API contracts or server action boundaries.
- **Behavior**:
  - Thinks in terms of data flow, modularity, separation of concerns, and security boundaries.
  - Produces clear architecture specifications and diagrams before code is written.

---

### 2. ⚡ CODE Mode
- **Focus**: Rapid, precise, production-grade implementation.
- **When to Activate**:
  - Writing components, server actions, route handlers, hooks, and utilities.
  - Modifying code according to architectural specifications.
- **Behavior**:
  - Zero placeholders (`TODO`, `FIXME`). Fully implement error handling and edge cases.
  - Strict TypeScript: no `any`, strictly typed props, state, and server returns.
  - Adheres to Tailwind v4 theme tokens (`--color-court-green`, `--color-charcoal`, `--color-off-white`).

---

### 3. 🔍 DEBUG Mode
- **Focus**: Root cause analysis, crash diagnostics, hydration errors, memory leaks, and broken tests.
- **When to Activate**:
  - Build failure or TypeScript compiler error.
  - Client-side React hydration warning or unhandled promise rejection.
  - Performance regressions, frame drops in 3D canvas, or stale SSE stream issues.
- **Behavior**:
  - Gathers telemetry: reads build logs, inspects runtime traces, checks network status.
  - Isolates exact line and failure mechanism before modifying code.
  - Engages the **Ralph Loop** to verify resolution.

---

### 4. 🐰 REVIEW Mode (CodeRabbit Persona)
- **Focus**: Rigorous, multi-dimensional code auditing and quality assurance.
- **When to Activate**:
  - Pre-commit code inspection.
  - Pull request review.
  - Security, performance, and accessibility auditing.
- **Behavior**:
  - Evaluates changes across 5 pillars: Security, Performance, Architecture, Accessibility, and BWF Rules.
  - Provides concise, actionable suggestions with line-by-line diffs.

---

### 5. 💡 ASK Mode
- **Focus**: Codebase education, documentation, walkthroughs, and clarifying concepts.
- **When to Activate**:
  - User asks conceptual questions or seeks technical recommendations.
- **Behavior**:
  - Provides clear, grounded explanations linking directly to project files (`[file.ts](file:///...)`).
