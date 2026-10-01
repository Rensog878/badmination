import { z } from "zod";
import { eventLabel, type AgeGroup, type Tournament, type TournamentEvent } from "@/lib/tournaments";

/**
 * Registration schema, shared by the client form (React Hook Form) and the
 * server action, so both validate identically. Built per tournament because
 * eligibility depends on its events and dates.
 */

const AGE_LIMITS: Record<AgeGroup, number | null> = { U13: 13, U15: 15, U17: 17, Open: null };
const ADULT_AGE = 18;
const INDIAN_MOBILE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const eventKey = (e: TournamentEvent) => eventLabel(e).toLowerCase().replace(/\s+/g, "-");
export const needsPartner = (e: TournamentEvent) => e.type !== "Singles";

/** Age on 31 December of the tournament year (the usual age-group cut-off). */
export function ageAtCutoff(dateOfBirth: string, t: Tournament): number | null {
  if (!ISO_DATE.test(dateOfBirth)) return null;
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  const year = Number(t.startDate.slice(0, 4));
  if (Number.isNaN(new Date(Date.UTC(y, m - 1, d)).getTime())) return null;
  // On 31 Dec everyone born that year has already had their birthday.
  return year - y;
}

export function isEligible(e: TournamentEvent, age: number | null): boolean {
  const limit = AGE_LIMITS[e.ageGroup];
  return limit === null || (age !== null && age < limit);
}

const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

export function makeRegistrationSchema(t: Tournament) {
  const keys = t.events.map(eventKey);

  return z
    .object({
      player: z.object({
        fullName: z.string().trim().min(2, "Enter the player's full name").max(80, "Keep this under 80 characters"),
        dateOfBirth: z
          .string()
          .regex(ISO_DATE, "Enter a valid date of birth")
          .refine((v) => {
            const time = Date.parse(v);
            return !Number.isNaN(time) && time < Date.parse(t.startDate) && Number(v.slice(0, 4)) > 1900;
          }, "Enter a valid date of birth"),
        gender: z.enum(["female", "male", "other"], { error: "Select an option" }),
        email: z.email("Enter a valid email address"),
        phone: z.string().trim().regex(INDIAN_MOBILE, "Enter a 10-digit Indian mobile number"),
        city: z.string().trim().min(2, "Enter your city").max(60, "Keep this under 60 characters"),
        club: optionalText(80),
      }),
      events: z
        .array(z.string())
        .min(1, "Choose at least one event")
        .refine((list) => list.every((k) => keys.includes(k)), "Choose events from this tournament"),
      partners: z.record(z.string(), z.string().trim().max(80, "Keep this under 80 characters")),
      emergency: z.object({
        name: z.string().trim().min(2, "Enter an emergency contact name").max(80, "Keep this under 80 characters"),
        phone: z.string().trim().regex(INDIAN_MOBILE, "Enter a 10-digit Indian mobile number"),
      }),
      guardianName: optionalText(80),
      consents: z.object({
        rules: z.literal(true, { error: "You must accept the tournament rules" }),
        media: z.boolean(),
      }),
    })
    .superRefine((data, ctx) => {
      for (const issue of crossFieldIssues(data, t)) ctx.addIssue({ code: "custom", ...issue });
    });
}

export interface CrossFieldIssue {
  path: string[];
  message: string;
}

type CrossFieldInput = {
  player: { dateOfBirth: string };
  events: readonly string[];
  partners: Record<string, string | undefined>;
  guardianName: string;
};

/**
 * Rules that span fields (eligibility, partners, guardian). Zod skips an object's
 * superRefine while any other field is invalid, so the multi-step form also calls
 * this directly per step; the schema uses it for the final/server check.
 */
export function crossFieldIssues(data: CrossFieldInput, t: Tournament): CrossFieldIssue[] {
  const issues: CrossFieldIssue[] = [];
  const age = ageAtCutoff(data.player.dateOfBirth, t);
  for (const key of data.events) {
    const event = t.events.find((e) => eventKey(e) === key);
    if (!event) continue;
    if (!isEligible(event, age)) {
      issues.push({ path: ["events"], message: `${eventLabel(event)} needs a player under ${AGE_LIMITS[event.ageGroup]} on 31 Dec` });
    }
    if (needsPartner(event) && (data.partners[key] ?? "").trim().length < 2) {
      issues.push({ path: ["partners", key], message: "Enter your partner's full name" });
    }
  }
  if (age !== null && age < ADULT_AGE && data.guardianName.trim().length < 2) {
    issues.push({ path: ["guardianName"], message: "A parent or guardian must be named for players under 18" });
  }
  return issues;
}

export type RegistrationValues = z.infer<ReturnType<typeof makeRegistrationSchema>>;

export const emptyRegistration: RegistrationValues = {
  player: { fullName: "", dateOfBirth: "", gender: "" as RegistrationValues["player"]["gender"], email: "", phone: "", city: "", club: "" },
  events: [],
  partners: {},
  emergency: { name: "", phone: "" },
  guardianName: "",
  consents: { rules: false as true, media: false },
};

export const registrationTotal = (t: Tournament, events: readonly string[]) => t.entryFee * events.length;

export const isMinor = (dateOfBirth: string, t: Tournament) => {
  const age = ageAtCutoff(dateOfBirth, t);
  return age !== null && age < ADULT_AGE;
};
