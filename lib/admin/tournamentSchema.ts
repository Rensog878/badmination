import { z } from "zod";
import { dayStart, type AgeGroup, type EventType, type Tournament, type TournamentLevel } from "@/lib/tournaments";

export const LEVELS: TournamentLevel[] = ["Club", "District", "State", "Open"];
export const AGE_GROUPS: AgeGroup[] = ["U9", "U11", "U13", "U15", "U17", "U19", "College", "Open"];
export const EVENT_TYPES: EventType[] = ["Singles", "Doubles", "Mixed"];

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
/** Empty inputs must fail, not silently become 0 (z.coerce turns "" into 0). */
const int = (min: number, msg: string) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number({ error: msg }).int(msg).min(min, msg));

/** Admin tournament form → Tournament. Date order is enforced so derived status stays sane. */
export const tournamentFormSchema = z
  .object({
    name: z.string().trim().min(3, "Name is required").max(80),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
      .max(60),
    city: z.string().trim().min(2, "City is required").max(60),
    venue: z.string().trim().min(2, "Venue is required").max(80),
    level: z.enum(LEVELS, { error: "Choose a level" }),
    startDate: date,
    endDate: date,
    registrationOpens: date,
    registrationCloses: date,
    entryFee: int(0, "Enter a fee in whole rupees"),
    capacity: int(1, "Capacity must be at least 1"),
    prizePool: z.union([z.literal(""), int(0, "Enter a whole number")]).optional(),
    events: z
      .array(z.string().regex(/^(U9|U11|U13|U15|U17|U19|College|Open)\|(Singles|Doubles|Mixed)$/))
      .min(1, "Choose at least one event"),
  })
  .superRefine((v, ctx) => {
    const [s, e, o, c] = [v.startDate, v.endDate, v.registrationOpens, v.registrationCloses].map(dayStart);
    if (e < s) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Ends before it starts" });
    if (c < o) ctx.addIssue({ code: "custom", path: ["registrationCloses"], message: "Closes before it opens" });
    if (c >= s) ctx.addIssue({ code: "custom", path: ["registrationCloses"], message: "Entries must close before play starts" });
  });

export function toTournament(v: z.output<typeof tournamentFormSchema>, registered: number): Tournament {
  return {
    slug: v.slug,
    name: v.name,
    city: v.city,
    venue: v.venue,
    level: v.level,
    startDate: v.startDate,
    endDate: v.endDate,
    registrationOpens: v.registrationOpens,
    registrationCloses: v.registrationCloses,
    events: v.events.map((key) => {
      const [ageGroup, type] = key.split("|") as [AgeGroup, EventType];
      return { ageGroup, type };
    }),
    entryFee: v.entryFee,
    capacity: v.capacity,
    registered,
    ...(typeof v.prizePool === "number" && v.prizePool > 0 ? { prizePool: v.prizePool } : {}),
  };
}

/** FormData → plain object for the schema (checkbox groups become arrays). */
export const tournamentFormInput = (fd: FormData) => ({
  ...Object.fromEntries([...fd.entries()].filter(([k]) => k !== "events")),
  events: fd.getAll("events").map(String),
});
