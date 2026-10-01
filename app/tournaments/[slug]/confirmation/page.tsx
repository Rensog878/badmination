import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, CircleCheck, Clock } from "lucide-react";
import PrintButton from "@/components/registration/PrintButton";
import { SITE, TRIAL } from "@/lib/content";
import {
  fetchOrder,
  fetchOrderPayments,
  getRazorpayConfig,
  isOrderId,
  RazorpayError,
  type RazorpayOrder,
  type RazorpayPayment,
} from "@/lib/razorpay";
import { eventKey } from "@/lib/registration";
import { eventLabel, formatInr, formatRange, getTournament, mapsUrl, type Tournament } from "@/lib/tournaments";

export const metadata: Metadata = { title: `Entry confirmation | ${SITE.title}`, robots: { index: false, follow: false } };

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

const NEXT_STEPS = [
  // TODO(Phase 15): add "A confirmation email has been sent…" once email sending exists.
  "Keep this page (bookmark, print or save as PDF): it is your receipt.",
  "The draw and match times are published on the tournament page about 3 days before play.",
  "Bring photo ID and proof of age to the control desk 30 minutes before your first match.",
];

/** j***@example.com */
function maskEmail(email: string | undefined | null): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  return domain ? `${user.slice(0, 1)}***@${domain}` : "—";
}

/** "u15-singles, u15-doubles" (order notes) → "U15 Singles · U15 Doubles". */
function eventNames(t: Tournament, keys: string | undefined): string {
  if (!keys) return "—";
  return keys
    .split(",")
    .map((k) => k.trim())
    .map((k) => {
      const e = t.events.find((ev) => eventKey(ev) === k);
      return e ? eventLabel(e) : k;
    })
    .join(" · ");
}

type Lookup =
  | { kind: "ok"; order: RazorpayOrder; payment: RazorpayPayment | undefined }
  | { kind: "unavailable" }
  | { kind: "missing" }
  | { kind: "error" };

async function lookup(orderId: string): Promise<Lookup> {
  const config = getRazorpayConfig();
  if (!config) return { kind: "unavailable" };
  try {
    const [order, payments] = await Promise.all([fetchOrder(config, orderId), fetchOrderPayments(config, orderId)]);
    const payment = payments.find((p) => p.status === "captured") ?? payments.find((p) => p.status === "authorized");
    return { kind: "ok", order, payment };
  } catch (error) {
    // Razorpay answers 400/404 for ids that don't exist on this account.
    if (error instanceof RazorpayError && (error.status === 400 || error.status === 404)) return { kind: "missing" };
    return { kind: "error" };
  }
}

/**
 * Server-verified receipt: everything shown comes from Razorpay's copy of the
 * order (looked up by order id), never from query parameters.
 */
