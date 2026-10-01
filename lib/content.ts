import { FEATURES } from "@/lib/features";

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
  eyebrow: "Badminton Tournaments",
  // TODO: copy
  headline: "Enter the Arena",
  // TODO: copy
  subline:
    "Find your draw, enter in minutes, and follow every rally live.",
  primaryCta: { label: "View Tournaments", href: "#tournaments" }, // TODO: copy
  // Hidden while FEATURES.programs is off.
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
  /** Hidden unless this feature is on (lib/features.ts). */
  feature?: "coachProfile" | "programs" | "showcase";
  /** Root-relative so links work from sub-pages (e.g. /tournaments/[slug]). */
  href: `/#${string}`;
}

// Anchors point at sections built in later phases (placeholders exist in app/page.tsx).
export const NAV_LINKS: readonly NavLink[] = [
  { label: "Coach", href: "/#coach", feature: "coachProfile" },
  { label: "Programs", href: "/#programs", feature: "programs" },
  { label: "Tournaments", href: "/#tournaments" },
] as const;

/** Navigation after applying feature flags. */
export const VISIBLE_NAV_LINKS = NAV_LINKS.filter((l) => !l.feature || FEATURES[l.feature]);

export const NAV_CTA: NavLink = { label: "Register", href: "/#tournaments" }; // TODO: copy

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

// Phase 6: programs. All details are placeholder until the coach confirms them.
export type ProgramAudience = "juniors" | "adults" | "competitive";

export interface Program {
  id: string;
  name: string;
  level: string;
  audience: ProgramAudience;
  summary: string;
  format: { label: string; value: string }[];
  focus: string[];
  featured?: boolean;
}

export const PROGRAMS_INTRO = {
  chapter: "04 — Train",
  // TODO: copy
  headline: "Programs built for the next level",
  // TODO: copy
  lead: "Small groups, clear progressions and match play every week. Pick the track that fits where you are now.",
} as const;

export const PROGRAM_FILTERS: { value: ProgramAudience | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "juniors", label: "Juniors" },
  { value: "adults", label: "Adults" },
  { value: "competitive", label: "Competitive" },
];

// TODO: real programs, ages, schedules
export const PROGRAMS: readonly Program[] = [
  {
    id: "junior-foundations",
    name: "Junior Foundations",
    level: "Beginner",
    audience: "juniors",
    summary: "Grip, footwork and rally confidence through games-based sessions.",
    format: [
      { label: "Ages", value: "7–12" },
      { label: "Sessions", value: "2 / week" },
      { label: "Group", value: "Max 8" },
    ],
    focus: ["Grips and basic strokes", "Six-corner footwork", "Serve and return", "Fun match play"],
  },
  {
    id: "junior-development",
    name: "Junior Development",
    level: "Intermediate",
    audience: "juniors",
    summary: "Technique under pressure and a first taste of tournament play.",
    format: [
      { label: "Ages", value: "11–16" },
      { label: "Sessions", value: "3 / week" },
      { label: "Group", value: "Max 8" },
    ],
    focus: ["Overhead power", "Net play and deception", "Singles and doubles tactics", "Local tournaments"],
  },
  {
    id: "adult-performance",
    name: "Adult Performance",
    level: "All levels",
    audience: "adults",
    summary: "Structured club training for adults who want to play faster and smarter.",
    format: [
      { label: "Ages", value: "17+" },
      { label: "Sessions", value: "2 / week" },
      { label: "Group", value: "Max 10" },
    ],
    focus: ["Stroke rebuilds", "Movement efficiency", "Doubles rotations", "Conditioned games"],
  },
  {
    id: "elite-competition",
    name: "Elite Competition",
    level: "Advanced",
    audience: "competitive",
    summary: "High-intensity squad for ranked and aspiring tournament players.",
    format: [
      { label: "Entry", value: "By trial" },
      { label: "Sessions", value: "5 / week" },
      { label: "Group", value: "Max 6" },
    ],
    focus: ["Jump smash and attack chains", "Physical conditioning", "Video match analysis", "Tournament planning"],
    featured: true,
  },
  {
    id: "private-coaching",
    name: "1:1 Private Coaching",
    level: "Any level",
    audience: "competitive",
    summary: "Individual sessions targeting the one or two things holding your game back.",
    format: [
      { label: "Ages", value: "Any" },
      { label: "Session", value: "60 min" },
      { label: "Group", value: "1:1" },
    ],
    focus: ["Personal game audit", "Targeted technique blocks", "Match-plan preparation"],
  },
];

export const TRIAL = {
  // TODO: copy
  headline: "Book a trial session",
  text: "Not sure which program fits? Come for one session and we will place you on the right track.",
  // TODO: real contact address
  email: "coach@example.com",
  cta: "Book a trial",
} as const;

export const TOURNAMENTS_INTRO = {
  chapter: "03 — Compete",
  // TODO: copy
  headline: "Find your next draw",
  // TODO: copy
  lead: "Sanctioned events from club nights to state ranking tournaments. Filter by age group and level, then enter in minutes.",
} as const;
