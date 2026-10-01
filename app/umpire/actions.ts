"use server";

import { redirect } from "next/navigation";
import { liveAvailable, umpireScore, umpireStart, umpireUndo, type UmpireResult } from "@/lib/live/store";
import type { Side } from "@/lib/live/scoring";
import { getTournament } from "@/lib/tournaments";
import { checkPasscode, endUmpireSession, isUmpire, startUmpireSession } from "@/lib/umpire-auth";

const FAILED_LOGIN_DELAY_MS = 600; // slows guessing; real rate limiting arrives with Phase 15

export async function loginUmpire(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!checkPasscode(passcode)) {
    await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY_MS));
    return { error: "That passcode isn't right." };
  }
  await startUmpireSession();
  // Only redirect within the umpire area.
  redirect(/^\/umpire\/[a-z0-9-]+(\/[a-z0-9]+)?$/.test(next) ? next : "/");
}

export async function logoutUmpire(formData: FormData) {
  await endUmpireSession();
  const slug = String(formData.get("slug") ?? "");
  redirect(/^[a-z0-9-]+$/.test(slug) ? `/umpire/${slug}` : "/");
}

async function guard(slug: string): Promise<{ error: string } | { t: NonNullable<ReturnType<typeof getTournament>> }> {
  if (!(await isUmpire())) return { error: "Your umpire session has expired. Sign in again." };
  const t = getTournament(slug);
  if (!t || !liveAvailable(t, Date.now()).available) return { error: "Live scoring isn't open for this tournament." };
  return { t };
}

const isSide = (v: unknown): v is Side => v === "a" || v === "b";

export async function scoreRally(slug: string, matchId: string, side: Side): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  if (!isSide(side)) return { ok: false, error: "Invalid side." };
  return umpireScore(g.t, matchId, side);
}

export async function undoRally(slug: string, matchId: string): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  return umpireUndo(g.t, matchId);
}

export async function startMatch(slug: string, matchId: string): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  return umpireStart(g.t, matchId);
}
