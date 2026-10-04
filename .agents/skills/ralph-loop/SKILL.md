---
name: ralph-loop
description: >-
  Autonomous self-healing execution loop. Executes builds, tests, and lints,
  diagnoses any errors or type mismatches, applies targeted code repairs,
  and repeats until the build passes with 0 errors.
---

# Ralph Loop Skill

The **Ralph Loop** ensures no broken code is ever left unaddressed.

## Procedure

1. **Trigger Quality Check**:
   - Run `npm run build` using `run_command`.

2. **Evaluate Exit Code**:
   - If **Exit Code 0**: Build is green. Verify health endpoint and proceed.
   - If **Exit Code != 0**: Engage immediate self-repair.

3. **Autonomous Repair Cycle**:
   - Step 3.1: Read the task log to isolate the exact failing file, line number, and error type.
   - Step 3.2: Inspect the source file and any referenced types/interfaces using `view_file`.
   - Step 3.3: Formulate the root-cause fix (e.g. correct argument count, fix Next.js 15 Promise type, fix import path).
   - Step 3.4: Apply the change using `replace_file_content`.
   - Step 3.5: Re-trigger `npm run build`.

4. **Termination**:
   - Loop repeats until clean compilation (code 0) is achieved.
