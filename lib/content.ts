// All hero/site copy in one place so it can be swapped without touching components.

// TODO: copy — replace with the coach's real name
export const COACH_NAME = "Coach Name";

export const SITE = {
  // TODO: copy
  title: "Enter the Arena — Professional Badminton Coaching",
  // TODO: copy
  description:
    "Elite badminton coaching and competitive tournaments. Train with precision, compete with power.",
} as const;

export const HERO = {
  // TODO: copy
  eyebrow: "Professional Badminton Coaching",
  // TODO: copy
  headline: "Enter the Arena",
  // TODO: copy
  subline:
    "Precision footwork, explosive power and match discipline — built one rally at a time.",
  primaryCta: { label: "View Tournaments", href: "#tournaments" }, // TODO: copy
  secondaryCta: { label: "Train With Me", href: "#programs" }, // TODO: copy
} as const;

export const SMASH = {
  chapter: "02 — The Smash", // TODO: copy
  headline: "Compete",
  // TODO: copy
  subline: "Every rally is a test. Step onto the court and prove it.",
  // Screen-reader summary of the visual sequence.
  description:
    "An anonymous athlete catches the racket mid-air, leaps and unleashes a jump smash; the shuttle streaks crosscourt, leaving a green trail.",
} as const;

export interface NavLink {
  label: string;
  href: `#${string}`;
}

// Anchors point at sections built in later phases (placeholders exist in app/page.tsx).
export const NAV_LINKS: readonly NavLink[] = [
  { label: "Coach", href: "#coach" },
  { label: "Programs", href: "#programs" },
  { label: "Tournaments", href: "#tournaments" },
] as const;

export const NAV_CTA: NavLink = { label: "Register", href: "#tournaments" }; // TODO: copy

// Phase 5: coach profile. Every figure and line below is placeholder until the coach supplies real ones.
export const COACH = {
  chapter: "03 — Meet the coach",
  // TODO: copy
  role: "Head Coach · Performance Badminton",
  // TODO: copy
  lead: "I build players who stay calm at 20-all.",
  // TODO: copy
  bio: [
    "A former national-circuit competitor turned full-time coach, working with juniors, club players and tournament athletes.",
    "Sessions are built on the fundamentals that decide matches: first-step speed, clean technique under pressure, and the discipline to execute a plan when the rally breaks down.",
  ],
  // TODO: real figures
  stats: [
    { value: "12+", label: "Years coaching" },
    { value: "300+", label: "Players trained" },
    { value: "40+", label: "Tournament podiums" },
  ],
  pillars: [
    { title: "Speed", text: "Split-step timing and footwork patterns that get you to the shuttle early." }, // TODO: copy
    { title: "Precision", text: "Repeatable technique on every stroke, from net kills to deep clears." }, // TODO: copy
    { title: "Power", text: "Kinetic-chain mechanics for a jump smash that finishes rallies." }, // TODO: copy
    { title: "Discipline", text: "Match plans, pressure drills and the habits that hold up in a final." }, // TODO: copy
  ],
  // TODO: real milestones
  milestones: [
    { year: "2012", text: "Began coaching at club level" },
    { year: "2016", text: "Certified performance coach" },
    { year: "2019", text: "Founded the academy programme" },
    { year: "2024", text: "Launched the open tournament series" },
  ],
  cta: { label: "Train With Me", href: "#programs" },
} as const;
