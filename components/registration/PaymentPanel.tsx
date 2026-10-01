"use client";

import { useState, useTransition } from "react";
import { CircleCheck, CreditCard, Lock } from "lucide-react";
import { FieldError } from "@/components/registration/FormField";
import { verifyPayment, type PaymentOrder } from "@/app/tournaments/[slug]/register/actions";
import { COACH_NAME } from "@/lib/content";
import { formatInr } from "@/lib/tournaments";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutPromise: Promise<void> | null = null;

/** Loads Razorpay Checkout once, on demand (no cost until the user pays). */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  checkoutPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutPromise = null;
      reject(new Error("Checkout failed to load"));
    };
    document.head.appendChild(script);
  });
  return checkoutPromise;
}

interface PaymentPanelProps {
  order: PaymentOrder;
  tournamentName: string;
  reference: string;
  prefill: { name: string; email: string; contact: string };
}

type State =
  | { kind: "idle" }
  | { kind: "opening" }
  | { kind: "failed"; message: string }
  | { kind: "verifying" }
  | { kind: "paid"; paymentId: string; amount: number };

export default function PaymentPanel({ order, tournamentName, reference, prefill }: PaymentPanelProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [, startTransition] = useTransition();

  const pay = async () => {
    setState({ kind: "opening" });
    try {
      await loadCheckout();
    } catch {
      setState({ kind: "failed", message: "The payment window couldn't load. Check your connection and try again." });
      return;
    }
    const Razorpay = window.Razorpay;
    if (!Razorpay) {
      setState({ kind: "failed", message: "The payment window couldn't load." });
      return;
    }
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: COACH_NAME,
      description: `${tournamentName} · ${reference}`,
      prefill,
      notes: { reference },
      theme: { color: "#10B981" },
      handler: (response) => {
        setState({ kind: "verifying" });
        startTransition(async () => {
          const res = await verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setState(res.ok ? { kind: "paid", paymentId: res.paymentId, amount: res.amount } : { kind: "failed", message: res.error });
        });
      },
      modal: { ondismiss: () => setState((s) => (s.kind === "opening" ? { kind: "idle" } : s)) },
    });
    checkout.on("payment.failed", (r) =>
      setState({ kind: "failed", message: `Payment failed: ${r.error.description}. You can try again.` }),
    );
    checkout.open();
  };

  if (state.kind === "paid") {
    return (
      <div role="status" className="border border-court-green/60 bg-court-green/5 p-6">
        <p className="flex items-center gap-3 font-display text-lg font-semibold uppercase">
          <CircleCheck aria-hidden="true" className="size-6 text-court-green" />
          Payment received · {formatInr(state.amount / 100)}
        </p>
        <p className="mt-2 text-sm text-muted">
          Payment ID {state.paymentId}. Your place in the draw is confirmed.
        </p>
      </div>
    );
  }

  const busy = state.kind === "opening" || state.kind === "verifying";
  return (
    <div>
      {state.kind === "failed" && (
        <div role="alert" className="mb-4">
          <FieldError message={state.message} />
        </div>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex w-full items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase transition-colors hover:bg-off-white disabled:opacity-60 sm:w-auto"
      >
        <CreditCard aria-hidden="true" className="size-4" />
        {state.kind === "verifying" ? "Confirming payment…" : state.kind === "opening" ? "Opening checkout…" : `Pay ${formatInr(order.amount / 100)}`}
      </button>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Lock aria-hidden="true" className="size-3.5" />
        Secure payment by Razorpay · UPI, cards, netbanking and wallets
      </p>
    </div>
  );
}
