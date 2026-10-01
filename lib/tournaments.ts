/**
 * Tournament data + derived status. Shaped like a future API response (Phase 15
 * admin/DB replaces SAMPLE_TOURNAMENTS). Dates are date-only ISO strings interpreted as
 * UTC calendar days, so server and client format them identically.
 */

export type TournamentLevel = "Club" | "District" | "State" | "Open";
export type AgeGroup = "U13" | "U15" | "U17" | "Open";
export type EventType = "Singles" | "Doubles" | "Mixed";

export interface TournamentEvent {
  ageGroup: AgeGroup;
  type: EventType;
}

export interface Tournament {
  slug: string;
  name: string;
  city: string;
  venue: string;
  level: TournamentLevel;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  events: TournamentEvent[];
  /** Entry fee per event, INR. */
  entryFee: number;
  capacity: number;
  registered: number;
  prizePool?: number;
}

/** Sample fixtures used when no database is configured (and importable from the admin). */
export const SAMPLE_TOURNAMENTS: readonly Tournament[] = [
  {
    slug: "autumn-open-2026",
    name: "Autumn Open",
    city: "Bengaluru",
    venue: "Arena Court Complex",
    level: "Open",
    startDate: "2026-10-24",
    endDate: "2026-10-26",
    registrationOpens: "2026-09-10",
    registrationCloses: "2026-10-05",
    events: [
      { ageGroup: "Open", type: "Singles" },
      { ageGroup: "Open", type: "Doubles" },
      { ageGroup: "Open", type: "Mixed" },
    ],
    entryFee: 1200,
    capacity: 128,
    registered: 104,
    prizePool: 150000,
  },
  {
    slug: "junior-smash-series-2026",
    name: "Junior Smash Series",
    city: "Bengaluru",
    venue: "Academy Hall",
    level: "District",
    startDate: "2026-11-07",
    endDate: "2026-11-08",
    registrationOpens: "2026-09-20",
    registrationCloses: "2026-10-30",
    events: [
      { ageGroup: "U13", type: "Singles" },
      { ageGroup: "U15", type: "Singles" },
      { ageGroup: "U15", type: "Doubles" },
    ],
    entryFee: 600,
    capacity: 96,
    registered: 41,
  },
  {
    slug: "state-ranking-u17-2026",
    name: "State Ranking U17",
    city: "Mysuru",
    venue: "District Indoor Stadium",
    level: "State",
    startDate: "2026-11-21",
    endDate: "2026-11-23",
    registrationOpens: "2026-10-01",
    registrationCloses: "2026-11-10",
    events: [
      { ageGroup: "U17", type: "Singles" },
      { ageGroup: "U17", type: "Doubles" },
      { ageGroup: "U17", type: "Mixed" },
    ],
    entryFee: 900,
    capacity: 64,
    registered: 64,
  },
  {
    slug: "club-night-doubles-2026",
    name: "Club Night Doubles",
    city: "Bengaluru",
    venue: "Academy Hall",
    level: "Club",
    startDate: "2026-12-12",
    endDate: "2026-12-12",
    registrationOpens: "2026-11-01",
    registrationCloses: "2026-12-08",
    events: [
      { ageGroup: "Open", type: "Doubles" },
      { ageGroup: "Open", type: "Mixed" },
    ],
    entryFee: 400,
    capacity: 48,
    registered: 0,
  },
  {
    slug: "new-year-classic-2027",
    name: "New Year Classic",
    city: "Chennai",
    venue: "Coastal Sports Arena",
    level: "Open",
    startDate: "2027-01-16",
    endDate: "2027-01-18",
    registrationOpens: "2026-11-15",
    registrationCloses: "2027-01-05",
    events: [
      { ageGroup: "U15", type: "Singles" },
      { ageGroup: "U17", type: "Singles" },
      { ageGroup: "Open", type: "Singles" },
      { ageGroup: "Open", type: "Doubles" },
    ],
    entryFee: 1000,
    capacity: 160,
    registered: 0,
    prizePool: 100000,
  },
  {
    slug: "monsoon-cup-2026",
    name: "Monsoon Cup",
    city: "Bengaluru",
    venue: "Arena Court Complex",
    level: "District",
    startDate: "2026-09-12",
    endDate: "2026-09-14",
    registrationOpens: "2026-07-20",
    registrationCloses: "2026-09-01",
    events: [
      { ageGroup: "U13", type: "Singles" },
      { ageGroup: "U15", type: "Singles" },
      { ageGroup: "Open", type: "Doubles" },
    ],
    entryFee: 700,
    capacity: 96,
    registered: 96,
  },
];

