import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Interim umpire access (until Phase 15 adds real accounts): a shared passcode
 * from UMPIRE_TOKEN, exchanged for an httpOnly cookie holding an HMAC derived
 * from it. Rotating UMPIRE_TOKEN signs everyone out.
 */

const COOKIE = "umpire_session";
const SESSION_HOURS = 12;

export const umpireEnabled = () => Boolean(process.env.UMPIRE_TOKEN);

const digest = (value: string) => createHash("sha256").update(value).digest();

function sessionValue(token: string) {
  return createHmac("sha256", token).update("umpire-session-v1").digest("hex");
}

export function checkPasscode(input: string): boolean {
  const token = process.env.UMPIRE_TOKEN;
  if (!token) return false;
  // Compare fixed-length digests so timing doesn't leak length or content.
  return timingSafeEqual(digest(input), digest(token));
}

export async function isUmpire(): Promise<boolean> {
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
