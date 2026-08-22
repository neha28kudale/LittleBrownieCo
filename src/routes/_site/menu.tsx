import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { MENU_CATEGORIES, type MenuCategory } from "@/lib/site-content";

type MenuSearch = {
  cat?: MenuCategory;
};

export const Route = createFileRoute("/_site/menu")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => {
    const cat = search.cat as string | undefined;
    if (cat && MENU_CATEGORIES.includes(cat as MenuCategory)) {
      return { cat: cat as MenuCategory };
    }
    return {};
  },
  loader: async () => ({ products: await getProducts() }),
  head: () => ({
    meta: [
      { title: "The Menu — Little Brownie Co." },
      {
        name: "description",
        content:
          "Explore our full menu of small-batch brownie tubs, loaves, boxes, slabs and celebration cakes with live pricing.",
      },
      { property: "og:title", content: "The Menu — Little Brownie Co." },
      {
        property: "og:description",
        content: "Fudgy, small-batch brownies made to order in Bengaluru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Menu,
});

const categories = ["All", ...MENU_CATEGORIES] as const;

function Menu() {
  const { products } = Route.useLoaderData() as { products: Product[] };
  const { cat: searchCat } = Route.useSearch();
  const [cat, setCat] = useState<(typeof categories)[number]>(searchCat ?? "All");

  useEffect(() => {
    setCat(searchCat ?? "All");
  }, [searchCat]);

  const filtered = cat === "All" ? products : products.filter((p) => p.category === cat);

  return (
    <>
      <section className="container-x pt-10 pb-6 text-center md:pt-20 md:pb-8">
        <span className="text-base uppercase tracking-[0.28em] text-toffee md:text-lg">The Menu</span>
        <h1 className="mx-auto mt-3 max-w-4xl font-serif text-5xl leading-[1.05] text-primary sm:text-6xl md:text-7xl">
          For cravings, celebrations and everything in between.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          From Mini brownie tubs and classic brownie slabs to loaves and celebration cakes, find
          something to suit every sweet moment — all baked fresh to order.
        </p>
      </section>

      <div className="sticky top-16 z-30 border-y border-border bg-background/90 backdrop-blur md:top-20">
        <div className="container-x -mx-4 flex justify-start gap-2 overflow-x-auto px-4 py-3 md:mx-0 md:justify-center md:px-0 md:py-4">
          {categories.map((c) => (
            <Link
              key={c}
              to="/menu"
              search={c === "All" ? {} : { cat: c }}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition sm:px-4 sm:text-xs sm:tracking-[0.16em] ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-primary/70 hover:border-primary/50"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      <section className="container-x mt-8 md:mt-12">
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 6) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl text-primary">Nothing here yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {cat === "Limited Editions"
                ? "Limited edition flavours will appear here when available."
                : "Check back soon, or browse the full menu."}
            </p>
            <Link
              to="/menu"
              className="mt-6 inline-flex rounded-full border border-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:bg-cocoa-dark active:text-primary-foreground"
            >
              View all
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