export default async function ConfirmationPage({ params, searchParams }: PageProps) {
  const t = getTournament((await params).slug);
  if (!t) notFound();
  const orderParam = (await searchParams).order;
  const orderId = Array.isArray(orderParam) ? orderParam[0] : orderParam;
  if (!isOrderId(orderId)) notFound();

  const result = await lookup(orderId);
  // Unknown orders, and orders from another tournament, must not render under this URL.
  if (result.kind === "missing") notFound();
  if (result.kind === "ok" && result.order.notes.tournament !== t.slug) notFound();

  const paid = result.kind === "ok" && (result.order.status === "paid" || result.payment?.status === "captured");

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 print:bg-white print:pt-0 print:text-black lg:pt-36">
      <div className="mx-auto max-w-3xl px-4 sm:px-8">
        {result.kind !== "ok" ? (
          <section className="border border-off-white/15 p-8">
            <h1 className="font-display text-3xl font-bold uppercase">Confirmation unavailable</h1>
            <p className="mt-4 text-muted">
              {result.kind === "unavailable"
                ? "Online payments aren't configured, so there's no payment to confirm."
                : "We couldn't reach the payment provider. Refresh in a moment; if you were charged, your entry is safe."}
            </p>
            <Link href={`/tournaments/${t.slug}`} className="mt-6 inline-block text-court-green underline underline-offset-4">
              Back to {t.name}
            </Link>
          </section>
        ) : (
          <article aria-labelledby="confirmation-heading">
            <header className="text-center">
              {paid ? (
                <CircleCheck aria-hidden="true" className="mx-auto size-14 text-court-green print:text-black" />
              ) : (
                <Clock aria-hidden="true" className="mx-auto size-14 text-muted" />
              )}
              <p className="mt-6 font-display text-xs tracking-[0.32em] text-court-green uppercase print:text-black">
                {paid ? "You're in the draw" : "Payment processing"}
              </p>
              <h1
                id="confirmation-heading"
                className="mt-4 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9] font-bold tracking-[-0.03em] uppercase"
              >
                {paid ? "Entry confirmed" : "Almost there"}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-muted print:text-black">
                {paid
                  ? `See you on court at ${t.name}.`
                  : "We haven't received the payment confirmation yet. This usually takes under a minute; refresh this page."}
              </p>
            </header>

            <section aria-label="Receipt" className="mt-12 border border-off-white/15 bg-black print:border-black print:bg-white">
              <div className="flex items-center justify-between border-b border-off-white/10 px-6 py-5 print:border-black">
                <div>
                  <p className="font-display text-[0.65rem] tracking-[0.25em] text-muted uppercase print:text-black">Reference</p>
                  <p className="font-display text-2xl font-bold">{result.order.notes.reference ?? result.order.receipt}</p>
                </div>
                <p className={`font-display text-xs font-semibold tracking-[0.2em] uppercase ${paid ? "text-court-green print:text-black" : "text-muted"}`}>
                  {paid ? "Paid" : "Pending"}
                </p>
              </div>
              <dl className="divide-y divide-off-white/10 px-6 print:divide-black/20">
                {[
                  { label: "Tournament", value: t.name },
                  { label: "Dates", value: formatRange(t.startDate, t.endDate) },
                  { label: "Venue", value: `${t.venue}, ${t.city}` },
                  { label: "Player", value: result.order.notes.player ?? "—" },
                  { label: "Events", value: eventNames(t, result.order.notes.events) },
                  { label: "Email", value: maskEmail(result.order.notes.email ?? result.payment?.email) },
                  { label: "Amount", value: formatInr(result.order.amount / 100) },
                  ...(result.payment
                    ? [
                        { label: "Payment ID", value: result.payment.id },
                        { label: "Method", value: result.payment.method.toUpperCase() },
                      ]
                    : []),
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3.5 text-sm">
                    <dt className="text-muted print:text-black/70">{row.label}</dt>
                    <dd className="break-words">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
              <a
                href={`/tournaments/${t.slug}/calendar`}
                className="inline-flex items-center justify-center gap-2 bg-court-green px-6 py-3.5 font-display text-xs font-semibold tracking-[0.16em] text-black uppercase hover:bg-off-white"
              >
                <CalendarPlus aria-hidden="true" className="size-4" />
                Add to calendar
              </a>
              <PrintButton className="inline-flex items-center justify-center gap-2 border border-off-white/20 px-6 py-3.5 font-display text-xs font-semibold tracking-[0.16em] uppercase hover:border-court-green hover:text-court-green" />
              <a
                href={mapsUrl(t)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 font-display text-xs font-semibold tracking-[0.16em] text-muted uppercase hover:text-off-white"
              >
                Directions<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            {paid && (
              <section aria-labelledby="next-heading" className="mt-14">
                <h2 id="next-heading" className="font-display text-xs font-medium tracking-[0.32em] text-muted uppercase print:text-black">
                  What happens next
                </h2>
                <ol className="mt-4 space-y-4">
                  {NEXT_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-4">
                      <span className="font-display text-sm font-semibold text-court-green print:text-black">{String(i + 1).padStart(2, "0")}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <p className="mt-14 text-sm text-muted print:text-black">
              Questions? Email{" "}
              <a href={`mailto:${TRIAL.email}`} className="text-court-green underline underline-offset-4 print:text-black">
                {TRIAL.email}
              </a>{" "}
              with your reference.
            </p>
          </article>
        )}
      </div>
    </main>
  );
}
