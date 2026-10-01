import "server-only";
import type { Filter } from "mongodb";
import { addRegistered } from "@/lib/data/tournaments";
import { collection, dbConfigured } from "@/lib/db/mongo";
import type { RegistrationValues } from "@/lib/registration";

export type RegistrationStatus = "pending_payment" | "paid";

export interface RegistrationDoc {
  reference: string;
  tournamentSlug: string;
  tournamentName: string;
  player: RegistrationValues["player"];
  events: string[];
  partners: Record<string, string>;
  emergency: RegistrationValues["emergency"];
  guardianName: string;
  mediaConsent: boolean;
  /** INR. */
  total: number;
  status: RegistrationStatus;
  razorpayOrderId?: string;
  paymentId?: string;
  createdAt: Date;
  paidAt?: Date;
}

export async function createRegistration(doc: RegistrationDoc): Promise<void> {
  if (!dbConfigured()) return;
  await (await collection<RegistrationDoc>("registrations")).insertOne(doc);
}

export async function attachOrder(reference: string, orderId: string): Promise<void> {
  if (!dbConfigured()) return;
  await (await collection<RegistrationDoc>("registrations")).updateOne({ reference }, { $set: { razorpayOrderId: orderId } });
}

/**
 * Idempotent: only the first caller (checkout verification or webhook) flips
 * the status and counts the entries against capacity.
 */
export async function markPaid(orderId: string, paymentId: string): Promise<RegistrationDoc | null> {
  if (!dbConfigured()) return null;
  const col = await collection<RegistrationDoc>("registrations");
  const updated = await col.findOneAndUpdate(
    { razorpayOrderId: orderId, status: { $ne: "paid" } },
    { $set: { status: "paid", paymentId, paidAt: new Date() } },
    { returnDocument: "after" },
  );
  if (updated) await addRegistered(updated.tournamentSlug, updated.events.length);
  return updated;
}

export async function listRegistrations(filter: { tournament?: string; status?: RegistrationStatus } = {}) {
  const query: Filter<RegistrationDoc> = {};
  if (filter.tournament) query.tournamentSlug = filter.tournament;
  if (filter.status) query.status = filter.status;
  return (await collection<RegistrationDoc>("registrations")).find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(2000).toArray();
}

export async function registrationStats() {
  const col = await collection<RegistrationDoc>("registrations");
  const [row] = await col
    .aggregate<{ paid: number; pending: number; revenue: number }>([
      {
        $group: {
          _id: null,
          paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending_payment"] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] } },
        },
      },
    ])
    .toArray();
  return row ?? { paid: 0, pending: 0, revenue: 0 };
}
