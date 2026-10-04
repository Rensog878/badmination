# CodeRabbit Rigorous Code Review Standards

## Overview
These standards reflect CodeRabbit's automated PR and code review methodology. Every modification to this repository must meet these benchmarks before committing.

---

### Pillar 1: 🛡️ Security & Authorization
- **Server Action Protection**: Every server action in `app/admin/` or `app/umpire/` must invoke authorization guards (`guard(slug)` / `isUmpire()` / admin session checks). Never trust client input blindly.
- **Input Validation**: All forms, queries, and webhook payloads must be validated using Zod schemas.
- **Secret Management**: API keys, MongoDB URIs, and webhook secrets must live in `.env.local` or environment variables, never hardcoded in source control.
- **CSRF & Injection**: Protect against SQL/NoSQL injection by using strongly-typed query parameters and sanitizing external strings.

---

### Pillar 2: ⚡ Performance & Resource Efficiency
- **Server Components by Default**: Pages and components must remain Server Components unless client state (`useState`), browser APIs (`window`, `navigator`), or event listeners are required.
- **Bundle Optimization**: Heavy libraries (GSAP, Three.js, Canvas) must be dynamically loaded or isolated in specific client islands.
- **Database & State Flushing**: In-memory score feeds use debounced writes to MongoDB (`SAVE_DEBOUNCE_MS`), with explicit `flushFeed()` only on game/match state transitions.
- **No Memory Leaks**: Clear all `setInterval`, `setTimeout`, and event listeners in `useEffect` cleanup return functions.

---

### Pillar 3: 📐 Architecture & TypeScript Cleanliness
- **Strict Typing**: Zero tolerance for `any` or loose `as unknown as Type` casts. Use type guards (`isSide(v)`) or Zod inference.
- **Next.js 15 Compatibility**: `params` and `searchParams` in page components are `Promise` types and must be awaited.
- **Tailwind v4 Cohesion**: Use CSS custom property tokens (`var(--color-court-green)`, `var(--color-charcoal)`) defined in `@theme` rather than arbitrary hardcoded hex codes.

---

### Pillar 4: ♿ Accessibility & Sports UI Standards
- **Scoreboard Tabular Numbers**: Always apply `tabular-nums` on scores, timers, statistics, and court numbers to prevent visual jitter during live updates.
- **WCAG AA Contrast**: Maintain high contrast between background (`#0a0a0a`) and text (`#f3f4f6` / `#10b981`).
- **Touch Targets**: Mobile buttons (scoring pad, umpire controls, navigation) must have minimum touch targets of `min-h-11` (44px) with clear active/pressed states.
- **Screen Reader Announcements**: Live scores, venue announcements, and court calls must announce via `aria-live="polite"` regions.

---

### Pillar 5: 🏸 BWF Badminton Domain Integrity
- **BWF Scoring Compliance**: Rally point scoring system (best of 3 games to 21 points; 2-point lead required from 20-all; absolute point cap at 29-all reaching 30).
- **Interval Regulations**: 60-second interval when leading score reaches 11 points; 120-second interval between games.
- **Service Court Alignment**: Right service court on even score, left service court on odd score.
