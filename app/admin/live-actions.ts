"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { adminOrError } from "@/lib/admin/guard";
import { findTournament } from "@/lib/data/tournaments";
import { addMatch, ensureFeed, removeMatch } from "@/lib/live/store";
import { eventLabel } from "@/lib/tournaments";

/** "A. Rao / K. Iyer" → ["A. Rao", "K. Iyer"] */
const names = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 40));

export async function addMatchAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const t = await findTournament(String(fd.get("slug") ?? ""));
  if (!t) return { error: "Tournament not found." };
  const event = t.events.map(eventLabel).find((label) => label === fd.get("event"));
  const round = String(fd.get("round") ?? "").trim().slice(0, 40);
  const a = names(fd.get("a"));
  const b = names(fd.get("b"));
  const players = event?.endsWith("Singles") ? 1 : 2;
  const fieldErrors: Record<string, string> = {};
  if (!event) fieldErrors.event = "Choose an event";
  if (round.length < 2) fieldErrors.round = "e.g. Quarter-final";
  if (a.length !== players) fieldErrors.a = players === 1 ? "One name" : "Two names separated by /";
  if (b.length !== players) fieldErrors.b = players === 1 ? "One name" : "Two names separated by /";
  if (Object.keys(fieldErrors).length || !event) return { fieldErrors, error: "Check the highlighted fields." };
  await ensureFeed(t);
  addMatch(t, { event, round, a, b });
  revalidatePath("/admin/live");
  return { ok: "Match added to the queue. Umpires can start it from the console." };
}

export async function removeMatchAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const t = await findTournament(String(fd.get("slug") ?? ""));
  if (!t) return;
  await ensureFeed(t);
  removeMatch(t, String(fd.get("id") ?? ""));
  revalidatePath("/admin/live");
}
