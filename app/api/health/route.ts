/**
 * Liveness check for Render's health checks and uptime monitors (keeps the free
 * instance awake). Deliberately cheap: no database call, no page render.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
