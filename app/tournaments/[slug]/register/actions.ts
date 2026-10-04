"use server";

import { randomUUID } from "node:crypto";
import { attachOrder, createRegistration, markPaid } from "@/lib/data/registrations";
import { findTournament } from "@/lib/data/tournaments";
import { makeRegistrationSchema, registrationTotal } from "@/lib/registration";
import { createOrder, fetchOrder, getRazorpayConfig, verifyPaymentSignature } from "@/lib/razorpay";
import { getStatus } from "@/lib/tournaments";

export interface PaymentOrder {
  orderId: string;
  /** Paise. */
  amount: number;
  currency: string;
  /** Public key id for Checkout (safe to expose). */
  keyId: string;
}

export type RegistrationResult =
  | {
      ok: true;
      reference: string;
      total: number;
      events: string[];
      /** `null` when payments are not configured or the order could not be created. */
      payment: PaymentOrder | null;
      paymentError?: string;
    }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

/**
 * Re-validates the entry on the server (never trust the client), checks the
 * tournament is still open, then creates a Razorpay order for the amount
 * computed here from the tournament fee — the client never supplies a price.
 */
export async function submitRegistration(slug: string, data: unknown): Promise<RegistrationResult> {
  const tournament = await findTournament(slug);
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

  // Capacity counts paid entries (one per event entered); checked again by the admin before the draw.
  if (tournament.registered + parsed.data.events.length > tournament.capacity) {
    return { ok: false, formError: "Sorry, there aren't enough places left for all the events you chose." };
  }

  const reference = `REG-${randomUUID().slice(0, 8).toUpperCase()}`;
  const total = registrationTotal(tournament, parsed.data.events);
  const base = { ok: true as const, reference, total, events: parsed.data.events };

  const { player, events, partners, emergency, guardianName, consents } = parsed.data;
  await createRegistration({
    reference,
    tournamentSlug: tournament.slug,
    tournamentName: tournament.name,
    player,
    events,
    partners: Object.fromEntries(Object.entries(partners).filter(([key]) => events.includes(key))),
    emergency,
    guardianName,
    mediaConsent: consents.media,
    total,
    status: "pending_payment",
    createdAt: new Date(),
  });

  const config = getRazorpayConfig();
  if (!config) return { ...base, payment: null };

  try {
    const order = await createOrder(config, {
      amountPaise: total * 100,
      receipt: reference,
      notes: {
        reference,
        tournament: tournament.slug,
        events: parsed.data.events.join(", "),
        player: parsed.data.player.fullName,
        email: parsed.data.player.email,
        institution: parsed.data.player.institution || "",
        studentId: parsed.data.player.studentId || "",
      },
    });
    await attachOrder(reference, order.id);
    return { ...base, payment: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: config.keyId } };
  } catch {
    return { ...base, payment: null, paymentError: "We couldn't start the payment. Please try again in a moment." };
  }
}

export type VerifyResult =
  | { ok: true; reference: string; paymentId: string; amount: number }
  | { ok: false; error: string };

/**
 * Verifies the Checkout success signature, then reads the order back from
 * Razorpay so the reference and amount come from the gateway, not the browser.
 */
export async function verifyPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<VerifyResult> {
  const config = getRazorpayConfig();
  if (!config) return { ok: false, error: "Payments are not configured." };
  const valid =
    typeof input.orderId === "string" &&
    typeof input.paymentId === "string" &&
    typeof input.signature === "string" &&
    verifyPaymentSignature(config.keySecret, input);
  if (!valid) return { ok: false, error: "We couldn't verify this payment. If you were charged, contact us with your reference." };

  try {
    const order = await fetchOrder(config, input.orderId);
    // Idempotent: the webhook may already have marked it paid.
    if (order.status === "paid") await markPaid(input.orderId, input.paymentId);
    return { ok: true, reference: order.notes.reference ?? order.receipt ?? "", paymentId: input.paymentId, amount: order.amount };
  } catch {
    return { ok: false, error: "Payment received but we couldn't confirm it yet. You'll get a confirmation shortly." };
  }
}
