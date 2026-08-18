import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MessageCircleMore, Star } from "lucide-react";
import { useEffect, useState } from "react";
import {
  IMG,
  getProducts,
  bestSellersOf,
  signatureOf,
  fromPrice,
  whatsappLink,
  GOOGLE_REVIEWS_URL,
  type Product,
} from "@/lib/products";
import { getApprovedReviews, getGoogleReviews, type Review } from "@/lib/reviews";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/_site/")({
  loader: async () => ({ products: await getProducts() }),
  head: () => ({
    meta: [
      { title: "Little Brownie Co. | Handcrafted Brownies in Bengaluru" },
      {
        name: "description",
        content:
          "Handcrafted, small-batch brownies from Bengaluru. Order online — Belgian chocolate, cultured butter, baked fresh to order.",
      },
      { property: "og:title", content: "Little Brownie Co. | Handcrafted Brownies in Bengaluru" },
      {
        property: "og:description",
        content: "Where every bite earns you brownie points. Order online from Bengaluru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { products } = Route.useLoaderData() as { products: Product[] };
  const bestSellers = bestSellersOf(products);
  const signature = signatureOf(products);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleRating, setGoogleRating] = useState<{ rating: number; count: number } | null>(
    null,
  );

  useEffect(() => {
    getApprovedReviews().then((r) => setReviews(r.slice(0, 4)));
    getGoogleReviews().then((g) => {
      if (g.configured && g.rating != null && g.ratingCount != null) {
        setGoogleRating({ rating: g.rating, count: g.ratingCount });
      }
    });
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid gap-10 pb-12 pt-10 md:grid-cols-12 md:items-center md:gap-8 md:pb-24 md:pt-20">
          <div className="md:col-span-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-toffee">
              <span className="inline-flex items-center rounded-full border border-border/80 bg-surface px-4 py-1.5">
                Bengaluru · Baked Fresh
              </span>
              <span className="inline-flex items-center rounded-full border border-accent/40 bg-secondary px-4 py-1.5 text-primary">
                Belgian Chocolate
              </span>
              <span className="inline-flex items-center rounded-full border border-accent/40 bg-secondary px-4 py-1.5 text-primary">
                Eco-Friendly Packaging
              </span>
            </div>
            <h1 className="mt-6 max-w-2xl font-serif text-[2.6rem] leading-[0.98] text-primary sm:text-[3.35rem] sm:leading-[0.94] md:text-[6rem]">
              Brownies baked with a quieter kind of luxury.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Belgian couverture, cultured butter, and small daily batches packed by hand from our
              Bengaluru kitchen.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full border border-primary/80 px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                View Menu
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
              >
                Order <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-primary/80">
              <a
                href={whatsappLink(
                  "Hi Little Brownie Co., I'd like a quote for gifting or a custom order.",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-accent"
              >
                <MessageCircleMore className="h-4 w-4 text-accent" /> Request a Quote on WhatsApp
              </a>
            </div>
            <div className="mt-10 grid max-w-xl gap-5 border-t border-border/70 pt-7 sm:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Chocolate Used</div>
                <div className="mt-2 font-serif text-2xl leading-tight text-primary">
                  Belgian Couverture
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Batches</div>
                <div className="mt-2 font-serif text-2xl leading-tight text-primary">
                  Small, Daily
                </div>
              </div>
            </div>
          </div>
          <div className="relative md:col-span-6 md:pl-10">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-border/80 bg-card shadow-display">
              <img
                src={IMG.heroPortrait}
                alt="Little Brownie Co. brownie celebration cake"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 left-6 hidden w-48 rounded-[1.25rem] border border-border/70 bg-background/98 p-5 shadow-soft md:block">
              <div className="text-[10px] uppercase tracking-[0.3em] text-toffee">Baked Fresh</div>
              <p className="mt-3 font-serif text-[1.55rem] leading-tight text-primary">
                From birthday cakes to brownie trays, everything is packed the day it leaves our
                kitchen.
              </p>
            </div>
            <div className="absolute -right-6 top-8 hidden h-34 w-34 items-center justify-center rounded-full border-4 border-background bg-surface-soft p-5 text-center font-serif text-base leading-tight text-primary shadow-display md:flex">
              Where every bite earns brownie points.
            </div>
          </div>
        </div>
      </section>

      <Divider label="Best Sellers" caption="The ones everyone comes back for" />
      <section className="container-x">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* SIGNATURE */}
      <Reveal as="section" className="mt-20 md:mt-28">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
              The Signature Collection
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
              Recipes we're
              <br />
              known for.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Six years of tinkering, one obsessive standard: fudgy in the middle, crackled on top.
            </p>
            <Link
              to="/menu"
              className="mt-6 inline-flex items-center gap-1 text-sm uppercase tracking-[0.18em] text-accent hover:text-primary"
            >
              View full menu <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="md:col-span-8 grid grid-cols-2 gap-6 md:grid-cols-3">
            {signature.slice(0, 3).map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.slug }} className="group">
                <div className="aspect-square overflow-hidden rounded-md">
                  <img
                    src={p.square}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 font-serif text-lg text-primary">{p.name}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  from ₹{fromPrice(p)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* REVIEWS */}
      <Reveal as="section" className="mt-20 bg-[oklch(0.9_0.03_78)] py-24">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Kind words</span>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
              Baked with love, reviewed with love.
            </h2>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              {googleRating
                ? `${googleRating.rating.toFixed(1)}★ on Google (${googleRating.count} reviews)`
                : "Read our Google reviews"}{" "}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          {reviews.length > 0 ? (
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-md bg-background p-6">
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 font-serif text-lg leading-snug text-primary">
                    "{r.text}"
                  </blockquote>
                  <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {r.name}
                    {r.location ? ` · ${r.location}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-14 max-w-md text-center text-sm text-muted-foreground">
              Be the first to{" "}
              <Link to="/reviews" className="text-accent hover:underline">
                leave a review
              </Link>
              , or read what customers say on Google.
            </div>
          )}
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal as="section" className="container-x mt-20">
        <div className="rounded-[1.2rem] border border-border bg-secondary/50 px-5 py-12 text-center sm:px-8 md:py-24">
          <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
            Order in a whisper
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight text-primary md:text-5xl">
            Message us on WhatsApp. We'll bake, box and deliver.
          </h2>
          <a
            href={whatsappLink("Hi Little Brownie Co., I'd like to place an order.")}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
          >
            Chat on WhatsApp <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </Reveal>
    </>
  );
}

function Divider({ label, caption }: { label: string; caption?: string }) {
  return (
    <div className="container-x mt-20 mb-14 flex items-end justify-between gap-8 border-b border-border/70 pb-6">
      <div>
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">The collection</span>
        <h2 className="mt-2 font-serif text-4xl leading-tight text-primary md:text-5xl">{label}</h2>
      </div>
      {caption && (
        <p className="hidden max-w-xs text-right text-sm text-muted-foreground md:block">
          {caption}
        </p>
      )}
    </div>
  );
}
