import { createFileRoute } from "@tanstack/react-router";
import { Checkout } from "@/components/CheckoutPage";

export const Route = createFileRoute("/_site/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Little Brownie Co." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useCart, RIBBON_FEE } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import {
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  maxDeliveryDate,
  formatDisplayDate,
  toISODate,
  getDeliveryFee,
  isBangalorePincode,
} from "@/lib/delivery";
import { DELIVERY_AGREEMENT_TEXT, ALLERGEN_AGREEMENT_TEXT } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LandmarkAutocomplete, type LandmarkValue } from "@/components/LandmarkAutocomplete";

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


function Checkout() {
  const { detailed, subtotal, clear, isGift, giftMessage, ribbonFee } = useCart();
  const navigate = useNavigate();

  // Catches a customer who left mid-payment via a PLAIN page reload/relaunch
  // (not just the browser-back/bfcache case handled by the pageshow listener
  // below). A reload throws away bfcache eligibility on many mobile browsers,
  // so /checkout gets a completely fresh mount — at which point the cart is
  // already empty (it was cleared right before we sent them to Cashfree),
  // and without this check they'd just see "Your cart is empty" instead of
  // being routed to their order's actual payment status. Read this once,
  // synchronously, before the empty-cart branch below has a chance to render.
  const [pendingOrderId] = useState(() => sessionStorage.getItem("lbc_pending_order_id"));

  useEffect(() => {
    if (pendingOrderId) {
      sessionStorage.removeItem("lbc_pending_order_id");
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
    }
  }, [pendingOrderId, navigate]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState<LandmarkValue>({ text: "" });
  const [landmarkConfigured, setLandmarkConfigured] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [deliveryFeeError, setDeliveryFeeError] = useState("");
  const [needsManualConfirm, setNeedsManualConfirm] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryPricingConfigured, setDeliveryPricingConfigured] = useState(true);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [allergenAgreed, setAllergenAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const payableTotal = subtotal + (deliveryFee ?? 0) + ribbonFee;

  // Debounced address + pincode + landmark -> delivery fee lookup.
  useEffect(() => {
    if (!isBangalorePincode(pincode) || !landmark.text.trim()) {
      setDeliveryFee(null);
      setDistanceKm(undefined);
      setDeliveryFeeError("");
      setNeedsManualConfirm(false);
      return;
    }

    let cancelled = false;
    setCheckingPincode(true);
    setDeliveryFeeError("");
    setNeedsManualConfirm(false);

    const timer = setTimeout(async () => {
      const result = await getDeliveryFee({
        address,
        pincode,
        landmark: landmark.text,
        landmarkPlaceId: landmark.placeId,
      });
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
        setNeedsManualConfirm(Boolean(result.needsManualConfirm));
      }
      setCheckingPincode(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, pincode, landmark.text, landmark.placeId]);

  useEffect(() => {
    setDate(toISODate(earliestDeliveryDate()));
  }, []);

  // Catches the customer hitting the browser's BACK button while on
  // Cashfree's hosted payment page. That doesn't go through Cashfree's own
  // cancel flow (which redirects via returnUrl on its own) — it just
  // restores this checkout page from the browser's cache ("bfcache"), with
  // no navigation and no chance for our order-confirmation logic to run.
  // `pageshow` with `event.persisted === true` is what fires in exactly
  // that situation, so we use it to immediately send them to the
  // confirmation page ourselves, where the existing "checking payment…" /
  // "payment wasn't completed" flow takes over right away instead of them
  // being stuck looking at this (already-submitted, cart-cleared) page.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const pendingOrderId = sessionStorage.getItem("lbc_pending_order_id");
      if (pendingOrderId) {
        sessionStorage.removeItem("lbc_pending_order_id");
        navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [navigate]);

  const minDate = toISODate(earliestDeliveryDate());
  const maxDate = toISODate(maxDeliveryDate());

  // We're about to redirect them to their order's payment status — don't
  // flash "Your cart is empty" first.
  if (pendingOrderId) {
    return (
      <section className="container-x flex flex-col items-center justify-center py-24 text-center md:py-32">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 font-serif text-2xl text-primary sm:text-3xl">
          Checking your payment…
        </h1>
      </section>
    );
  }

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

    if (deliveryPricingConfigured && !isBangalorePincode(pincode)) {
      toast.error("We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).");
      return;
    }

    if (deliveryPricingConfigured && !landmark.text.trim()) {
      toast.error("Please enter a nearby landmark.");
      return;
    }

    if (deliveryPricingConfigured && landmarkConfigured && !landmark.placeId) {
      toast.error("Please pick your landmark from the suggestions list.");
      return;
    }

    // Block only while we're still waiting on the lookup, or a fee
    // couldn't be worked out for a reason OTHER than "we'll confirm it
    // manually" (that case is allowed through — see needsManualConfirm).
    if (
      deliveryPricingConfigured &&
      deliveryFee === null &&
      !needsManualConfirm &&
      !checkingPincode
    ) {
      toast.error(deliveryFeeError || "Please wait while we calculate your delivery charge.");
      return;
    }

    if (deliveryPricingConfigured && deliveryFee === null && checkingPincode) {
      toast.error("Please wait while we calculate your delivery charge.");
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

    if (!allergenAgreed) {
      toast.error("Please confirm you've read the ingredients & allergen info to proceed.");
      return;
    }

    // Validate WhatsApp phone number
    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
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
      address: `${address.trim()} (Landmark: ${landmark.text.trim()})`,

      // Calculated from the customer's address/landmark (falls back to 0 /
      // "at dispatch" if pricing isn't configured yet, or if we couldn't
      // confidently locate the address — in which case the fee is
      // confirmed manually over WhatsApp before baking).
      distanceKm,
      deliveryFee: deliveryFee ?? 0,

      deliveryDate: date,
      deliverySlot: slot,
      notes: [
        notes.trim(),
        needsManualConfirm && deliveryFee === null
          ? "⚠️ Delivery charge not auto-calculated — confirm manually with customer before baking."
          : "",
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
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

      // Remember this order so that if the customer hits the browser's
      // BACK button while on Cashfree's hosted page (as opposed to using
      // Cashfree's own cancel button, which redirects via returnUrl on its
      // own), we can catch it the moment they land back here — see the
      // pageshow listener below — instead of leaving them stuck looking at
      // an empty checkout page with no explanation.
      sessionStorage.setItem("lbc_pending_order_id", order.id);

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
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    // Indian mobile numbers always start with 6, 7, 8 or 9 —
                    // block an invalid leading digit rather than letting the
                    // customer type any 10 digits.
                    if (digits.length > 0 && !/^[6-9]/.test(digits)) return;
                    setPhone(digits);
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit WhatsApp number"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                {phone.length === 10 && !/^[6-9]\d{9}$/.test(phone) && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    Please enter a valid 10-digit mobile number.
                  </span>
                )}

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
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery pincode *
                </span>

                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 560001"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                {pincode.length === 6 && !isBangalorePincode(pincode) && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).
                  </span>
                )}
              </label>

              {/* LANDMARK */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nearby landmark *
                </span>

                <LandmarkAutocomplete
                  value={landmark}
                  onChange={setLandmark}
                  onConfiguredChange={setLandmarkConfigured}
                  placeholder="e.g. Near Forum Mall"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="block text-[11px] font-medium text-accent">
                  We only deliver within Bangalore.
                </span>

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Delivery charges are calculated based on the driving distance from our
                  kitchen to your delivery location. Search for a well-known nearby place (a
                  mall, metro station, temple, school, etc) and select it from the
                  suggestions — this helps us pinpoint your location accurately.
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
                  <span
                    className={`mt-1 block text-[11px] ${
                      needsManualConfirm ? "text-toffee" : "text-destructive"
                    }`}
                  >
                    {deliveryFeeError}
                  </span>
                )}
              </div>
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
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
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

          {/* ALLERGEN AGREEMENT */}
          <div className="rounded-lg border border-accent/30 bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="allergen-agreement"
                checked={allergenAgreed}
                onCheckedChange={(checked) => setAllergenAgreed(checked === true)}
              />
              <Label
                htmlFor="allergen-agreement"
                className="cursor-pointer text-sm leading-snug text-primary/90"
              >
                {ALLERGEN_AGREEMENT_TEXT}{" "}
                <Link to="/good-to-know" className="text-accent hover:underline">
                  View Ingredients &amp; Allergens
                </Link>
              </Label>
            </div>
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
                    ({d.variant.label}{d.variant.flavour ? `, ${d.variant.flavour}` : ""})
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
                  : needsManualConfirm
                    ? "Confirmed on WhatsApp"
                    : deliveryPricingConfigured
                      ? "Enter pincode & landmark"
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

          <p className="mt-4 rounded-md bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-foreground/80">
            {deliveryPricingConfigured
              ? "Delivery charges are calculated based on the distance between our kitchen to your delivery location. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."
              : "Delivery charges are calculated at dispatch based on your delivery location. The final delivery charge will be shared with you before dispatch. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."}
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
}import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useCart, RIBBON_FEE } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import {
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  maxDeliveryDate,
  formatDisplayDate,
  toISODate,
  getDeliveryFee,
  isBangalorePincode,
} from "@/lib/delivery";
import { DELIVERY_AGREEMENT_TEXT, ALLERGEN_AGREEMENT_TEXT } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LandmarkAutocomplete, type LandmarkValue } from "@/components/LandmarkAutocomplete";

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


