import { getCurrentUser } from "@/lib/auth/session";
import { listRegistrations, type RegistrationStatus } from "@/lib/data/registrations";

export const dynamic = "force-dynamic";

/** Quote every cell and neutralise spreadsheet formulas (CSV injection). */
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const HEADER = [
  "Reference", "Tournament", "Status", "Total (INR)", "Player", "Date of birth", "Gender", "Email", "Phone", "City",
  "Club", "Events", "Partners", "Emergency contact", "Emergency phone", "Guardian", "Media consent", "Payment ID",
  "Created", "Paid",
];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const rows = await listRegistrations({
    tournament: url.searchParams.get("tournament") || undefined,
    status: status === "paid" || status === "pending_payment" ? (status as RegistrationStatus) : undefined,
  });

  const lines = rows.map((r) =>
    [
      r.reference, r.tournamentName, r.status, r.total, r.player.fullName, r.player.dateOfBirth, r.player.gender,
      r.player.email, r.player.phone, r.player.city, r.player.club, r.events.join("; "),
      Object.entries(r.partners).map(([k, v]) => `${k}: ${v}`).join("; "),
      r.emergency.name, r.emergency.phone, r.guardianName, r.mediaConsent ? "yes" : "no", r.paymentId ?? "",
      r.createdAt.toISOString(), r.paidAt?.toISOString() ?? "",
    ]
      .map(cell)
      .join(","),
  );
  // BOM so Excel opens UTF-8 (₹, names) correctly.
  const csv = "﻿" + [HEADER.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
