import { dayStart, describeTournament, getTournament, TOURNAMENTS } from "@/lib/tournaments";

/** Static .ics per tournament (no personal data), so "Add to calendar" works everywhere. */
export const dynamicParams = false;

export function generateStaticParams() {
  return TOURNAMENTS.map((t) => ({ slug: t.slug }));
}

const DAY_MS = 86_400_000;
const icsDate = (ms: number) => new Date(ms).toISOString().slice(0, 10).replaceAll("-", "");
/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = getTournament((await params).slug);
  if (!t) return new Response("Not found", { status: 404 });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//badminton-coaching//tournaments//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${t.slug}@badminton-coaching`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    // All-day event; DTEND is exclusive.
    `DTSTART;VALUE=DATE:${icsDate(dayStart(t.startDate))}`,
    `DTEND;VALUE=DATE:${icsDate(dayStart(t.endDate) + DAY_MS)}`,
    `SUMMARY:${esc(t.name)}`,
    `LOCATION:${esc(`${t.venue}, ${t.city}`)}`,
    `DESCRIPTION:${esc(describeTournament(t))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t.slug}.ics"`,
    },
  });
}