function Checkout() {
  const { detailed, subtotal, clear, isGift, giftMessage, ribbonFee } = useCart();
  const navigate = useNavigate();

  // Catches a customer who left mid-payment via a PLAIN page reload/relaunch
  // (not just the browser-back/bfcache case handled by the pageshow listener
  // below). A reload throws away bfcache eligibility on many mobile browsers,
  // so /checkout gets a completely fresh mount — at which point the cart is
  // already empty (it was cleared right before we sent them to Cashfree),
  // and without this check they'd just see "Your cart is empty" instead of
  // being routed to their order's actual payment status. Read this once,
  // synchronously, before the empty-cart branch below has a chance to render.
  const [pendingOrderId] = useState(() => sessionStorage.getItem("lbc_pending_order_id"));

  useEffect(() => {
    if (pendingOrderId) {
      sessionStorage.removeItem("lbc_pending_order_id");
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
    }
  }, [pendingOrderId, navigate]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState<LandmarkValue>({ text: "" });
  const [landmarkConfigured, setLandmarkConfigured] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [deliveryFeeError, setDeliveryFeeError] = useState("");
  const [needsManualConfirm, setNeedsManualConfirm] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryPricingConfigured, setDeliveryPricingConfigured] = useState(true);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [allergenAgreed, setAllergenAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const payableTotal = subtotal + (deliveryFee ?? 0) + ribbonFee;

  // Debounced address + pincode + landmark -> delivery fee lookup.
  useEffect(() => {
    if (!isBangalorePincode(pincode) || !landmark.text.trim()) {
      setDeliveryFee(null);
      setDistanceKm(undefined);
      setDeliveryFeeError("");
      setNeedsManualConfirm(false);
      return;
    }

    let cancelled = false;
    setCheckingPincode(true);
    setDeliveryFeeError("");
    setNeedsManualConfirm(false);

    const timer = setTimeout(async () => {
      const result = await getDeliveryFee({
        address,
        pincode,
        landmark: landmark.text,
        landmarkPlaceId: landmark.placeId,
      });
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
        setNeedsManualConfirm(Boolean(result.needsManualConfirm));
      }
      setCheckingPincode(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, pincode, landmark.text, landmark.placeId]);

  useEffect(() => {
    setDate(toISODate(earliestDeliveryDate()));
  }, []);

  // Catches the customer hitting the browser's BACK button while on
  // Cashfree's hosted payment page. That doesn't go through Cashfree's own
  // cancel flow (which redirects via returnUrl on its own) — it just
  // restores this checkout page from the browser's cache ("bfcache"), with
  // no navigation and no chance for our order-confirmation logic to run.
  // `pageshow` with `event.persisted === true` is what fires in exactly
  // that situation, so we use it to immediately send them to the
  // confirmation page ourselves, where the existing "checking payment…" /
  // "payment wasn't completed" flow takes over right away instead of them
  // being stuck looking at this (already-submitted, cart-cleared) page.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const pendingOrderId = sessionStorage.getItem("lbc_pending_order_id");
      if (pendingOrderId) {
        sessionStorage.removeItem("lbc_pending_order_id");
        navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [navigate]);

  const minDate = toISODate(earliestDeliveryDate());
  const maxDate = toISODate(maxDeliveryDate());

  // We're about to redirect them to their order's payment status — don't
  // flash "Your cart is empty" first.
  if (pendingOrderId) {
    return (
      <section className="container-x flex flex-col items-center justify-center py-24 text-center md:py-32">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 font-serif text-2xl text-primary sm:text-3xl">
          Checking your payment…
        </h1>
      </section>
    );
  }

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

    if (deliveryPricingConfigured && !isBangalorePincode(pincode)) {
      toast.error("We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).");
      return;
    }

    if (deliveryPricingConfigured && !landmark.text.trim()) {
      toast.error("Please enter a nearby landmark.");
      return;
    }

    if (deliveryPricingConfigured && landmarkConfigured && !landmark.placeId) {
      toast.error("Please pick your landmark from the suggestions list.");
      return;
    }

    // Block only while we're still waiting on the lookup, or a fee
    // couldn't be worked out for a reason OTHER than "we'll confirm it
    // manually" (that case is allowed through — see needsManualConfirm).
    if (
      deliveryPricingConfigured &&
      deliveryFee === null &&
      !needsManualConfirm &&
      !checkingPincode
    ) {
      toast.error(deliveryFeeError || "Please wait while we calculate your delivery charge.");
      return;
    }

    if (deliveryPricingConfigured && deliveryFee === null && checkingPincode) {
      toast.error("Please wait while we calculate your delivery charge.");
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

    if (!allergenAgreed) {
      toast.error("Please confirm you've read the ingredients & allergen info to proceed.");
      return;
    }

    // Validate WhatsApp phone number
    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
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
      address: `${address.trim()} (Landmark: ${landmark.text.trim()})`,

      // Calculated from the customer's address/landmark (falls back to 0 /
      // "at dispatch" if pricing isn't configured yet, or if we couldn't
      // confidently locate the address — in which case the fee is
      // confirmed manually over WhatsApp before baking).
      distanceKm,
      deliveryFee: deliveryFee ?? 0,

      deliveryDate: date,
      deliverySlot: slot,
      notes: [
        notes.trim(),
        needsManualConfirm && deliveryFee === null
          ? "⚠️ Delivery charge not auto-calculated — confirm manually with customer before baking."
          : "",
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
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

      // Remember this order so that if the customer hits the browser's
      // BACK button while on Cashfree's hosted page (as opposed to using
      // Cashfree's own cancel button, which redirects via returnUrl on its
      // own), we can catch it the moment they land back here — see the
      // pageshow listener below — instead of leaving them stuck looking at
      // an empty checkout page with no explanation.
      sessionStorage.setItem("lbc_pending_order_id", order.id);

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
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    // Indian mobile numbers always start with 6, 7, 8 or 9 —
                    // block an invalid leading digit rather than letting the
                    // customer type any 10 digits.
                    if (digits.length > 0 && !/^[6-9]/.test(digits)) return;
                    setPhone(digits);
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit WhatsApp number"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                {phone.length === 10 && !/^[6-9]\d{9}$/.test(phone) && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    Please enter a valid 10-digit mobile number.
                  </span>
                )}

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
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery pincode *
                </span>

                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 560001"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                {pincode.length === 6 && !isBangalorePincode(pincode) && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).
                  </span>
                )}
              </label>

              {/* LANDMARK */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nearby landmark *
                </span>

                <LandmarkAutocomplete
                  value={landmark}
                  onChange={setLandmark}
                  onConfiguredChange={setLandmarkConfigured}
                  placeholder="e.g. Near Forum Mall"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="block text-[11px] font-medium text-accent">
                  We only deliver within Bangalore.
                </span>

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Delivery charges are calculated based on the driving distance from our
                  kitchen to your delivery location. Search for a well-known nearby place (a
                  mall, metro station, temple, school, etc) and select it from the
                  suggestions — this helps us pinpoint your location accurately.
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
                  <span
                    className={`mt-1 block text-[11px] ${
                      needsManualConfirm ? "text-toffee" : "text-destructive"
                    }`}
                  >
                    {deliveryFeeError}
                  </span>
                )}
              </div>
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
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
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

          {/* ALLERGEN AGREEMENT */}
          <div className="rounded-lg border border-accent/30 bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="allergen-agreement"
                checked={allergenAgreed}
                onCheckedChange={(checked) => setAllergenAgreed(checked === true)}
              />
              <Label
                htmlFor="allergen-agreement"
                className="cursor-pointer text-sm leading-snug text-primary/90"
              >
                {ALLERGEN_AGREEMENT_TEXT}{" "}
                <Link to="/good-to-know" className="text-accent hover:underline">
                  View Ingredients &amp; Allergens
                </Link>
              </Label>
            </div>
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
                    ({d.variant.label}{d.variant.flavour ? `, ${d.variant.flavour}` : ""})
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
                  : needsManualConfirm
                    ? "Confirmed on WhatsApp"
                    : deliveryPricingConfigured
                      ? "Enter pincode & landmark"
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

          <p className="mt-4 rounded-md bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-foreground/80">
            {deliveryPricingConfigured
              ? "Delivery charges are calculated based on the distance between our kitchen to your delivery location. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."
              : "Delivery charges are calculated at dispatch based on your delivery location. The final delivery charge will be shared with you before dispatch. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."}
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
}import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useCart, RIBBON_FEE } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import {
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  maxDeliveryDate,
  formatDisplayDate,
  toISODate,
  getDeliveryFee,
  isBangalorePincode,
} from "@/lib/delivery";
import { DELIVERY_AGREEMENT_TEXT, ALLERGEN_AGREEMENT_TEXT } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LandmarkAutocomplete, type LandmarkValue } from "@/components/LandmarkAutocomplete";

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


