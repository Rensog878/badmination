import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { canScore, getCurrentUser } from "@/lib/auth/session";
import { dbConfigured } from "@/lib/db/mongo";

/**
 * Umpire access. With the database configured, umpires and admins sign in with
 * their accounts (lib/auth/session). Without it (local demos), a shared passcode
 * from UMPIRE_TOKEN is exchanged for an httpOnly HMAC cookie.
 */

const COOKIE = "umpire_session";
const SESSION_HOURS = 12;

export const usesAccounts = () => dbConfigured();
export const umpireEnabled = () => usesAccounts() || Boolean(process.env.UMPIRE_TOKEN);

const digest = (value: string) => createHash("sha256").update(value).digest();

function sessionValue(token: string) {
  return createHmac("sha256", token).update("umpire-session-v1").digest("hex");
}

export function checkPasscode(input: string): boolean {
  const token = process.env.UMPIRE_TOKEN;
  if (usesAccounts()) return false;
  if (!token) return false;
  // Compare fixed-length digests so timing doesn't leak length or content.
  return timingSafeEqual(digest(input), digest(token));
}

export async function isUmpire(): Promise<boolean> {
  if (usesAccounts()) return canScore(await getCurrentUser());
  const token = process.env.UMPIRE_TOKEN;
  if (!token) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(sessionValue(token));
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function startUmpireSession() {
  const token = process.env.UMPIRE_TOKEN;
  if (!token) return;
  (await cookies()).set(COOKIE, sessionValue(token), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/umpire",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endUmpireSession() {
  (await cookies()).delete({ name: COOKIE, path: "/umpire" });
}
