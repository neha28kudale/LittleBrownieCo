import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProducts, findProduct, whatsappLink, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Minus, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/_site/product/$id")({
  loader: async ({ params }) => {
    const all = await getProducts();
    const product = findProduct(all, params.id);
    if (!product) throw notFound();
    const related = all.filter((p) => p.id !== product.id).slice(0, 3);
    return { product, related };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `${p.name} — Little Brownie Co.` : "Little Brownie Co." },
        { name: "description", content: p?.description ?? "" },
        { property: "og:title", content: p?.name ?? "" },
        { property: "og:description", content: p?.tagline ?? "" },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-x py-32 text-center">
      <h1 className="font-serif text-4xl text-primary">Not baked yet.</h1>
      <Link to="/menu" className="mt-4 inline-block text-accent">
        Back to menu
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData() as { product: Product; related: Product[] };
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]!.id);
  const variant = product.variants.find((v) => v.id === variantId)!;
  const { add } = useCart();

  return (
    <>
      <section className="container-x pt-6 pb-12 md:pt-16 md:pb-16">
        <nav className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>{" "}
          ·{" "}
          <Link to="/menu" className="hover:text-primary">
            Menu
          </Link>{" "}
          · <span className="text-primary">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 md:mt-8 md:grid-cols-2 md:gap-12">
          <div>
            <div className="aspect-square overflow-hidden rounded-md border border-border/70 bg-secondary sm:aspect-[4/5]">
              <img
                src={product.gallery[active] || product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {product.gallery.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {product.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 sm:h-20 sm:w-20 ${active === i ? "border-accent" : "border-transparent"}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
              {product.category}
            </span>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-3 font-serif text-lg text-muted-foreground sm:text-xl">
              {product.tagline}
            </p>
            <div className="mt-5 font-serif text-3xl text-primary">₹{variant.price}</div>

            <p className="mt-6 leading-relaxed text-primary/80">{product.description}</p>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Choose your option
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-full border px-4 py-2 text-xs transition ${
                      v.id === variantId
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-primary/80 hover:border-primary/50"
                    }`}
                  >
                    {v.label} · ₹{v.price}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
              <div className="inline-flex items-center rounded-full border border-border">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="rounded-full p-3 transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="rounded-full p-3 transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  add(product.id, variant.id, qty);
                  toast.success(`Added ${qty} × ${product.name}`);
                }}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark sm:flex-none"
              >
                Add to Cart · ₹{variant.price * qty}
              </button>
              <a
                href={whatsappLink(
                  `Hi, I'd like to order ${qty} × ${product.name} (${variant.label}) — ₹${variant.price * qty}.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:bg-cocoa-dark active:text-primary-foreground sm:flex-none"
              >
                Order on WhatsApp <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x mt-16 md:mt-24">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5 md:mb-10">
          <h2 className="font-serif text-2xl text-primary sm:text-3xl md:text-4xl">
            You might also love
          </h2>
          <Link to="/menu" className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-accent">
            See full menu
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
