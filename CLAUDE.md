# Cinematic Badminton Coaching & Tournament Platform

Premium, cinematic site for a professional badminton coach. The feel is Olympic broadcast, a Nike campaign film and a AAA game UI. **Cinematic where appropriate, functional everywhere.**

## Stack
- Next.js 15 (App Router, no `src/`), React 19, TypeScript (strict, no `any`)
- Tailwind v4: tokens live in `app/globals.css` under `@theme`. There is no `tailwind.config.ts`.
- three, @react-three/fiber v9, @react-three/drei v10, lucide-react
- gsap + ScrollTrigger + @gsap/react (Phase 3)
- react-hook-form + zod v4 + @hookform/resolvers (Phase 9)
- Razorpay via REST (`lib/razorpay.ts`, `server-only`) + Standard Checkout script loaded on demand (Phase 10)
- MongoDB Atlas (official `mongodb` driver) + Cloudflare R2 via `@aws-sdk/client-s3` presigned uploads (Phase 15)
- Later: Framer Motion, React Hook Form + Zod

## Commands
- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`
- Env: copy `.env.example` → `.env.local` (RAZORPAY_KEY_ID / _KEY_SECRET / _WEBHOOK_SECRET). Without keys, entry works and payment shows "not available".
- `npm run admin:create -- you@example.com "Name"` creates/resets an admin (reads .env.local; prompts for password).
- Build with MONGODB_URI set in production: statically generated pages read tournaments at build time.
- `postinstall` copies the Draco decoder into `public/draco/` (`scripts/copy-draco.mjs`). It is self-hosted, with no CDN.

## Structure
```
app/            layout (fonts, metadata, header), page (home story), globals.css (tokens)
                tournaments/[slug]/page (SSG details; dynamicParams=false, revalidate 1h)
                tournaments/[slug]/register/page + actions.ts (submitRegistration: validate + create order; verifyPayment)
                api/razorpay/webhook/route.ts (signature-verified webhook; source of truth for payment state)
                tournaments/[slug]/confirmation (receipt read from Razorpay by ?order=; noindex) · tournaments/[slug]/calendar (.ics)
                tournaments/[slug]/live (dashboard) · tournaments/[slug]/live/[matchId] (public scoreboard, fullscreen)
                api/live/[slug] (SSE snapshot stream) · umpire/[slug] (+ /[matchId]) umpire console + actions.ts
components/stage CinematicStage (owns the ONE persistent Canvas, WebGL check, error fallback, loader),
                StageContext (mode: pending | 3d | fallback, reducedMotion)
components/hero HeroSection (text/CTAs), HeroFallback (static SVG)
components/smash SmashSection (scroll space + GSAP timeline + DOM beats), SmashFallback (static SVG)
components/3d   HeroScene (the Canvas contents), CameraRig (hero framing + cinematic override blend),
                ArenaEnvironment, SmashScene (athlete, shuttle, trail, lights, camera path),
                RacketModel (GLTF-or-procedural, idle motion, flight into the hand), ProceduralRacket, SceneErrorBoundary
components/nav  SiteHeader (fixed; solid after scroll, hides on scroll-down), MobileMenu (dialog, focus trap, Esc, scroll lock),
                useHeaderState (scroll + active-section hooks)
components/coach CoachSection (server; portrait, bio, stats, pillars, career), CoachPortrait (next/image or placeholder)
components/programs ProgramsSection (server shell + trial band), ProgramExplorer (client audience filter), ProgramCard
components/tournaments TournamentsSection (server shell, gets `now`), TournamentExplorer (client: view tabs,
                age/level filters, search), TournamentRow (fixture-list row, links to /tournaments/[slug]),
                StatusBadge, RegistrationCard (status-aware entry card)
components/registration RegistrationForm (4-step RHF form), FormField (label/hint/error wiring), PaymentPanel (Checkout)
components/live LiveDashboard, CourtCard (links to scoreboard), Scoreboard (broadcast view, momentum strip), useLiveFeed
components/umpire UmpireShell (auth gate), UmpireLogin, ScoringPad (tap/keyboard A·B·U), StartMatchButton
components/showcase ShowcaseSection (hidden when empty), Gallery (filter + <dialog> lightbox), Testimonials (scroll-snap rail)
app/admin       (auth)/login · (panel)/ overview, tournaments (+new/[slug]), registrations (+export CSV), live, media, users;
                actions.ts / media-actions.ts / live-actions.ts (every action re-checks the admin role)
