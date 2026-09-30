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
