# Ralph Loop - Autonomous Self-Correction & Verification Protocol

## Philosophy
The **Ralph Loop** is an autonomous, self-healing execution cycle. When facing compilation errors, lint failures, broken tests, or runtime regressions, the agent does NOT stop, give up, or offload the fix to the user. Instead, it engages in an autonomous corrective feedback loop until the system is 100% green.

## The Ralph Iteration Loop

```
  ┌──────────────────────────────────────────────────┐
  │                 1. EXECUTE CHANGE                │
  └─────────────────────────┬────────────────────────┘
                            │
                            ▼
  ┌──────────────────────────────────────────────────┐
  │         2. VERIFY (npm run build / lint)         │
  └─────────────────────────┬────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ Exit Code 0?                  │
            ├───────────────┬───────────────┤
            │ YES           │ NO (Errors)   │
            ▼               ▼               │
    ┌───────────────┐  ┌────────────────────┴────────┐
    │  PROCEED TO   │  │   3. ISOLATE ROOT CAUSE     │
    │  DEPLOY/COMMIT│  │   (Line, File, Type Mismatch│
    └───────────────┘  └────────────┬────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────────┐
                       │   4. APPLY SURGICAL FIX     │
                       └────────────┬────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────────┐
                       │   5. RE-RUN VERIFICATION    │
                       │   (Loop Back to Step 2)     │
                       └─────────────────────────────┘
```

## Ralph Loop Directives

1. **Autonomous Error Diagnosis**:
   - Parse compiler output to extract the exact file path, line number, and error message (e.g. `Type error: Expected 1 arguments, but got 2`).
   - Read the exact signature from upstream definition files rather than guessing.

2. **Root Cause Resolution (No Sweeping Under the Rug)**:
   - Do NOT cast to `any` to bypass TypeScript errors.
   - Do NOT disable ESLint rules with `// eslint-disable` unless explicitly standard for a specific pattern.
   - Fix the actual underlying type, logic, or missing prop mismatch.

3. **Loop Termination Criteria**:
   - The loop only terminates when:
     - `npm run build` exits with code `0`.
     - Zero unhandled exceptions or broken imports.
     - Production daemon server responds with HTTP `200`.

4. **Self-Documenting Fixes**:
   - Record what failed and how it was resolved in commit logs and summaries so the issue never regresses.
