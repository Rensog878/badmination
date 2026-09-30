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