components/admin LoginForm, TournamentForm, UserForm, MediaUploader, TestimonialForm, MatchForm
components/ui   LoadingScreen, CourtLines (shared court SVG), Reveal (one-shot GSAP fade-up; off under reduced motion)
lib/            content (all copy), assets (model URLs, ATHLETE_SOURCE), sceneState (mutable, GSAP-drivable),
                performance (tiers, reduced motion, WebGL/visibility hooks), racketGeometry (procedural racket),
                athleteRig (faceless procedural athlete + smash poses), smashTimeline (all sequence marks/keys)
```

## Design tokens
- Colours (only these; use opacity for glow): `charcoal #0A0A0A` (page bg), `black #000`, `off-white #F3F4F6` (text), `muted #9CA3AF`, `court-green #10B981` (accent)
- Fonts: Inter → `font-sans`, Space Grotesk → `font-display`
- Big uppercase display type, used sparingly. No SaaS gradients, heavy glass, excess neon or random motion.

## Content
- All copy in `lib/content.ts`; anything marked `// TODO: copy` or `// TODO: real figures` is placeholder.
- Programs: edit `PROGRAMS` / `PROGRAM_FILTERS` / `TRIAL` in `lib/content.ts`; `featured: true` marks the flagship card. Trial CTA is a mailto until a booking flow exists.
- Tournaments: data + status logic in `lib/tournaments.ts` (placeholder fixtures until Phase 15). Status is derived from
  date-only UTC strings and a server-supplied `now` (page `revalidate = 3600`), so server/client render identically.
- Nav links are root-relative (`/#coach`) so they work from sub-pages.
- Detail pages derive a provisional schedule, description and default rules (`GENERAL_RULES`) until real data exists.
- Registration: `lib/registration.ts` builds the Zod schema per tournament (shared client + server). Cross-field rules
  (age eligibility on 31 Dec, partners, guardian for under-18s) live in `crossFieldIssues`, because Zod skips an object's
  superRefine while other fields are invalid: the form runs it per step, the schema runs it for the final/server check.
  No persistence yet: the action returns a reference + total (Phase 10 attaches payment, Phase 15 stores entries).
- Payments: amount is computed server-side (fee × validated events, in paise); the browser never sends a price.
  Checkout success → `verifyPayment` checks HMAC(order|payment) and reads the order back for reference/amount.
  Webhook verifies HMAC(raw body). Persisting entries/payments is Phase 15 (TODOs mark the spots).
- Confirmation trusts nothing in the URL except the order id: order, notes and payments are fetched from Razorpay;
  unknown ids or another tournament's order → 404. `RAZORPAY_API_BASE` exists only to point tests at a mock gateway.
- Live: `lib/live/scoring.ts` = pure BWF rally scoring (21, win by 2, cap 30, best of 3; addPoint/removePoint/pressurePoint).
  `lib/live/store.ts` = in-memory feed + subscribers (single process; Phase 15 → DB + pub/sub). Demo simulator runs only
  while someone watches and only when LIVE_DEMO=1 (or in dev); the UI always labels it "Demo feed". `updateMatch()` is the
  hook for real scoring. SSE needs a long-running Node server (not serverless functions).
- Umpire auth (interim): UMPIRE_TOKEN passcode → httpOnly HMAC cookie (path /umpire, 12h); every scoring action re-checks it
  (`lib/umpire-auth.ts`). Umpire-scored matches get `controlledBy: "umpire"` so the demo simulator skips them.
  Store ops: umpireScore / umpireUndo (rally history) / umpireStart (lowest free court). Phase 15 → real accounts + rate limits.
- Showcase (`lib/showcase.ts`): placeholder images/testimonials are labelled and hidden in production unless
  SHOW_PLACEHOLDERS=1. Never ship invented testimonials as real; real quotes need consent. Real photos → /public/gallery/.
- Data layer (`lib/db/mongo.ts`, `lib/data/*`): one cached client; indexes ensured on first connect. Without MONGODB_URI,
  tournaments fall back to SAMPLE_TOURNAMENTS and admin/accounts are disabled.
- Auth (`lib/auth/*`): scrypt passwords; sessions = random token in httpOnly cookie, SHA-256 stored in DB (TTL);
  5 failed logins per email+IP per 15 min. Roles: admin (everything), umpire (scoring). Umpire console uses accounts
  when the DB is configured, else the UMPIRE_TOKEN passcode (local demos only).
