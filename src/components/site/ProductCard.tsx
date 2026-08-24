import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getProducts,
  findProduct,
  whatsappLink,
  type Product,
} from "@/lib/products";
import { useCart } from "@/lib/cart";
import {
  Minus,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategoryLabels, type CategoryLabels } from "@/lib/categories";

export const Route = createFileRoute("/_site/product/$id")({
  loader: async ({ params }) => {
    const all = await getProducts();
    const product = findProduct(all, params.id);

    if (!product) throw notFound();

    const related = all.filter((p) => p.id !== product.id).slice(0, 3);
    const categoryLabels = await getCategoryLabels();

    return {
      product,
      related,
      categoryLabels,
    };
  },

  head: ({ loaderData }) => {
    const p = loaderData?.product;

    return {
      meta: [
        {
          title: p
            ? `${p.name} — Little Brownie Co.`
            : "Little Brownie Co.",
        },
        {
          name: "description",
          content: p?.description ?? "",
        },
        {
          property: "og:title",
          content: p?.name ?? "",
        },
        {
          property: "og:description",
          content: p?.tagline ?? "",
        },
        {
          property: "og:type",
          content: "product",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
      ],
    };
  },

  notFoundComponent: () => (
    <div className="container-x py-32 text-center">
      <h1 className="font-serif text-4xl text-primary">
        Not baked yet.
      </h1>

      <Link
        to="/menu"
        className="mt-4 inline-block text-accent"
      >
        Back to menu
      </Link>
    </div>
  ),

  component: ProductPage,
});

function ProductPage() {
  const {
    product,
    related,
    categoryLabels,
  } = Route.useLoaderData() as {
    product: Product;
    related: Product[];
    categoryLabels: CategoryLabels;
  };

  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const { add } = useCart();

  const flavoursWithVariants = Array.from(
    new Set(
      product.variants
        .map((v) => v.flavour)
        .filter((f): f is string => !!f),
    ),
  );

  const [flavour, setFlavour] = useState<string | null>(
    flavoursWithVariants[0] ?? null,
  );

  const visibleVariants = flavoursWithVariants.length
    ? product.variants.filter(
        (v) => !v.flavour || v.flavour === flavour,
      )
    : product.variants;

  const [variantId, setVariantId] = useState(
    visibleVariants[0]!.id,
  );

  const variant =
    visibleVariants.find((v) => v.id === variantId) ??
    visibleVariants[0] ??
    product.variants[0]!;

  useEffect(() => {
    if (
      !visibleVariants.some((v) => v.id === variantId) &&
      visibleVariants[0]
    ) {
      setVariantId(visibleVariants[0].id);
    }
  }, [flavour]);

  return (
    <>
      {/* PRODUCT DETAILS */}
      <section className="container-x min-w-0 overflow-x-hidden pt-6 pb-12 md:pt-16 md:pb-16">
        <nav className="min-w-0 overflow-hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link
            to="/"
            className="hover:text-primary"
          >
            Home
          </Link>{" "}
          ·{" "}
          <Link
            to="/menu"
            className="hover:text-primary"
          >
            Menu
          </Link>{" "}
          ·{" "}
          <span className="text-primary">
            {product.name}
          </span>
        </nav>

        <div className="mt-6 grid min-w-0 max-w-full gap-8 md:mt-8 md:grid-cols-2 md:gap-12">
          {/* PRODUCT IMAGE */}
          <div className="min-w-0 max-w-full">
            <div className="group relative aspect-square w-full max-w-full overflow-hidden rounded-md border border-border/70 bg-secondary sm:aspect-[4/5]">
              <img
                src={
                  product.gallery[active] ||
                  product.image
                }
                alt={product.name}
                style={{
                  objectPosition:
                    (product.gallery.length
                      ? product.galleryPositions?.[active]
                      : undefined) ||
                    product.imagePosition ||
                    "center",
                }}
                className="block h-full w-full max-w-full object-cover"
              />

              {product.gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActive(
                        (i) =>
                          (i -
                            1 +
                            product.gallery.length) %
                          product.gallery.length,
                      )
                    }
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow-sm backdrop-blur sm:h-10 sm:w-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActive(
                        (i) =>
                          (i + 1) %
                          product.gallery.length,
                      )
                    }
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow-sm backdrop-blur sm:h-10 sm:w-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                    {product.gallery.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          i === active
                            ? "bg-primary"
                            : "bg-primary/30"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            {product.gallery.length > 1 && (
              <div className="mt-3 flex max-w-full gap-3 overflow-x-auto pb-1">
                {product.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 sm:h-20 sm:w-20 ${
                      active === i
                        ? "border-accent"
                        : "border-transparent"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={g}
                      alt=""
                      style={{
                        objectPosition:
                          product.galleryPositions?.[i] ||
                          "center",
                      }}
                      className="h-full w-full max-w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="min-w-0 flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
              {categoryLabels[product.category]}
            </span>

            <h1 className="mt-3 break-words font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
              {product.name}
            </h1>

            <p className="mt-3 font-serif text-lg text-muted-foreground sm:text-xl">
              {product.tagline}
            </p>

            <div className="mt-5 font-serif text-3xl text-primary">
              ₹{variant.price}
            </div>

            <p className="mt-6 break-words leading-relaxed text-primary/80">
              {product.description}
            </p>

            {/* FLAVOUR */}
            {flavoursWithVariants.length > 0 && (
              <div className="mt-8 min-w-0">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Choose your flavour
                </div>

                <div className="mt-3 flex max-w-full flex-wrap gap-2">
                  {flavoursWithVariants.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFlavour(f)}
                      className={`rounded-full border px-4 py-2 text-xs transition ${
                        f === flavour
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-primary/80 hover:border-primary/50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* OPTIONS */}
            <div className="mt-8 min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Choose your option
              </div>

              <div className="mt-3 flex max-w-full flex-wrap gap-2">
                {visibleVariants.map((v) => (
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

            {/* CART ACTIONS */}
            <div className="mt-8 flex min-w-0 max-w-full flex-wrap items-center gap-3 md:mt-10 md:gap-4">
              <div className="inline-flex shrink-0 items-center rounded-full border border-border">
                <button
                  onClick={() =>
                    setQty(Math.max(1, qty - 1))
                  }
                  className="rounded-full p-3 transition-colors hover:bg-caramel hover:text-cocoa active:bg-caramel-dark active:text-parchment"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="w-8 text-center">
                  {qty}
                </span>

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
                  add(
                    product.id,
                    variant.id,
                    qty,
                  );

                  toast.success(
                    `Added ${qty} × ${product.name}`,
                  );
                }}
                className="min-w-0 flex-1 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark sm:flex-none"
              >
                Add to Cart · ₹
                {variant.price * qty}
              </button>

              <a
                href={whatsappLink(
                  `Hi, I'd like to order ${qty} × ${
                    product.name
                  } (${variant.label}${
                    variant.flavour
                      ? `, ${variant.flavour}`
                      : ""
                  }) — ₹${
                    variant.price * qty
                  }.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:bg-cocoa-dark active:text-primary-foreground sm:flex-none"
              >
                Order on WhatsApp
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      <section className="container-x min-w-0 max-w-full overflow-x-hidden mt-16 md:mt-24">
        <div className="mb-8 flex min-w-0 max-w-full items-end justify-between gap-4 border-b border-border pb-5 md:mb-10">
          <h2 className="min-w-0 font-serif text-2xl text-primary sm:text-3xl md:text-4xl">
            You might also love
          </h2>

          <Link
            to="/menu"
            className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.18em] text-accent"
          >
            See full menu
          </Link>
        </div>

        {/* IMPORTANT:
            min-w-0 prevents grid children from forcing the
            section wider than the mobile viewport.
        */}
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {related.map((p) => (
            <div
              key={p.id}
              className="min-w-0 w-full max-w-full overflow-hidden"
            >
              <ProductCard
                product={p}
                categoryLabel={categoryLabels[p.category]}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
