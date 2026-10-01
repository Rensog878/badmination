import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { collection, dbConfigured } from "@/lib/db/mongo";

/**
 * Accounts and sessions (MongoDB). The cookie holds a random token; the DB
 * stores only its SHA-256, so a leaked database can't be replayed as sessions.
 */

export type Role = "admin" | "umpire";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: Date;
}

interface SessionDoc {
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const COOKIE = "sid";
const SESSION_DAYS = 7;
const MAX_FAILURES = 5; // per email+IP per 15 minutes (TTL on loginAttempts)
const FAILURE_WINDOW_MS = 15 * 60_000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const normaliseEmail = (email: string) => email.trim().toLowerCase();

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export type LoginResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function login(emailInput: string, password: string): Promise<LoginResult> {
  if (!dbConfigured()) return { ok: false, error: "Accounts need the database (MONGODB_URI) to be configured." };
  const email = normaliseEmail(emailInput);
  const key = `${email}|${await clientIp()}`;
  const attempts = await collection<{ key: string; at: Date }>("loginAttempts");
  const recent = await attempts.countDocuments({ key, at: { $gt: new Date(Date.now() - FAILURE_WINDOW_MS) } });
  if (recent >= MAX_FAILURES) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };

  const users = await collection<UserDoc>("users");
  const user = await users.findOne({ email });
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await attempts.insertOne({ key, at: new Date() });
    return { ok: false, error: "Email or password is incorrect." };
  }
  await attempts.deleteMany({ key });

  const token = randomBytes(32).toString("base64url");
  const sessions = await collection<SessionDoc>("sessions");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sessions.insertOne({ tokenHash: sha256(token), userId: user._id, expiresAt, createdAt: new Date() });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true, user: toSessionUser(user) };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && dbConfigured()) await (await collection<SessionDoc>("sessions")).deleteOne({ tokenHash: sha256(token) });
  jar.delete(COOKIE);
}

/** Current user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!dbConfigured()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await (await collection<SessionDoc>("sessions")).findOne({
    tokenHash: sha256(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const user = await (await collection<UserDoc>("users")).findOne({ _id: session.userId });
  return user ? toSessionUser(user) : null;
});

const toSessionUser = (u: UserDoc): SessionUser => ({ id: u._id.toHexString(), email: u.email, name: u.name, role: u.role });

export const canScore = (u: SessionUser | null) => u?.role === "admin" || u?.role === "umpire";

/** For pages: redirects to sign-in when the role isn't met. */
export async function requireRole(role: Role, next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (role === "admin" && user.role !== "admin") redirect("/admin/login?denied=1");
  return user;
}

export async function createUser(input: { email: string; name: string; role: Role; password: string }): Promise<void> {
  const users = await collection<Omit<UserDoc, "_id">>("users");
  await users.insertOne({
    email: normaliseEmail(input.email),
    name: input.name.trim(),
    role: input.role,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date(),
  });
}

export async function deleteUser(id: string): Promise<void> {
  const _id = new ObjectId(id);
  await (await collection<UserDoc>("users")).deleteOne({ _id });
  await (await collection<SessionDoc>("sessions")).deleteMany({ userId: _id });
}

export async function listUsers(): Promise<SessionUser[]> {
  const users = await (await collection<UserDoc>("users")).find().sort({ createdAt: 1 }).toArray();
  return users.map(toSessionUser);
}

// Valid-format hash of a random secret, used to equalise timing for unknown emails.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64, 7).toString("base64");
