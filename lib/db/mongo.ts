import "server-only";
import { MongoClient, type Collection, type Db, type Document } from "mongodb";

/**
 * MongoDB Atlas connection. One client per process (cached on globalThis so
 * dev hot reloads don't leak connections). Indexes are ensured once per process.
 * Without MONGODB_URI the app runs on built-in fixtures (see lib/data/*).
 */

const DEFAULT_DB = "badminton";

const g = globalThis as typeof globalThis & {
  __mongo?: { client: MongoClient; ready: Promise<Db> };
};

export const dbConfigured = () => Boolean(process.env.MONGODB_URI);

export function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!g.__mongo) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10, // Atlas M0 allows 500 connections in total
      serverSelectionTimeoutMS: 8000,
      appName: "badminton-site",
    });
    const ready = client.connect().then(async (c) => {
      const db = c.db(process.env.MONGODB_DB ?? DEFAULT_DB);
      await ensureIndexes(db);
      return db;
    });
    // Let a failed first connection be retried on the next call.
    ready.catch(() => {
      g.__mongo = undefined;
    });
    g.__mongo = { client, ready };
  }
  return g.__mongo.ready;
}

/**
 * During `next build`, a database hiccup must not fail the whole deploy: pages
 * are pre-rendered without DB content and regenerated on the first request /
 * hourly revalidation. At runtime errors propagate as usual.
 */
export async function buildSafe<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error;
    console.warn("[db] unavailable during build; continuing without DB content:", (error as Error).message);
    return fallback;
  }
}

export async function collection<T extends Document>(name: CollectionName): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

export type CollectionName =
  | "users"
  | "sessions"
  | "loginAttempts"
  | "tournaments"
  | "registrations"
  | "liveFeeds"
  | "media"
  | "testimonials";

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("loginAttempts").createIndex({ key: 1, at: -1 }),
    db.collection("loginAttempts").createIndex({ at: 1 }, { expireAfterSeconds: 15 * 60 }),
    db.collection("tournaments").createIndex({ slug: 1 }, { unique: true }),
    db.collection("tournaments").createIndex({ startDate: 1 }),
    db.collection("registrations").createIndex({ reference: 1 }, { unique: true }),
    db.collection("registrations").createIndex({ razorpayOrderId: 1 }, { sparse: true }),
    db.collection("registrations").createIndex({ tournamentSlug: 1, createdAt: -1 }),
    db.collection("liveFeeds").createIndex({ slug: 1 }, { unique: true }),
    db.collection("media").createIndex({ createdAt: -1 }),
    db.collection("testimonials").createIndex({ createdAt: -1 }),
  ]);
}
