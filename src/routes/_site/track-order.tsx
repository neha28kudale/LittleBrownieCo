import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { getOrderByNumberAndPhone } from "@/lib/orders";

export const Route = createFileRoute("/_site/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Little Brownie Co." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackOrder,
});

function TrackOrder() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter both your Order ID and phone number.");
      return;
    }
    setLoading(true);
    const order = await getOrderByNumberAndPhone(orderNumber, phone);
    setLoading(false);
    if (!order) {
      setError("We couldn't find an order with that ID and phone number. Please check and try again.");
      return;
    }
    navigate({ to: "/order-confirmation/$orderId", params: { orderId: order.id } });
  }

  return (
    <section className="container-x py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-serif text-3xl text-primary sm:text-4xl">Track Your Order</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your Order ID and the phone number used at checkout to see your order status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 max-w-md rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8"
      >
        <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Order ID
        </label>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="e.g. LBC128"
          className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-primary outline-none focus:border-accent"
        />

        <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9876543210"
          className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-primary outline-none focus:border-accent"
        />

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" /> {loading ? "Searching…" : "Track Order"}
        </button>
      </form>
    </section>
  );
}
