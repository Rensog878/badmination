# Badmination - Autonomous Engineering Directives (AGENTS.md)

This project operates under the **GSD Core + Ralph Loop + Roo Code + CodeRabbit** unified engineering protocol. Every AI coding agent working in this repository must strictly adhere to these 4 integrated systems.

---

## 1. 🎯 GSD CORE (Get Shit Done)
- **Spec-Driven**: Establish clear deliverables and Definition of Done before modifying code.
- **Atomic Milestones**: Execute sequentially: Data Layer → Server Actions → UI Components → Integration → Empirical Verification.
- **Zero Hallucination**: Never report a task as complete without verifiable execution evidence (compiler exit code 0, clean build output).
- Detailed Rules: [`.agents/rules/gsd-core.md`](file:///.agents/rules/gsd-core.md)

---

## 2. 🔄 RALPH LOOP (Autonomous Self-Healing Loop)
- **Continuous Correction**: When any compilation error, TypeScript mismatch, or lint warning arises, the agent does NOT stop or ask the user to fix it.
- **The Loop**: `[Change] → [Build / Verify] → [Isolate Root Cause] → [Apply Surgical Fix] → [Re-Verify]` until 100% green (exit code 0).
- Detailed Rules: [`.agents/rules/ralph-loop.md`](file:///.agents/rules/ralph-loop.md)

---

## 3. 🎭 ROO CODE (Multi-Mode Specialization)
Switch operational mindset dynamically based on task requirements:
- **🏗️ ARCHITECT**: High-level system design, schema design, App Router boundaries, BWF compliance.
- **⚡ CODE**: Production-grade implementation, strict TypeScript, zero placeholders, Tailwind v4 design tokens.
- **🔍 DEBUG**: Root-cause analysis, runtime crash resolution, memory leak diagnosis, hydration fixes.
- **🐰 REVIEW (CodeRabbit)**: Pre-commit audits for security, performance, accessibility, and clean code.
- **💡 ASK**: Codebase documentation, architecture explanation, and technical advisory.
- Detailed Rules: [`.agents/rules/roo-code-modes.md`](file:///.agents/rules/roo-code-modes.md)

---

## 4. 🐰 CODERABBIT (Automated Rigorous Code Review)
- **Review Pillars**:
  1. 🛡️ Security: Auth guards, input sanitization via Zod, CSRF protection, environment variable safety.
  2. ⚡ Performance: Server Components by default, minimal client bundles, debounced database persistence, no memory leaks.
  3. 📐 Architecture: Strict TypeScript (no `any`), awaited Next.js 15 params, modular structure.
  4. ♿ Accessibility: `tabular-nums` for all sports scores, high contrast, 44px+ touch targets, `aria-live` live announcements.
  5. 🏸 BWF Integrity: Strict compliance with official Badminton World Federation rally point rules.
- Configuration: [`.coderabbit.yaml`](file:///.coderabbit.yaml)
- Detailed Standards: [`.agents/rules/coderabbit-standards.md`](file:///.agents/rules/coderabbit-standards.md)
