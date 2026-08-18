import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { fromPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (product: Product, variant: Product["variants"][number], qty: number) => void;
}) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]!.id);
  const variant = product.variants.find((v) => v.id === variantId)!;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, variant, 1);
    } else {
      add(product.id, variant.id);
      toast.success(`${product.name} (${variant.label}) added`);
    }
  };

  return (
    <article className="group flex h-full flex-col rounded-[0.45rem] border border-border/70 bg-card p-2.5 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 sm:p-3">
      <Link
        to="/product/$id"
        params={{ id: product.slug }}
        className="relative block aspect-square overflow-hidden rounded-[0.4rem] bg-secondary sm:aspect-[4/5]"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full border border-border/60 bg-background/92 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur sm:left-4 sm:top-4 sm:px-3">
          {product.category}
        </span>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3 px-1 sm:mt-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[1.05rem] leading-tight text-primary sm:text-xl">
            <Link to="/product/$id" params={{ id: product.slug }} className="hover:text-accent">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{product.tagline}</p>
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
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs text-primary"
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} · ₹{v.price}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddToCart}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </article>
  );
}
