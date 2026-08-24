import { Link } from "@tanstack/react-router";
import { Plus, Expand, Check } from "lucide-react";
import { useState } from "react";
import { fromPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({
  product,
  onAddToCart,
  categoryLabel,
}: {
  product: Product;
  onAddToCart?: (product: Product, variant: Product["variants"][number], qty: number) => void;
  /** Display name for product.category, in case an admin has renamed it
   * from the dashboard. Falls back to the raw category if not passed. */
  categoryLabel?: string;
}) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]!.id);
  const variant = product.variants.find((v) => v.id === variantId)!;
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, variant, 1);
    } else {
      add(product.id, variant.id);
      toast.success(`${product.name} (${variant.label}) added`);
    }

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="lift-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-[0.45rem] border border-border/70 bg-card p-2.5 shadow-soft sm:p-3">
      <Link
        to="/product/$id"
        params={{ id: product.slug }}
        className="img-zoom relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[0.4rem] bg-secondary"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{ objectPosition: product.imagePosition || "center" }}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full border border-border/60 bg-background/92 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur sm:left-4 sm:top-4 sm:px-3">
          {categoryLabel || product.category}
        </span>
        {/* Hover/tap affordance so it's clear the card opens a detail view */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all duration-300 group-hover:bg-primary/25 group-hover:opacity-100">
          <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-background/95 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-primary shadow-soft transition-transform duration-300 group-hover:translate-y-0">
            <Expand className="h-3 w-3" /> View details
          </span>
        </div>
        <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-primary shadow-soft backdrop-blur transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" />
        </span>
      </Link>
      <div className="mt-3 flex min-w-0 items-start justify-between gap-3 px-1 sm:mt-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[1.05rem] leading-tight text-primary sm:text-xl">
            <Link
              to="/product/$id"
              params={{ id: product.slug }}
              className="cursor-pointer underline decoration-transparent underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{product.tagline}</p>
          <Link
            to="/product/$id"
            params={{ id: product.slug }}
            className="mt-1 inline-block text-[11px] font-medium text-accent underline underline-offset-2 hover:text-accent/80"
          >
            View details →
          </Link>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
            from
          </div>
          <div className="font-serif text-base text-primary sm:text-lg">₹{fromPrice(product)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 px-1 pb-1 sm:mt-4 sm:flex-row sm:items-center">
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          aria-label={`Choose an option for ${product.name}`}
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs text-primary transition-colors focus:border-accent focus:outline-none"
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} · ₹{v.price}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddToCart}
          disabled={justAdded}
          className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 ${
            justAdded
              ? "w-[5.5rem] scale-105 bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground hover:bg-cocoa-dark active:bg-cocoa-dark"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-3 w-3" /> Added
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Add
            </>
          )}
        </button>
      </div>
    </article>
  );
}
