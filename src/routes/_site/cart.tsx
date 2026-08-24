import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DELIVERY_AGREEMENT_TEXT, ALLERGEN_AGREEMENT_TEXT } from "@/lib/site-content";

export const Route = createFileRoute("/_site/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Little Brownie Co." },
      {
        name: "description",
        content: "Review your brownie box before filling in the Little Brownie Co. order form.",
      },
      { property: "og:title", content: "Your Cart — Little Brownie Co." },
      { property: "og:description", content: "Review your order and continue to the order form." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailed, subtotal, update, remove, clear } = useCart();
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [allergenAgreed, setAllergenAgreed] = useState(false);

  if (detailed.length === 0) {
    return (
      <section className="container-x py-20 text-center md:py-24">
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">Your box is empty.</h1>
        <p className="mt-4 text-muted-foreground">Let's fix that.</p>
        <Link
          to="/menu"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground"
        >
          Browse the menu
        </Link>
      </section>
    );
  }

  return (
    <section className="container-x py-10 md:py-20">
      <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Cart</span>
      <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl md:text-6xl">
        Your cart
      </h1>
      <p className="mt-3 text-muted-foreground">Ready when you are.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {detailed.map((d) => (
            <div
              key={d.key}
              className="flex gap-4 rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <img
                src={d.product.square}
                alt={d.product.name}
                className="h-24 w-24 shrink-0 rounded-sm object-cover sm:h-28 sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg text-primary sm:text-xl">{d.product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {d.variant.label}
                      {d.variant.flavour ? ` · ${d.variant.flavour}` : ""} · ₹{d.variant.price} each
                    </p>
                  </div>
                  <button
                    onClick={() => remove(d.key)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      onClick={() => update(d.key, d.qty - 1)}
                      className="rounded-full p-2 transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{d.qty}</span>
                    <button
                      onClick={() => update(d.key, d.qty + 1)}
                      className="rounded-full p-2 transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="font-serif text-lg text-primary">₹{d.lineTotal}</div>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={clear}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive"
          >
            Clear cart
          </button>
        </div>

        <aside className="h-fit min-w-0 space-y-6 lg:sticky lg:top-28">
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft lg:p-6">
            <h2 className="font-serif text-2xl text-primary">Order Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items subtotal</dt>
                <dd>₹{subtotal}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery charges</dt>
                <dd className="text-muted-foreground">Calculated at checkout</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-serif text-lg text-primary">
                <dt>Pay now</dt>
                <dd className="text-sm font-sans text-muted-foreground">Calculated at checkout</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-5 lg:p-6">
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

          <div className="rounded-lg border border-accent/30 bg-card p-5 shadow-soft lg:p-6">
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

          {deliveryAgreed && allergenAgreed ? (
            <Link
              to="/checkout"
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
            >
              Continue to checkout <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-primary/40 px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground"
            >
              Continue to checkout <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <p className="text-center text-[11px] text-muted-foreground">
            Delivery date, time slot and payment are confirmed on the next step.
          </p>
        </aside>
      </div>
    </section>
  );
}
