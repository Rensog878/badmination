import { NextResponse } from "next/server";
import { markPaid } from "@/lib/data/registrations";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook: the source of truth for payment state (Checkout callbacks
 * can be lost if the tab closes). Verifies X-Razorpay-Signature over the raw body.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const raw = await request.text();
  if (!signature || !verifyWebhookSignature(secret, raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      if (payment?.order_id && payment.id) await markPaid(payment.order_id, payment.id);
      console.info(`[razorpay] ${event.event} ${payment?.id ?? ""} ref=${payment?.notes?.reference ?? "?"}`);
      break;
    case "payment.failed":
      console.info(`[razorpay] payment.failed ${payment?.id ?? ""} ref=${payment?.notes?.reference ?? "?"}`);
      break;
    default:
      break;
  }
  // Always 2xx for verified events so Razorpay doesn't retry handled/ignored types.
  return NextResponse.json({ received: true });
}
