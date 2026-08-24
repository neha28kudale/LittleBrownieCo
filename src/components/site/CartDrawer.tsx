import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Slides in from the right whenever something is added to the cart, so the
 * customer immediately sees what just happened and where the cart is —
 * instead of only a toast they might miss. Lets them adjust quantities,
 * jump to the full cart page, or go straight to checkout without hunting
 * for the cart icon. */
export function CartDrawer() {
  const { detailed, subtotal, count, update, remove, drawerOpen, closeDrawer } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close cart"
        onClick={closeDrawer}
        className="animate-backdrop-in absolute inset-0 bg-cocoa/40 backdrop-blur-[2px]"
      />
      <div className="animate-drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-display">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl text-primary">
              {count > 0 ? `Added to your box (${count})` : "Your box"}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {detailed.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-muted-foreground">Your box is empty.</p>
            <Link
              to="/menu"
              onClick={closeDrawer}
              className="rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark"
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {detailed.map((d) => (
                  <li key={d.key} className="flex gap-3 rounded-lg border border-border p-3">
                    <img
                      src={d.product.square}
                      alt={d.product.name}
                      className="h-16 w-16 shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-base text-primary">{d.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.variant.label}
                            {d.variant.flavour ? ` · ${d.variant.flavour}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(d.key)}
                          aria-label="Remove"
                          className="shrink-0 text-muted-foreground transition hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button
                            onClick={() => update(d.key, d.qty - 1)}
                            aria-label="Decrease"
                            className="rounded-full p-1.5 transition-colors hover:bg-caramel hover:text-cocoa"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm">{d.qty}</span>
                          <button
                            onClick={() => update(d.key, d.qty + 1)}
                            aria-label="Increase"
                            className="rounded-full p-1.5 transition-colors hover:bg-caramel hover:text-cocoa"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-medium text-primary">₹{d.lineTotal}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border/60 px-5 py-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-serif text-xl text-primary">₹{subtotal}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/cart"
                  onClick={closeDrawer}
                  className="rounded-full border border-primary px-4 py-3 text-center text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={closeDrawer}
                  className="rounded-full bg-primary px-4 py-3 text-center text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
