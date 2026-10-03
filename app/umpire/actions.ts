"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findTournament } from "@/lib/data/tournaments";
import { editMatch, ensureFeed, flushFeed, umpireScore, umpireStart, umpireUndo, type UmpireResult } from "@/lib/live/store";
import type { Side } from "@/lib/live/scoring";
import type { Tournament } from "@/lib/tournaments";
import { logout } from "@/lib/auth/session";
import { checkPasscode, endUmpireSession, isUmpire, startUmpireSession, usesAccounts } from "@/lib/umpire-auth";

const FAILED_LOGIN_DELAY_MS = 600; // passcode mode only; accounts have DB-backed rate limiting

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
  if (usesAccounts()) await logout();
  else await endUmpireSession();
  const slug = String(formData.get("slug") ?? "");
  redirect(/^[a-z0-9-]+$/.test(slug) ? `/umpire/${slug}` : "/");
}

async function guard(slug: string): Promise<{ error: string } | { t: Tournament }> {
  if (!(await isUmpire())) return { error: "Your umpire session has expired. Sign in again." };
  const t = await findTournament(slug);
  if (!t) return { error: "Tournament not found." };
  await ensureFeed(t, { forceReal: true });
  return { t };
}

const isSide = (v: unknown): v is Side => v === "a" || v === "b";

export async function scoreRally(slug: string, matchId: string, side: Side): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  if (!isSide(side)) return { ok: false, error: "Invalid side." };
  const res = umpireScore(g.t, matchId, side);
  if (res.ok && res.match.status === "finished") {
    await flushFeed(g.t);
    revalidatePath(`/umpire/${slug}`);
    revalidatePath(`/tournaments/${slug}/live`);
  }
  return res;
}

export async function undoRally(slug: string, matchId: string): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  return umpireUndo(g.t, matchId);
}

export async function startMatch(slug: string, matchId: string): Promise<UmpireResult> {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  const res = umpireStart(g.t, matchId);
  if (res.ok) {
    await flushFeed(g.t);
    revalidatePath(`/umpire/${slug}`);
    revalidatePath(`/umpire/${slug}/${matchId}`);
    revalidatePath(`/tournaments/${slug}/live`);
  }
  return res;
}

export async function updateCourtStreamAction(slug: string, matchId: string, streamUrl: string | null) {
  const g = await guard(slug);
  if ("error" in g) return { ok: false, error: g.error };
  const updated = editMatch(g.t, { id: matchId, streamUrl });
  if (!updated) return { ok: false, error: "Match not found" };
  await flushFeed(g.t);
  revalidatePath(`/umpire/${slug}`);
  revalidatePath(`/umpire/${slug}/${matchId}`);
  revalidatePath(`/tournaments/${slug}/live`);
  revalidatePath(`/tournaments/${slug}/live/${matchId}`);
  revalidatePath("/live");
  return { ok: true, streamUrl: updated.streamUrl };
}
