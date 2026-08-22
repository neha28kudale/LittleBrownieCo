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
  getDeliveryFeeForPincode,
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

const CASHFREE_MODE =
  (import.meta.env.VITE_CASHFREE_MODE as string) || "sandbox";

const RIBBON_FEE = 15;

function Checkout() {
  const { detailed, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [deliveryFeeError, setDeliveryFeeError] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryPricingConfigured, setDeliveryPricingConfigured] = useState(true);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ribbonFee = isGift ? RIBBON_FEE : 0;
  const payableTotal = subtotal + (deliveryFee ?? 0) + ribbonFee;

  // Debounced pincode -> delivery fee lookup.
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryFee(null);
      setDistanceKm(undefined);
      setDeliveryFeeError("");
      return;
    }

    let cancelled = false;
    setCheckingPincode(true);
    setDeliveryFeeError("");

    const timer = setTimeout(async () => {
      const result = await getDeliveryFeeForPincode(pincode);
      if (cancelled) return;

      if (result.ok) {
        setDeliveryFee(result.fee);
        setDistanceKm(result.distanceKm);
        setDeliveryPricingConfigured(true);
      } else if (!result.configured) {
        // Pincode-based pricing isn't set up yet — fall back gracefully.
        setDeliveryFee(null);
        setDistanceKm(undefined);
        setDeliveryPricingConfigured(false);
      } else {
        setDeliveryFee(null);
        setDistanceKm(undefined);
        setDeliveryFeeError(result.error);
      }
      setCheckingPincode(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pincode]);

  useEffect(() => {
    setDate(toISODate(earliestDeliveryDate()));
  }, []);

  const minDate = toISODate(earliestDeliveryDate());
  const maxDate = toISODate(maxDeliveryDate());

  if (detailed.length === 0) {
    return (
      <section className="container-x py-20 text-center md:py-24">
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          Your cart is empty.
        </h1>

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
    // Mandatory fields
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error(
        "Please fill in your name, active WhatsApp number and delivery address.",
      );
      return;
    }

    if (deliveryPricingConfigured && !/^\d{6}$/.test(pincode)) {
      toast.error("Please enter your delivery pincode.");
      return;
    }

    if (deliveryPricingConfigured && deliveryFee === null) {
      toast.error(
        deliveryFeeError || "Please wait while we calculate your delivery charge.",
      );
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

    // Validate WhatsApp phone number
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    // Prevent users from manually selecting an invalid date
    const selectedDate = new Date(`${date}T00:00:00`);
    const earliestDate = new Date(`${minDate}T00:00:00`);

    if (selectedDate < earliestDate) {
      toast.error(
        `Please select ${formatDisplayDate(minDate)} or a later delivery date.`,
      );
      setDate(minDate);
      return;
    }

    setSubmitting(true);

    const result = await createOrder({
      customerName: name.trim(),
      phone: cleanPhone,
      address: address.trim(),

      // Calculated from the customer's pincode (falls back to 0 / "at
      // dispatch" if pincode-based pricing isn't configured yet).
      distanceKm,
      deliveryFee: deliveryFee ?? 0,

      deliveryDate: date,
      deliverySlot: slot,
      notes: notes.trim() || undefined,
      isGift,
      giftMessage: isGift ? giftMessage.trim() || undefined : undefined,
      ribbonFee,
      items: detailed,
    });

    if (!result.ok) {
      setSubmitting(false);
      toast.error(result.error);
      return;
    }

    const order = result.order;

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-cashfree-order",
        {
          body: {
            orderId: order.id,
            mode: CASHFREE_MODE,
          },
        },
      );

      if (error || !data?.paymentSessionId) {
        // supabase.functions.invoke()'s `error.message` is just a generic
        // "non-2xx status code" wrapper — it does NOT include the JSON body
        // our function actually returned (e.g. "Cashfree order creation
        // failed: <reason>"). Pull the real reason out of the response body
        // so it shows up in the console/logs instead of being swallowed.
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

        console.error("[checkout] cashfree detail:", detail);
        throw new Error(detail);
      }

      clear();

      const cashfree = (window as any).Cashfree?.({
        mode: CASHFREE_MODE,
      });

      if (!cashfree) {
        throw new Error("Payment SDK failed to load.");
      }

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

      navigate({
        to: "/order-confirmation/$orderId",
        params: {
          orderId: order.id,
        },
      });
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
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to cart
      </Link>

      <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          {/* DELIVERY DETAILS */}
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-primary">
              Delivery details
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Bangalore delivery only. Pick-up is not available.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* NAME */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Full name *
                </span>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              {/* WHATSAPP */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  WhatsApp number *
                </span>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit WhatsApp number"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Please provide an active WhatsApp number.
                </span>
              </label>

              {/* ADDRESS */}
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery address *
                </span>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              {/* PINCODE */}
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery pincode *
                </span>

                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  className="mt-2 w-full max-w-xs rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Delivery charges are calculated based on the distance from our
                  kitchen to your delivery location.
                </span>

                {checkingPincode && (
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Calculating delivery charge…
                  </span>
                )}

                {!checkingPincode && deliveryFee !== null && (
                  <span className="mt-1 block text-[11px] text-accent">
                    Delivery charge for this address: ₹{deliveryFee}
                  </span>
                )}

                {!checkingPincode && deliveryFeeError && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    {deliveryFeeError}
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* DELIVERY DATE & TIME */}
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-2xl text-primary">
              Delivery date &amp; time
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              We don't offer same-day delivery. Orders placed between 9 AM and
              5 PM can be delivered from tomorrow. Orders placed after 5 PM can
              be delivered from the day after tomorrow.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* DATE */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery date *
                </span>

                <input
                  type="date"
                  value={date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => {
                    const selected = e.target.value;

                    if (selected < minDate) {
                      setDate(minDate);

                      toast.error(
                        `Earliest available delivery date is ${formatDisplayDate(
                          minDate,
                        )}.`,
                      );

                      return;
                    }

                    setDate(selected);
                  }}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Earliest available: {formatDisplayDate(minDate)}
                </span>
              </label>

              {/* TIME SLOT */}
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery time *
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

              {/* NOTES */}
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

          {/* DELIVERY AGREEMENT */}
          <div className="rounded-lg border border-border bg-secondary/30 p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DELIVERY_AGREEMENT_TEXT}
            </p>

            <div className="mt-4 flex items-start gap-3">
              <Checkbox
                id="delivery-agreement"
                checked={deliveryAgreed}
                onCheckedChange={(checked) =>
                  setDeliveryAgreed(checked === true)
                }
              />

              <Label
                htmlFor="delivery-agreement"
                className="cursor-pointer text-sm leading-snug text-primary/90"
              >
                I understand and agree to the delivery charges as per the
                delivery policy.{" "}
                <Link
                  to="/policies"
                  hash="delivery"
                  className="text-accent hover:underline"
                >
                  View Delivery Policy
                </Link>
              </Label>
            </div>
          </div>

          {/* GIFT OPTION */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft transition-shadow duration-300 hover:shadow-md sm:p-6">
            <h2 className="font-serif text-2xl text-primary">
              Is this a gift? 🎁
            </h2>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary/40">
                <input
                  type="radio"
                  name="is-gift"
                  checked={isGift}
                  onChange={() => setIsGift(true)}
                  className="mt-1 h-4 w-4 accent-primary"
                />

                <span className="text-sm leading-snug text-primary/90">
                  Yes, add a ribbon (₹{RIBBON_FEE})
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary/40">
                <input
                  type="radio"
                  name="is-gift"
                  checked={!isGift}
                  onChange={() => {
                    setIsGift(false);
                    setGiftMessage("");
                  }}
                  className="mt-1 h-4 w-4 accent-primary"
                />

                <span className="text-sm leading-snug text-primary/90">
                  No
                </span>
              </label>
            </div>

            {isGift && (
              <label className="mt-4 block animate-in fade-in slide-in-from-top-1 duration-300">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Gift message
                </span>

                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={2}
                  placeholder="Write a short note for the recipient…"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
            )}
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <aside className="h-fit min-w-0 rounded-lg border border-border bg-card p-5 shadow-soft lg:sticky lg:top-28 lg:p-6">
          <h2 className="font-serif text-2xl text-primary">
            Order Summary
          </h2>

          <ul className="mt-4 space-y-2 text-sm">
            {detailed.map((d) => (
              <li
                key={d.key}
                className="flex justify-between gap-2 text-primary/80"
              >
                <span className="min-w-0 truncate">
                  {d.qty} × {d.product.name}{" "}
                  <span className="text-muted-foreground">
                    ({d.variant.label})
                  </span>
                </span>

                <span className="shrink-0">₹{d.lineTotal}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            {/* SUBTOTAL */}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>₹{subtotal}</dd>
            </div>

            {/* DELIVERY */}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">
                Delivery charges
              </dt>

              <dd className="shrink-0 text-right">
                {deliveryFee !== null
                  ? `₹${deliveryFee}`
                  : deliveryPricingConfigured
                    ? "Enter pincode"
                    : "Calculated at dispatch"}
              </dd>
            </div>

            {/* GIFT RIBBON */}
            {isGift && (
              <div className="flex animate-in fade-in slide-in-from-top-1 justify-between duration-300">
                <dt className="text-muted-foreground">Gift ribbon</dt>
                <dd>₹{RIBBON_FEE}</dd>
              </div>
            )}

            {/* PAY NOW */}
            <div className="flex justify-between border-t border-border pt-3 font-serif text-lg text-primary transition-all duration-300">
              <dt>Pay now</dt>
              <dd>₹{payableTotal}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {deliveryPricingConfigured
              ? "Delivery charges are calculated based on the distance from our kitchen to your delivery location."
              : "Delivery charges are calculated at dispatch based on your delivery location. The final delivery charge will be shared with you before dispatch."}
          </p>

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                Proceed to payment
                <ArrowRight className="h-4 w-4" />
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
