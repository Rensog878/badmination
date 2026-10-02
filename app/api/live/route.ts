import { listTournaments } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";
import { stripMatches, type LiveStripMatch } from "@/lib/live/summary";

/**
 * Matches in play across all tournaments, for the home page "Live now" strip.
 * Polled (the strip links to the SSE scoreboard for real-time detail). Empty
 * list when nothing is live, so the strip stays hidden.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const now = Date.now();
  const matches: LiveStripMatch[] = [];
  try {
    for (const t of await listTournaments()) {
      if (!liveAvailable(t, now).available) continue;
      await ensureFeed(t);
      matches.push(...stripMatches(getSnapshot(t), t.name));
    }
  } catch (e) {
    console.error("[live] strip summary failed", e);
  }
  return Response.json({ matches }, { headers: { "Cache-Control": "no-store" } });
}
