import { ensureFeed, getSnapshot, liveAvailable, subscribe } from "@/lib/live/store";
import { findTournament } from "@/lib/data/tournaments";
import type { LiveSnapshot } from "@/lib/live/types";

/**
 * Server-Sent Events stream of a tournament's live snapshot. Sends the full
 * snapshot on connect and on every change (payloads are small), plus a
 * heartbeat so proxies keep the connection open. EventSource reconnects itself.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 15_000;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await findTournament((await params).slug);
  if (!t) return new Response("Not found", { status: 404 });
  await ensureFeed(t);
  if (!liveAvailable(t, Date.now()).available) return new Response("Live coverage is not running", { status: 404 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (snapshot: LiveSnapshot) => {
        try {
          controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
        } catch {
          cleanup();
        }
      };
      send(getSnapshot(t));
      const unsubscribe = subscribe(t, send);
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