- Payments → DB: entry saved as pending_payment; `markPaid` is a conditional update (status ≠ paid) so checkout
  verification and webhook can both run without double-counting `registered` (one per event entered).
- Live feeds (non-demo) are written through to `liveFeeds` (debounced) and loaded via `ensureFeed()` before use.
- Media: R2 presigned PUT (type + exact size signed, 5-min TTL, ≤ 8 MB); bucket needs CORS for PUT from the site origin.
- Palette has no error colour: errors use an icon + text (never colour alone).
- Coach photo: set `COACH_PORTRAIT_URL` in `lib/assets.ts` (e.g. `/images/coach.jpg` in `public/`).
- Sections after the cinematic stage are server components with a solid `bg-charcoal`; wrap content in `<Reveal>` for entrance motion.

## Layering (z-index)
Skip link 70 · loader 60 · header 50 · mobile menu 40 · content · Canvas (-10 inside the stage)

## 3D conventions
- One `<Canvas>` (fixed, behind the content). Never mount a Canvas per section.
- Per-frame motion only in `useFrame`, delta-based. No React state per frame.
- `sceneState` is the bridge between DOM and 3D. GSAP only scrubs `smash.progress` (0..1); `SmashScene` derives everything else from it (pose, racket `attach`, shuttle, trail, lights, `camera.override`), so scrubbing works both ways.
- Timing of every beat lives in `lib/smashTimeline.ts` (`SMASH_MARKS`, `POSE_KEYS`, `CAMERA_KEYS`); DOM beats in `SmashSection` use the same marks.
- Racket shoulder angles in `SMASH_POSES` are unwrapped (> π) so blends swing over the top.
- QA: `?tier=high|medium|low` locks the tier and disables auto step-down (headless/software GL otherwise falls back to static).
- Racket units: metres, butt at y=0, long axis +Y, pivot at the balance point (305 mm), world scale ×4.
- To swap in a real racket, set `RACKET_MODEL_URL` in `lib/assets.ts`. It is auto-normalised to the same scale and pivot.
- Product decision: FULL-QUALITY 3D on every device segment (low-end, mid-range, high-end). No device detection and no
  automatic downgrade: everyone starts and stays on the "high" tier (DPR up to 2, soft shadows, fog, full lighting, detailed
  models, MSAA, full-screen loader). `?tier=medium|low` exists only as a testing override. Static fallback = no WebGL or a
  render error only.
- Mobile performance rules (keep the first download small: home ≈127 kB JS):
  - Never import `three`, `@react-three/*`, `lib/sceneState` or `lib/racketGeometry` from DOM components. DOM code uses
    `lib/smashProgress` (three-free). `lib/smashTimeline` must stay three-free (tuples, not Vector3).
  - GSAP is dynamically imported in SmashSection only in 3D mode. Reveal uses IntersectionObserver + CSS (no GSAP).
  - 3D loads after `requestIdleCallback` (text and CTAs paint first); the loader shows on all devices (all are high tier).
  - No `backdrop-blur` on fixed/sticky elements (expensive on low-end GPUs). `content-visibility` was tried and removed:
    it broke reveals and made the scrollbar jump.
  - Measure with a separate build dir so it doesn't fight `next dev`: `NEXT_DIST_DIR=.next-prod npm run build && NEXT_DIST_DIR=.next-prod npm start`.
- The athlete is NEVER a real, recognisable player: it is an anonymous silhouette or the coach.

## Scroll story
1. ENTER THE ARENA: floating racket under a spotlight (Phase 2, done)
2. THE SMASH: the camera pulls back and rises, the racket flies into a faceless athlete's hand, scroll scrubs the jump smash, a green shuttle trail, an impact flash, then **COMPETE** (Phase 3, done)
3. MEET THE COACH → TRAIN → COMPETE → REGISTER → PLAY → WIN

## Phases
- [x] 1 Foundation · [x] 2 Cinematic 3D hero
- [x] 3 Scroll smash sequence (GSAP) · [x] 4 Navigation · [x] 5 Coach profile · [x] 6 Programs · [x] 7 Tournament discovery · [x] 8 Tournament details · [x] 9 Registration · [x] 10 Payment · [x] 11 Confirmation · [x] 12 Live dashboard · [x] 13 Live scoreboard · [x] 14 Gallery/testimonials · [x] 15 Admin (MongoDB Atlas + R2)

Build only the current phase, then stop for approval.
