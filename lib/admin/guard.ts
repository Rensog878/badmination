import "server-only";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/** For server actions: never trust that the page-level guard ran. */
export async function adminOrError(): Promise<{ user: SessionUser } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Sign in again." };
  if (user.role !== "admin") return { error: "Only admins can do that." };
  return { user };
}

/** Only allow same-site relative redirects (no `//evil.com`). */
export const safeNext = (next: unknown, fallback = "/admin") =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
