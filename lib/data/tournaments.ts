import "server-only";
import { cache } from "react";
import { collection, dbConfigured } from "@/lib/db/mongo";
import { dayStart, SAMPLE_TOURNAMENTS, type Tournament } from "@/lib/tournaments";

/**
 * Tournament repository. MongoDB when MONGODB_URI is set; otherwise the
 * built-in sample fixtures so the site still runs in development.
 */

const byStart = (a: Tournament, b: Tournament) => dayStart(a.startDate) - dayStart(b.startDate);

export const listTournaments = cache(async (): Promise<Tournament[]> => {
  if (!dbConfigured()) return [...SAMPLE_TOURNAMENTS].sort(byStart);
  const col = await collection<Tournament>("tournaments");
  return col.find({}, { projection: { _id: 0 } }).sort({ startDate: 1 }).toArray();
});

export const findTournament = cache(async (slug: string): Promise<Tournament | undefined> => {
  if (!dbConfigured()) return SAMPLE_TOURNAMENTS.find((t) => t.slug === slug);
  const col = await collection<Tournament>("tournaments");
  return (await col.findOne({ slug }, { projection: { _id: 0 } })) ?? undefined;
});

/** Insert or replace. `previousSlug` lets an admin rename a tournament. */
export async function saveTournament(t: Tournament, previousSlug?: string): Promise<void> {
  const col = await collection<Tournament>("tournaments");
  await col.replaceOne({ slug: previousSlug ?? t.slug }, t, { upsert: true });
}

export async function deleteTournament(slug: string): Promise<void> {
  const col = await collection<Tournament>("tournaments");
  await col.deleteOne({ slug });
}

/** Atomically counts paid entries against capacity (one document per event entered). */
export async function addRegistered(slug: string, entries: number): Promise<void> {
  if (!dbConfigured()) return;
  const col = await collection<Tournament>("tournaments");
  await col.updateOne({ slug }, { $inc: { registered: entries } });
}

/** One-off import of the sample fixtures into an empty database (admin action). */
export async function importSampleTournaments(): Promise<number> {
  const col = await collection<Tournament>("tournaments");
  if ((await col.countDocuments()) > 0) return 0;
  await col.insertMany(SAMPLE_TOURNAMENTS.map((t) => ({ ...t, registered: 0 })));
  return SAMPLE_TOURNAMENTS.length;
}
