import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, CheckCircle2, Clock, XCircle, Check } from "lucide-react";
import { getOrderById, type Order } from "@/lib/orders";
import { formatDisplayDate } from "@/lib/delivery";
import { IMG } from "@/lib/products";

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

function OrderConfirmation() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<Order | null | "loading">("loading");

  useEffect(() => {
    getOrderById(orderId).then(setOrder);
  }, [orderId]);

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

  return (
    <section className="container-x py-10 md:py-16">
      <style>{`
        @media print {
          header, footer, [data-no-print] { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl" data-no-print>
        <div className="text-center">
          <img
            src={IMG.logo}
            alt="Little Brownie Co."
            className="mx-auto h-16 w-16 rounded-full border border-border object-cover"
          />
          <h1 className="mt-4 font-serif text-3xl text-primary sm:text-4xl">
            {order.orderStatus === "rejected" ? "Payment couldn't be verified" : "Thank you for your order!"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Thank you for placing your order. Your order will be confirmed after verification of
            payment status.
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
              {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "At dispatch"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-serif text-xl text-primary">
            <dt>Paid now</dt>
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
