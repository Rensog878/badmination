import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Razorpay server client (REST via fetch, no SDK). Secrets never leave
 * the server; only the public key id is sent to the browser.
 * Docs: https://razorpay.com/docs/api/orders/ and payment signature verification.
 */

const API = "https://api.razorpay.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/** `null` when keys are not configured; the UI then explains payment is unavailable. */
export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
}

async function request<T>(config: RazorpayConfig, path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    // Log the gateway's reason server-side only; callers show a generic message.
    console.error(`[razorpay] ${init?.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`);
    throw new Error(`Razorpay request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/** Amount in paise (₹1 = 100). Receipt max 40 chars; notes max 15 keys of 256 chars. */
export function createOrder(
  config: RazorpayConfig,
  input: { amountPaise: number; receipt: string; notes: Record<string, string> },
): Promise<RazorpayOrder> {
  return request<RazorpayOrder>(config, "/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
  });
}

export function fetchOrder(config: RazorpayConfig, orderId: string): Promise<RazorpayOrder> {
  return request<RazorpayOrder>(config, `/orders/${encodeURIComponent(orderId)}`);
}

function safeEqualHex(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout success signature: HMAC-SHA256(`${order_id}|${payment_id}`, key_secret). */
export function verifyPaymentSignature(
  secret: string,
  input: { orderId: string; paymentId: string; signature: string },
): boolean {
  const expected = createHmac("sha256", secret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  return safeEqualHex(expected, input.signature);
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook_secret), header X-Razorpay-Signature. */
export function verifyWebhookSignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