function Checkout() {
  const { detailed, subtotal, clear, isGift, giftMessage, ribbonFee } = useCart();
  const navigate = useNavigate();

  // Catches a customer who left mid-payment via a PLAIN page reload/relaunch
  // (not just the browser-back/bfcache case handled by the pageshow listener
  // below). A reload throws away bfcache eligibility on many mobile browsers,
  // so /checkout gets a completely fresh mount — at which point the cart is
  // already empty (it was cleared right before we sent them to Cashfree),
  // and without this check they'd just see "Your cart is empty" instead of
  // being routed to their order's actual payment status. Read this once,
  // synchronously, before the empty-cart branch below has a chance to render.
  const [pendingOrderId] = useState(() => sessionStorage.getItem("lbc_pending_order_id"));

  useEffect(() => {
    if (pendingOrderId) {
      sessionStorage.removeItem("lbc_pending_order_id");
      navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
    }
  }, [pendingOrderId, navigate]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState<LandmarkValue>({ text: "" });
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [deliveryFeeError, setDeliveryFeeError] = useState("");
  const [needsManualConfirm, setNeedsManualConfirm] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryPricingConfigured, setDeliveryPricingConfigured] = useState(true);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [allergenAgreed, setAllergenAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const payableTotal = subtotal + (deliveryFee ?? 0) + ribbonFee;

  // Debounced address + pincode + landmark -> delivery fee lookup.
  useEffect(() => {
    if (!isBangalorePincode(pincode) || !landmark.text.trim()) {
      setDeliveryFee(null);
      setDistanceKm(undefined);
      setDeliveryFeeError("");
      setNeedsManualConfirm(false);
      return;
    }

    let cancelled = false;
    setCheckingPincode(true);
    setDeliveryFeeError("");
    setNeedsManualConfirm(false);

    const timer = setTimeout(async () => {
      const result = await getDeliveryFee({
        address,
        pincode,
        landmark: landmark.text,
        landmarkPlaceId: landmark.placeId,
      });
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
        setNeedsManualConfirm(Boolean(result.needsManualConfirm));
      }
      setCheckingPincode(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, pincode, landmark.text, landmark.placeId]);

  useEffect(() => {
    setDate(toISODate(earliestDeliveryDate()));
  }, []);

  // Catches the customer hitting the browser's BACK button while on
  // Cashfree's hosted payment page. That doesn't go through Cashfree's own
  // cancel flow (which redirects via returnUrl on its own) — it just
  // restores this checkout page from the browser's cache ("bfcache"), with
  // no navigation and no chance for our order-confirmation logic to run.
  // `pageshow` with `event.persisted === true` is what fires in exactly
  // that situation, so we use it to immediately send them to the
  // confirmation page ourselves, where the existing "checking payment…" /
  // "payment wasn't completed" flow takes over right away instead of them
  // being stuck looking at this (already-submitted, cart-cleared) page.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const pendingOrderId = sessionStorage.getItem("lbc_pending_order_id");
      if (pendingOrderId) {
        sessionStorage.removeItem("lbc_pending_order_id");
        navigate({ to: "/order-confirmation/$orderId", params: { orderId: pendingOrderId } });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [navigate]);

  const minDate = toISODate(earliestDeliveryDate());
  const maxDate = toISODate(maxDeliveryDate());

  // We're about to redirect them to their order's payment status — don't
  // flash "Your cart is empty" first.
  if (pendingOrderId) {
    return (
      <section className="container-x flex flex-col items-center justify-center py-24 text-center md:py-32">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 font-serif text-2xl text-primary sm:text-3xl">
          Checking your payment…
        </h1>
      </section>
    );
  }

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

    if (deliveryPricingConfigured && !isBangalorePincode(pincode)) {
      toast.error("We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).");
      return;
    }

    if (deliveryPricingConfigured && !landmark.text.trim()) {
      toast.error("Please enter a nearby landmark.");
      return;
    }

    // Block only while we're still waiting on the lookup, or a fee
    // couldn't be worked out for a reason OTHER than "we'll confirm it
    // manually" (that case is allowed through — see needsManualConfirm).
    if (
      deliveryPricingConfigured &&
      deliveryFee === null &&
      !needsManualConfirm &&
      !checkingPincode
    ) {
      toast.error(deliveryFeeError || "Please wait while we calculate your delivery charge.");
      return;
    }

    if (deliveryPricingConfigured && deliveryFee === null && checkingPincode) {
      toast.error("Please wait while we calculate your delivery charge.");
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

    if (!allergenAgreed) {
      toast.error("Please confirm you've read the ingredients & allergen info to proceed.");
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
      address: `${address.trim()} (Landmark: ${landmark.text.trim()})`,

      // Calculated from the customer's address/landmark (falls back to 0 /
      // "at dispatch" if pricing isn't configured yet, or if we couldn't
      // confidently locate the address — in which case the fee is
      // confirmed manually over WhatsApp before baking).
      distanceKm,
      deliveryFee: deliveryFee ?? 0,

      deliveryDate: date,
      deliverySlot: slot,
      notes: [
        notes.trim(),
        needsManualConfirm && deliveryFee === null
          ? "⚠️ Delivery charge not auto-calculated — confirm manually with customer before baking."
          : "",
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
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

      // Remember this order so that if the customer hits the browser's
      // BACK button while on Cashfree's hosted page (as opposed to using
      // Cashfree's own cancel button, which redirects via returnUrl on its
      // own), we can catch it the moment they land back here — see the
      // pageshow listener below — instead of leaving them stuck looking at
      // an empty checkout page with no explanation.
      sessionStorage.setItem("lbc_pending_order_id", order.id);

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
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Delivery pincode *
                </span>

                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 560001"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />

                {pincode.length === 6 && !isBangalorePincode(pincode) && (
                  <span className="mt-1 block text-[11px] text-destructive">
                    We only deliver within Bangalore. Please enter a Bangalore pincode (560xxx).
                  </span>
                )}
              </label>

              {/* LANDMARK */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Nearby landmark *
                </span>

                <LandmarkAutocomplete
                  value={landmark}
                  onChange={setLandmark}
                  placeholder="e.g. Near Forum Mall"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="block text-[11px] font-medium text-accent">
                  We only deliver within Bangalore.
                </span>

                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Delivery charges are calculated based on the driving distance from our
                  kitchen to your delivery location. A landmark helps us pinpoint your
                  location accurately — please name something well-known nearby (a mall,
                  metro station, temple, school, etc).
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
                  <span
                    className={`mt-1 block text-[11px] ${
                      needsManualConfirm ? "text-toffee" : "text-destructive"
                    }`}
                  >
                    {deliveryFeeError}
                  </span>
                )}
              </div>
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
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
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

          {/* ALLERGEN AGREEMENT */}
          <div className="rounded-lg border border-accent/30 bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="allergen-agreement"
                checked={allergenAgreed}
                onCheckedChange={(checked) => setAllergenAgreed(checked === true)}
              />
              <Label
                htmlFor="allergen-agreement"
                className="cursor-pointer text-sm leading-snug text-primary/90"
              >
                {ALLERGEN_AGREEMENT_TEXT}{" "}
                <Link to="/good-to-know" className="text-accent hover:underline">
                  View Ingredients &amp; Allergens
                </Link>
              </Label>
            </div>
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
                    ({d.variant.label}{d.variant.flavour ? `, ${d.variant.flavour}` : ""})
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
                  : needsManualConfirm
                    ? "Confirmed on WhatsApp"
                    : deliveryPricingConfigured
                      ? "Enter pincode & landmark"
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

          <p className="mt-4 rounded-md bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-foreground/80">
            {deliveryPricingConfigured
              ? "Delivery charges are calculated based on the distance between our kitchen to your delivery location. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."
              : "Delivery charges are calculated at dispatch based on your delivery location. The final delivery charge will be shared with you before dispatch. Your order will be delivered through a trusted third-party delivery partner such as Uber, Porter or Rapido."}
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
