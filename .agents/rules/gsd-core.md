# GSD Core (Get Shit Done) - Autonomous Execution Protocol

## Philosophy
GSD (Get Shit Done) is a spec-driven, high-velocity engineering framework for autonomous AI pair programming. It prioritizes atomic delivery, concrete verification, and zero tolerance for unfinished or speculative work.

## The GSD Execution Lifecycle

### 1. Specification & Scope Locking (Phase 0)
- **Clarify Intent**: Never guess user requirements. If underspecified, clarify the exact scope or present recommended choices.
- **Atomic Deliverables**: Break high-level requests into sequential, self-contained milestones (e.g. Data Layer -> Server Action -> UI Component -> Integration -> Verification).
- **Definition of Done (DoD)**: Establish the exact criteria that prove a task is 100% complete before writing any code.

### 2. High-Velocity Implementation (Phase 1)
- **Surgical Code Modifications**: Modify only what is necessary using targeted diffs (`replace_file_content`) or clean file creations (`write_to_file`).
- **No Stubs or Mock Placeholders**: Write fully functional, production-ready logic with proper error handling, fallbacks, and edge-case guards.
- **Maintain Architectural Integrity**: Respect existing patterns (App Router, Tailwind v4 design tokens, strict TypeScript, BWF rules).

### 3. Empirical Verification (Phase 2)
- **Never Declare Done Without Proof**: A task is NOT complete until concrete verification commands succeed.
- **Run Mandatory Quality Gates**:
  - `npm run build` (Must exit code 0)
  - Type-checking (0 TypeScript errors)
  - Lint check (0 ESLint errors)
- **Live Healthcheck**: Confirm runtime service health and responsiveness when daemon servers are active.

### 4. Git Atomic Commits (Phase 3)
- Every completed milestone must be committed with a conventional commit message:
  - `feat(...)`: New user-facing functionality
  - `fix(...)`: Bug fix or runtime patch
  - `perf(...)`: Performance optimization
  - `refactor(...)`: Code cleanup without behavior change
- Push clean commits to the tracking branch.
