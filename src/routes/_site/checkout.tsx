import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import {
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  maxDeliveryDate,
  formatDisplayDate,
  toISODate,
  getDeliverySlabs,
  feeForDistance,
  DeliverySlab,
} from "@/lib/delivery";
import { DELIVERY_AGREEMENT_TEXT } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_site/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Little Brownie Co." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const CASHFREE_MODE = (import.meta.env.VITE_CASHFREE_MODE as string) || "sandbox";

function Checkout() {
  const { detailed, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliverySlabs, setDeliverySlabs] = useState<DeliverySlab[]>([]);

  useEffect(() => {
    setDate(toISODate(earliestDeliveryDate()));
  }, []);

  useEffect(() => {
    const loadSlabs = async () => {
      const slabs = await getDeliverySlabs();
      setDeliverySlabs(slabs);
    };
    loadSlabs();
  }, []);

  const minDate = toISODate(earliestDeliveryDate());
  const maxDate = toISODate(maxDeliveryDate());

  // Calculate delivery fee based on distance
  const deliveryFee =
    typeof distance === "number" && distance >= 0 ? feeForDistance(deliverySlabs, distance) : 0;
  const totalAmount = subtotal + deliveryFee;

  if (detailed.length === 0) {
    return (
      <section className="container-x py-20 text-center md:py-24">
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">Your cart is empty.</h1>
        <Link
          to="/menu"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground"
        >
          Browse the menu
        </Link>
      </section>
    );
  }

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in your name, phone and delivery address.");
      return;
    }
    if (typeof distance !== "number" || distance < 0) {
      toast.error("Please enter a valid delivery distance in kilometers.");
      return;
    }
    if (!date || !slot) {
      toast.error("Please choose a delivery date and time slot.");
      return;
    }
    if (!deliveryAgreed) {
      toast.error("Please agree to the delivery policy to proceed.");
      return;
    }

    setSubmitting(true);

    const result = await createOrder({
      customerName: name,
      phone,
      email: email || undefined,
      address,
      deliveryFee,
      deliveryDate: date,
      deliverySlot: slot,
      notes: notes || undefined,
      items: detailed,
    });

    if (!result.ok) {
      setSubmitting(false);
      toast.error(result.error);
      return;
    }

    const order = result.order;

    try {
      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        body: { orderId: order.id, mode: CASHFREE_MODE },
      });

      if (error || !data?.paymentSessionId) {
        throw new Error(error?.message || "Payment gateway isn't configured yet.");
      }

      clear();

      const cashfree = (window as any).Cashfree?.({ mode: CASHFREE_MODE });
      if (!cashfree) throw new Error("Payment SDK failed to load.");

      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
        returnUrl: `${window.location.origin}/order-confirmation/${order.id}`,
      });
    } catch (err) {
      console.error("[checkout] cashfree", err);
      toast.error(
        "Payment isn't set up yet — your order was saved, but couldn't be charged. We'll be in touch.",
      );
      clear();
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: order.id } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-x py-10 md:py-16">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to cart
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-primary">Delivery details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Bangalore delivery only. Pick-up is not available.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Full name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Phone
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Email (optional, for receipt)
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery address
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Distance from restaurant (km)
                </span>
                <input
                  value={distance}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDistance(val === "" ? "" : parseFloat(val));
                  }}
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 3.5"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-primary">Delivery date &amp; time</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              We don't offer same-day delivery. Orders placed 9 AM–5 PM can be delivered from
              tomorrow; orders placed after 5 PM need one extra day.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery date
                </span>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Earliest available: {formatDisplayDate(minDate)}
                </span>
              </label>
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Time slot
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {DELIVERY_TIME_SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                        slot === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-primary/80 hover:border-caramel"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Notes for the kitchen (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DELIVERY_AGREEMENT_TEXT}
            </p>
            <div className="mt-4 flex items-start gap-3">
              <Checkbox
                id="delivery-agreement"
                checked={deliveryAgreed}
                onCheckedChange={(checked) => setDeliveryAgreed(checked === true)}
              />
              <Label
                htmlFor="delivery-agreement"
                className="cursor-pointer text-sm leading-snug text-primary/90"
              >
                I understand and agree to the delivery charges as per the delivery policy.{" "}
                <Link to="/policies" hash="delivery" className="text-accent hover:underline">
                  View Delivery Policy
                </Link>
              </Label>
            </div>
          </div>
        </div>

        <aside className="h-fit min-w-0 rounded-lg border border-border bg-card p-5 shadow-soft lg:sticky lg:top-28 lg:p-6">
          <h2 className="font-serif text-2xl text-primary">Order Summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {detailed.map((d) => (
              <li key={d.key} className="flex justify-between gap-2 text-primary/80">
                <span className="min-w-0 truncate">
                  {d.qty} × {d.product.name}{" "}
                  <span className="text-muted-foreground">({d.variant.label})</span>
                </span>
                <span className="shrink-0">₹{d.lineTotal}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>₹{subtotal}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Delivery charges ({distance ? `${distance} km` : "TBD"})</dt>
              <dd className="shrink-0">₹{deliveryFee}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-serif text-lg text-primary">
              <dt>Pay now</dt>
              <dd>₹{totalAmount}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Delivery charges are calculated separately and payable to the delivery partner when your
            order arrives. We'll share the amount and tracking details once dispatched.
          </p>
          <button
            onClick={submit}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                Proceed to payment <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            You'll be redirected to Cashfree's secure checkout to pay.
          </p>
        </aside>
      </div>
    </section>
  );
}
