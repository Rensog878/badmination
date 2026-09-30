# Cinematic Badminton Coaching & Tournament Platform

Premium, cinematic site for a professional badminton coach. The feel is Olympic broadcast, a Nike campaign film and a AAA game UI. **Cinematic where appropriate, functional everywhere.**

## Stack
- Next.js 15 (App Router, no `src/`), React 19, TypeScript (strict, no `any`)
- Tailwind v4: tokens live in `app/globals.css` under `@theme`. There is no `tailwind.config.ts`.
- three, @react-three/fiber v9, @react-three/drei v10, lucide-react
- Later: GSAP + ScrollTrigger (Phase 3), Framer Motion, React Hook Form + Zod

## Commands
- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`
- `postinstall` copies the Draco decoder into `public/draco/` (`scripts/copy-draco.mjs`). It is self-hosted, with no CDN.

## Structure
```
app/            layout (fonts, metadata), page (hero + Phase 3 scroll space), globals.css (tokens)
components/hero HeroSection (client: text/CTAs, WebGL check, boundary, loader), HeroFallback (static SVG)
components/3d   HeroScene (the ONE persistent Canvas), CameraRig, ArenaEnvironment,
                RacketModel (GLTF-or-procedural switch, idle motion), ProceduralRacket, SceneErrorBoundary
components/ui   LoadingScreen, CourtLines (shared court SVG)
lib/            content (all copy), assets (model URLs, ATHLETE_SOURCE), sceneState (mutable, GSAP-drivable),
                performance (tiers, reduced motion, WebGL/visibility hooks), racketGeometry (procedural racket)
```

## Design tokens
- Colours (only these; use opacity for glow): `charcoal #0A0A0A` (page bg), `black #000`, `off-white #F3F4F6` (text), `muted #9CA3AF`, `court-green #10B981` (accent)
- Fonts: Inter → `font-sans`, Space Grotesk → `font-display`
- Big uppercase display type, used sparingly. No SaaS gradients, heavy glass, excess neon or random motion.

## 3D conventions
- One `<Canvas>` (fixed, behind the content). Never mount a Canvas per section.
- Per-frame motion only in `useFrame`, delta-based. No React state per frame.
- `sceneState` holds the camera position/target and the racket position/rotation/scale/idle. Set `camera.mode = "external"` when GSAP owns the camera.
- Racket units: metres, butt at y=0, long axis +Y, pivot at the balance point (305 mm), world scale ×4.
- To swap in a real racket, set `RACKET_MODEL_URL` in `lib/assets.ts`. It is auto-normalised to the same scale and pivot.
- Tiers high/medium/low (`lib/performance.ts`), stepped down at runtime by `PerformanceMonitor`. If the low tier is still too slow, the static fallback shows.
- The athlete is NEVER a real, recognisable player: it is an anonymous silhouette or the coach.

## Scroll story
1. ENTER THE ARENA: floating racket under a spotlight (Phase 2, done)
2. THE SMASH: the camera pulls back and rises, the racket flies into a faceless athlete's hand, scroll scrubs the jump smash, a green shuttle trail, an impact flash, then **COMPETE** (Phase 3)
3. MEET THE COACH → TRAIN → COMPETE → REGISTER → PLAY → WIN

## Phases
- [x] 1 Foundation · [x] 2 Cinematic 3D hero
- [ ] 3 Scroll smash sequence (GSAP) · 4 Navigation · 5 Coach profile · 6 Programs · 7 Tournament discovery · 8 Tournament details · 9 Registration (RHF + Zod) · 10 Payment (Razorpay) · 11 Confirmation · 12 Live dashboard · 13 Live scoreboard · 14 Gallery/testimonials · 15 Admin (Node + MongoDB)

Build only the current phase, then stop for approval.
