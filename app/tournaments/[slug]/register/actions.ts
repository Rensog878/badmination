"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { makeRegistrationSchema, registrationTotal } from "@/lib/registration";
import { getStatus, getTournament } from "@/lib/tournaments";

export type RegistrationResult =
  | { ok: true; reference: string; total: number; events: string[] }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

/**
 * Re-validates the entry on the server (never trust the client), and checks the
 * tournament is still open. Persistence arrives with the database in Phase 15;
 * payment (Phase 10) will attach to the returned reference.
 */
export async function submitRegistration(slug: string, data: unknown): Promise<RegistrationResult> {
  const tournament = getTournament(slug);
  if (!tournament) return { ok: false, formError: "This tournament no longer exists." };
  if (getStatus(tournament, Date.now()) !== "open") {
    return { ok: false, formError: "Registration for this tournament is closed." };
  }

  const parsed = makeRegistrationSchema(tournament).safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] ??= issue.message;
    }
    return { ok: false, formError: "Some details need fixing.", fieldErrors };
  }

  // TODO(Phase 15): persist the entry; TODO(Phase 10): create the Razorpay order for `total`.
  const reference = `REG-${randomUUID().slice(0, 8).toUpperCase()}`;
  return {
    ok: true,
    reference,
    total: registrationTotal(tournament, parsed.data.events),
    events: parsed.data.events,
  };
}

/** Exported for tests/tools that want the inferred payload type. */
export type RegistrationPayload = z.input<ReturnType<typeof makeRegistrationSchema>>;