export type TournamentStatus = "upcoming" | "open" | "full" | "closed" | "live" | "completed";

const DAY_MS = 86_400_000;
export const CLOSING_SOON_DAYS = 7;

/** Start of a date-only ISO string, in UTC ms. */
export function dayStart(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function getStatus(t: Tournament, now: number): TournamentStatus {
  if (now >= dayStart(t.endDate) + DAY_MS) return "completed";
  if (now >= dayStart(t.startDate)) return "live";
  if (now < dayStart(t.registrationOpens)) return "upcoming";
  if (now >= dayStart(t.registrationCloses) + DAY_MS) return "closed";
  return t.registered >= t.capacity ? "full" : "open";
}

/** Whole days until registration closes (end of the closing day). */
export function daysToClose(t: Tournament, now: number): number {
  return Math.max(0, Math.ceil((dayStart(t.registrationCloses) + DAY_MS - now) / DAY_MS));
}

export function daysToOpen(t: Tournament, now: number): number {
  return Math.max(0, Math.ceil((dayStart(t.registrationOpens) - now) / DAY_MS));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: String(d).padStart(2, "0"), month: MONTHS[m - 1], year: y };
}

/** "24–26 Oct 2026" / "30 Nov – 2 Dec 2026" / "12 Dec 2026". */
export function formatRange(start: string, end: string): string {
  const a = formatDay(start);
  const b = formatDay(end);
  if (start === end) return `${Number(a.day)} ${a.month} ${a.year}`;
  if (a.month === b.month && a.year === b.year) return `${Number(a.day)}–${Number(b.day)} ${a.month} ${a.year}`;
  return `${Number(a.day)} ${a.month} – ${Number(b.day)} ${b.month} ${b.year}`;
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatInr = (amount: number) => INR.format(amount);

export const eventLabel = (e: TournamentEvent) => `${e.ageGroup} ${e.type}`;

export function describeTournament(t: Tournament): string {
  // TODO: per-tournament copy from the organiser (admin, Phase 15).
  const article = /^[aeiou]/i.test(t.level) ? "an" : "a";
  return `${t.name} is ${article} ${t.level.toLowerCase()}-level tournament at ${t.venue}, ${t.city}, with ${t.events.length} events across ${
    new Set(t.events.map((e) => e.ageGroup)).size
  } age group${new Set(t.events.map((e) => e.ageGroup)).size === 1 ? "" : "s"}.`;
}

/** ISO date `offset` days after `iso`. */
function addDays(iso: string, offset: number): string {
  return new Date(dayStart(iso) + offset * DAY_MS).toISOString().slice(0, 10);
}

/** Provisional day-by-day outline derived from the dates until real schedules exist. */
export function provisionalSchedule(t: Tournament): { date: string; label: string }[] {
  const days = Math.round((dayStart(t.endDate) - dayStart(t.startDate)) / DAY_MS) + 1;
  if (days === 1) return [{ date: t.startDate, label: "All rounds through to finals" }];
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(t.startDate, i),
    label: i === 0 ? "Qualifying and early rounds" : i === days - 1 ? "Semi-finals and finals" : "Main draw rounds",
  }));
}

// TODO: confirm with the organiser; these are standard defaults.
export const GENERAL_RULES = [
  "All matches are best of three games to 21 points, rally-point scoring (BWF Laws of Badminton).",
  "Age is determined as of 31 December of the tournament year; proof of age is required at check-in.",
  "Players must report to the control desk 30 minutes before their scheduled match.",
  "Feather shuttles are supplied by the organiser from the quarter-finals onward.",
  "Non-marking court shoes are mandatory.",
] as const;

export const mapsUrl = (t: Tournament) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.venue}, ${t.city}`)}`;

/** Registration flow route (built in Phase 9). */
export const registerHref = (t: Tournament) => `/tournaments/${t.slug}/register`;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function statusCopy(t: Tournament, status: TournamentStatus, now: number) {
  switch (status) {
    case "open": {
      const days = daysToClose(t, now);
      const soon = days <= CLOSING_SOON_DAYS;
      return { label: soon ? `Closes in ${plural(days, "day")}` : "Registration open", tone: soon ? "urgent" : "open" } as const;
    }
    case "full":
      return { label: "Full · waitlist", tone: "muted" } as const;
    case "upcoming":
      return { label: `Opens in ${plural(daysToOpen(t, now), "day")}`, tone: "muted" } as const;
    case "closed":
      return { label: "Entries closed", tone: "muted" } as const;
    case "live":
      return { label: "Live now", tone: "urgent" } as const;
    case "completed":
      return { label: "Completed", tone: "muted" } as const;
  }
}
