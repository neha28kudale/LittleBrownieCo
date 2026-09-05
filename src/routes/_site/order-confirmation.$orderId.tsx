import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer, CheckCircle2, Clock, XCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { getOrderById, type Order } from "@/lib/orders";
import { formatDisplayDate } from "@/lib/delivery";
import { IMG } from "@/lib/products";
import { ConfettiBurst } from "@/components/site/ConfettiBurst";
import { supabase } from "@/lib/supabase";

const CASHFREE_MODE = (import.meta.env.VITE_CASHFREE_MODE as string) || "sandbox";
const MAX_VERIFY_ATTEMPTS = 6;

export const Route = createFileRoute("/_site/order-confirmation/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Confirmation — Little Brownie Co." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

function StatusPill({ order }: { order: Order }) {
  if (order.orderStatus === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Payment not verified
      </span>
    );
  }
  if (order.orderStatus === "order_confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" /> Order confirmed
      </span>
    );
  }
  if (order.paymentStatus !== "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1.5 text-xs font-medium text-cocoa">
        <Clock className="h-3.5 w-3.5" /> Awaiting payment confirmation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1.5 text-xs font-medium text-cocoa">
      <Clock className="h-3.5 w-3.5" /> Order placed
    </span>
  );
}

const TRACKER_STEPS = [
  { key: "confirmed", label: "Order confirmed" },
  { key: "baking", label: "Baking" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

function getCompletedSteps(order: Order): Record<(typeof TRACKER_STEPS)[number]["key"], boolean> {
  const stage = order.orderStatus;
  return {
    confirmed: stage !== "order_placed" && stage !== "rejected",
    baking: stage === "baking" || stage === "out_for_delivery" || stage === "delivered",
    out_for_delivery: stage === "out_for_delivery" || stage === "delivered",
    delivered: stage === "delivered",
  };
}

function OrderTracker({ order }: { order: Order }) {
  if (order.orderStatus === "rejected") return null;

  const completed = getCompletedSteps(order);

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8" data-no-print>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Order #{order.orderNumber}
      </div>
      <ol className="mt-5 space-y-5">
        {TRACKER_STEPS.map((step) => {
          const done = completed[step.key];
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className={`text-sm ${done ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Full-screen "checking your payment" state — shown instead of the receipt
 * while we don't yet know if payment succeeded, so the customer never sees
 * a receipt-looking page before we're sure. */
function CheckingPayment() {
  return (
    <section className="container-x flex flex-col items-center justify-center py-24 text-center md:py-32">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <h1 className="mt-6 font-serif text-2xl text-primary sm:text-3xl">
        Checking your payment…
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
        This usually takes just a few seconds. Please don't close this page.
      </p>
    </section>
  );
}

/** Standalone failure/timeout screen — no order details or "Paid" language,
 * since no payment actually went through. */
function PaymentNotCompleted({
  order,
  timedOut,
  onRetry,
  retrying,
}: {
  order: Order;
  timedOut: boolean;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <section className="container-x py-20 text-center md:py-28">
      <div className="mx-auto max-w-md">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-5 font-serif text-3xl text-primary sm:text-4xl">
          {timedOut ? "We couldn't confirm your payment" : "Payment Failed"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {timedOut ? (
            <>
              Cashfree hasn't confirmed this payment yet — it may still be processing on their end. This
              is <strong>not</strong> the same as a failed payment.
              <br />
              If money was debited from your account, please don't pay again. Contact us on WhatsApp with
              your name and phone number and we'll check the status for you.
            </>
          ) : (
            <>
              Something went wrong while processing your payment. Please try again or use another payment
              method.
              <br />
              If your account was charged, please contact us on WhatsApp with your name and phone number
              before making another payment.
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onRetry}
            disabled={retrying}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark disabled:opacity-50"
          >
            {retrying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Opening payment…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" /> Try payment again
              </>
            )}
          </button>

          <Link
            to="/menu"
            className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary hover:bg-caramel hover:text-cocoa"
          >
            Back to menu
          </Link>
        </div>
      </div>
    </section>
  );
}

function OrderConfirmation() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<Order | null | "loading">("loading");
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      const current = await getOrderById(orderId);
      if (cancelled) return;
      setOrder(current);

      // If we're still "pending" after the webhook should've had a chance to
      // fire, actively ask Cashfree directly — this is what catches a
      // customer hitting "back"/closing the tab without paying, since no
      // webhook is ever sent for that case and the row would otherwise sit
      // as "pending" (and misleadingly render as a normal placed order)
      // forever.
      if (current && current.paymentStatus === "pending" && attempts < MAX_VERIFY_ATTEMPTS) {
        attempts += 1;
        setVerifyAttempts(attempts);
        try {
          await supabase.functions.invoke("verify-cashfree-order", {
            body: { orderId, mode: CASHFREE_MODE },
          });
        } catch (err) {
          console.error("[order-confirmation] verify-cashfree-order", err);
        }
        if (!cancelled) setTimeout(poll, 3000);
      } else {
        setVerifyAttempts(attempts);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const retryPayment = async () => {
    if (order === "loading" || !order) return;
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        body: { orderId: order.id, mode: CASHFREE_MODE },
      });

      if (error || !data?.paymentSessionId) {
        // supabase.functions.invoke()'s `error.message` is just a generic
        // "non-2xx status code" wrapper — pull the real reason out of the
        // response body (same pattern as checkout.tsx) so the customer (and
        // our logs) see what actually went wrong instead of nothing at all.
        let detail = error?.message || "Payment gateway isn't configured yet.";
        const ctx = (error as any)?.context;
        if (ctx?.json) {
          try {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          } catch {
            // ignore — fall back to generic message
          }
        }
        throw new Error(detail);
      }

      const cashfree = (window as any).Cashfree?.({ mode: CASHFREE_MODE });
      if (!cashfree) {
        throw new Error("Payment couldn't load. Please refresh the page and try again.");
      }

      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
        returnUrl: `${window.location.origin}/order-confirmation/${order.id}`,
      });
    } catch (err) {
      console.error("[order-confirmation] retryPayment", err);
      toast.error(err instanceof Error ? err.message : "Couldn't reopen payment. Please try again.");
      setRetrying(false);
    }
  };

  if (order === "loading") {
    return <div className="container-x py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!order) {
    return (
      <section className="container-x py-24 text-center">
        <h1 className="font-serif text-3xl text-primary">We couldn't find that order.</h1>
        <Link to="/menu" className="mt-6 inline-block text-sm text-accent hover:underline">
          Back to menu
        </Link>
      </section>
    );
  }

  // Payment still unresolved and we haven't finished checking yet — show a
  // plain loading state instead of the receipt, so nothing that looks like
  // a confirmed order appears before we actually know the outcome.
  if (order.paymentStatus === "pending" && verifyAttempts < MAX_VERIFY_ATTEMPTS) {
    return <CheckingPayment />;
  }

  // Payment definitively failed, OR we gave up checking and it's still
  // pending (likely abandoned checkout) — standalone screen, no receipt.
  if (order.orderStatus === "rejected" || order.paymentStatus === "pending") {
    return (
      <PaymentNotCompleted
        order={order}
        timedOut={order.paymentStatus === "pending"}
        onRetry={retryPayment}
        retrying={retrying}
      />
    );
  }

  return (
    <section className="container-x py-10 md:py-16">
      <style>{`
        @media print {
          header, footer, [data-no-print] { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <ConfettiBurst />

      <div className="mx-auto max-w-2xl" data-no-print>
        <div className="text-center">
          <img
            src={IMG.logo}
            alt="Little Brownie Co."
            className="mx-auto h-16 w-16 animate-float rounded-full border border-border object-cover"
          />
          <h1 className="mt-4 font-serif text-3xl text-primary sm:text-4xl">
            Thank you for your order!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Thank you for placing your order. Your order will be confirmed shortly.
          </p>
          <div className="mt-4 flex justify-center">
            <StatusPill order={order} />
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
        >
          <Printer className="h-4 w-4" /> Download / print receipt
        </button>
      </div>

      {/* Receipt */}
      <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-5">
          <div>
            <div className="font-serif text-2xl text-primary">Little Brownie Co.</div>
            <div className="text-xs text-muted-foreground">Bengaluru · Handcrafted Bakery</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Order ID
            </div>
            <div className="font-mono text-sm text-primary">{order.orderNumber}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-b border-dashed border-border pb-5 text-sm sm:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Billed to
            </div>
            <div className="mt-1 text-primary">{order.customerName}</div>
            <div className="text-muted-foreground">{order.phone}</div>
            <div className="text-muted-foreground">{order.address}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Delivery
            </div>
            <div className="mt-1 text-primary">{formatDisplayDate(order.deliveryDate)}</div>
            <div className="text-muted-foreground">{order.deliverySlot}</div>
          </div>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 text-center font-normal">Qty</th>
              <th className="pb-2 text-right font-normal">Price</th>
              <th className="pb-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {order.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2.5 text-primary">
                  {it.productName}
                  <div className="text-xs text-muted-foreground">{it.variantLabel}</div>
                </td>
                <td className="py-2.5 text-center text-primary">{it.qty}</td>
                <td className="py-2.5 text-right text-primary">₹{it.unitPrice}</td>
                <td className="py-2.5 text-right text-primary">₹{it.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-5 space-y-2 border-t border-dashed border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-primary">₹{order.subtotal}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery charges</dt>
            <dd className="text-primary">
              {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "To be shared via WhatsApp"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-serif text-xl text-primary">
            <dt>Paid</dt>
            <dd>₹{order.total}</dd>
          </div>
        </dl>

        {order.notes && (
          <div className="mt-5 border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
            Notes: {order.notes}
          </div>
        )}

        <div className="mt-6 border-t border-dashed border-border pt-4 text-center text-[11px] text-muted-foreground">
          Thank you for placing your order. Your order will be confirmed after verification of
          payment status.
        </div>
      </div>

      <OrderTracker order={order} />

      <div className="mx-auto mt-8 max-w-2xl text-center" data-no-print>
        <Link to="/menu" className="text-sm text-accent hover:underline">
          Continue browsing the menu
        </Link>
      </div>
    </section>
  );
}
