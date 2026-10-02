"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { adminOrError } from "@/lib/admin/guard";
import { findTournament } from "@/lib/data/tournaments";
import {
  addMatch,
  clearMatches,
  editMatch,
  ensureFeed,
  removeMatch,
  seedTournamentDraw,
} from "@/lib/live/store";
import type { LiveMatch } from "@/lib/live/types";
import type { GameScore, Side } from "@/lib/live/scoring";
import { eventLabel } from "@/lib/tournaments";

/** "A. Rao / K. Iyer" → ["A. Rao", "K. Iyer"] */
const names = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 40));

function parseGames(fd: FormData): GameScore[] {
  const games: GameScore[] = [];
  for (let i = 1; i <= 3; i++) {
    const rawA = fd.get(`g${i}_a`);
    const rawB = fd.get(`g${i}_b`);
    if (rawA !== null && rawB !== null && String(rawA).trim() !== "" && String(rawB).trim() !== "") {
      const a = parseInt(String(rawA), 10);
      const b = parseInt(String(rawB), 10);
      if (!isNaN(a) && !isNaN(b)) {
        games.push({ a, b });
      }
    }
  }
  return games;
}

function revalidateAll(slug: string) {
  revalidatePath("/admin/live");
  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/tournaments/${slug}/live`);
  revalidatePath("/live");
  revalidatePath("/");
}

export async function addMatchAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const slug = String(fd.get("slug") ?? "");
  const t = await findTournament(slug);
  if (!t) return { error: "Tournament not found." };
  const event = String(fd.get("event") ?? "").trim() || t.events.map(eventLabel)[0];
  const round = String(fd.get("round") ?? "").trim().slice(0, 40);
  const a = names(fd.get("a"));
  const b = names(fd.get("b"));
  const courtRaw = fd.get("court");
  const court = courtRaw && String(courtRaw) !== "none" ? parseInt(String(courtRaw), 10) : null;
  const status = (String(fd.get("status") ?? "scheduled") as LiveMatch["status"]) || "scheduled";
  const games = parseGames(fd);
  const winnerRaw = fd.get("winner");
  const winner = winnerRaw === "a" || winnerRaw === "b" ? (winnerRaw as Side) : null;

  const fieldErrors: Record<string, string> = {};
  if (!event) fieldErrors.event = "Choose an event";
  if (round.length < 2) fieldErrors.round = "e.g. Quarter-final";
  if (a.length === 0) fieldErrors.a = "Enter at least one player";
  if (b.length === 0) fieldErrors.b = "Enter at least one player";
  if (Object.keys(fieldErrors).length || !event) return { fieldErrors, error: "Check the highlighted fields." };

  await ensureFeed(t, { forceReal: true });
  addMatch(t, {
    event,
    round,
    a,
    b,
    court: isNaN(court as number) ? null : court,
    status,
    games,
    winner,
  });
  revalidateAll(slug);
  return { ok: "Match successfully added." };
}

export async function editMatchAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const slug = String(fd.get("slug") ?? "");
  const t = await findTournament(slug);
  if (!t) return { error: "Tournament not found." };
  const id = String(fd.get("id") ?? "");
  if (!id) return { error: "Missing match ID." };

  const event = String(fd.get("event") ?? "").trim();
  const round = String(fd.get("round") ?? "").trim().slice(0, 40);
  const a = names(fd.get("a"));
  const b = names(fd.get("b"));
  const courtRaw = fd.get("court");
  const court = courtRaw && String(courtRaw) !== "none" ? parseInt(String(courtRaw), 10) : null;
  const status = String(fd.get("status") ?? "scheduled") as LiveMatch["status"];
  const games = parseGames(fd);
  const winnerRaw = fd.get("winner");
  const winner = winnerRaw === "a" || winnerRaw === "b" ? (winnerRaw as Side) : null;

  await ensureFeed(t, { forceReal: true });
  const updated = editMatch(t, {
    id,
    event: event || undefined,
    round: round || undefined,
    a: a.length > 0 ? a : undefined,
    b: b.length > 0 ? b : undefined,
    court: isNaN(court as number) ? null : court,
    status,
    games,
    winner,
  });

  if (!updated) return { error: "Match not found or could not be updated." };
  revalidateAll(slug);
  return { ok: "Match updated successfully." };
}

export async function removeMatchAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  const t = await findTournament(slug);
  if (!t) return;
  await ensureFeed(t, { forceReal: true });
  removeMatch(t, String(fd.get("id") ?? ""));
  revalidateAll(slug);
}

export async function seedDrawAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  const category = (String(fd.get("category") ?? "singles") as "singles" | "doubles") || "singles";
  const t = await findTournament(slug);
  if (!t) return;
  await ensureFeed(t, { forceReal: true });
  seedTournamentDraw(t, category);
  revalidateAll(slug);
}

export async function clearAllMatchesAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  const t = await findTournament(slug);
  if (!t) return;
  await ensureFeed(t, { forceReal: true });
  clearMatches(t);
  revalidateAll(slug);
}

export async function quickStartMatchAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  const id = String(fd.get("id") ?? "");
  const t = await findTournament(slug);
  if (!t) return;
  await ensureFeed(t, { forceReal: true });
  editMatch(t, {
    id,
    status: "live",
    court: 1,
    games: [{ a: 0, b: 0 }],
  });
  revalidateAll(slug);
}

export async function quickFinishMatchAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const slug = String(fd.get("slug") ?? "");
  const id = String(fd.get("id") ?? "");
  const t = await findTournament(slug);
  if (!t) return;
  await ensureFeed(t, { forceReal: true });
  editMatch(t, {
    id,
    status: "finished",
  });
  revalidateAll(slug);
}
