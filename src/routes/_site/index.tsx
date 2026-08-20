// import { createFileRoute, Link } from "@tanstack/react-router";
// import { ArrowRight, ArrowUpRight, MessageCircleMore, Star } from "lucide-react";
// import { useEffect, useState } from "react";
// import {
//   IMG,
//   getProducts,
//   signatureOf,
//   fromPrice,
//   whatsappLink,
//   GOOGLE_REVIEWS_URL,
//   type Product,
// } from "@/lib/products";
// import { getApprovedReviews, getGoogleReviews, type Review } from "@/lib/reviews";
// import { ProductCard } from "@/components/site/ProductCard";
// import { Reveal } from "@/components/site/Reveal";

// export const Route = createFileRoute("/_site/")({
//   loader: async () => ({ products: await getProducts() }),
//   head: () => ({
//     meta: [
//       { title: "Little Brownie Co. | Handcrafted Brownies in Bengaluru" },
//       {
//         name: "description",
//         content:
//           "Handcrafted, small-batch brownies from Bengaluru. Order online — Belgian chocolate, cultured butter, baked fresh to order.",
//       },
//       { property: "og:title", content: "Little Brownie Co. | Handcrafted Brownies in Bengaluru" },
//       {
//         property: "og:description",
//         content: "Where every bite earns you brownie points. Order online from Bengaluru.",
//       },
//       { property: "og:type", content: "website" },
//       { name: "twitter:card", content: "summary_large_image" },
//     ],
//   }),
//   component: Home,
// });

// function Home() {
//   const { products } = Route.useLoaderData() as { products: Product[] };
//   const signature = signatureOf(products);
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [googleRating, setGoogleRating] = useState<{ rating: number; count: number } | null>(
//     null,
//   );

//   useEffect(() => {
//     getApprovedReviews().then((r) => setReviews(r.slice(0, 4)));
//     getGoogleReviews().then((g) => {
//       if (g.configured && g.rating != null && g.ratingCount != null) {
//         setGoogleRating({ rating: g.rating, count: g.ratingCount });
//       }
//     });
//   }, []);

//   return (
//     <>
//       {/* HERO */}
//       <section className="relative overflow-hidden">
//         <div className="container-x grid gap-10 pb-12 pt-10 md:grid-cols-12 md:items-center md:gap-8 md:pb-24 md:pt-20">
//           <div className="md:col-span-6 flex flex-col justify-center">
//             <div className="overflow-hidden rounded-[1.2rem] border border-border/80 shadow-soft">
//               <img
//                 src={IMG.headerBanner}
//                 alt="Little Brownie Co. — where every bite earns you brownie points"
//                 className="h-auto w-full object-cover"
//               />
//             </div>
//             <h1 className="mt-6 max-w-2xl font-serif text-[2.6rem] leading-[0.98] text-primary sm:text-[3.35rem] sm:leading-[0.94] md:text-[6rem]">
//               Brownies made for the little moments that matter.
//             </h1>
//             <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
//               Brownies made for the little moments that matter. Crafted with premium ingredients
//               and baked fresh in small batches, our brownies are irresistibly rich and fudgy, with
//               a delicate crackly top and an indulgently gooey centre.
//             </p>
//             <div className="mt-8 flex flex-wrap items-center gap-3">
//               <Link
//                 to="/menu"
//                 className="inline-flex items-center gap-2 rounded-full border border-primary/80 px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary transition hover:bg-primary hover:text-primary-foreground"
//               >
//                 View Menu
//               </Link>
//               <Link
//                 to="/menu"
//                 className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
//               >
//                 Order <ArrowRight className="h-4 w-4" />
//               </Link>
//             </div>
//             <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-primary/80">
//               <a
//                 href={whatsappLink(
//                   "Hi Little Brownie Co., I'd like a quote for gifting or a custom order.",
//                 )}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="inline-flex items-center gap-2 hover:text-accent"
//               >
//                 <MessageCircleMore className="h-4 w-4 text-accent" /> Request a Quote on WhatsApp
//               </a>
//             </div>
//             <div className="mt-10 max-w-xl border-t border-border/70 pt-7">
//               <p className="font-serif text-2xl leading-tight text-primary md:text-3xl">
//                 Rich. Fudgy. Gooey. The kind of brownie you take your time with.
//               </p>
//             </div>
//           </div>
//           <div className="relative md:col-span-6 md:pl-10">
//             <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-border/80 bg-card shadow-display">
//               <img
//                 src={IMG.biteSizedHand}
//                 alt="A single bite-sized Little Brownie Co. brownie held in hand"
//                 className="h-full w-full object-cover"
//               />
//             </div>
//             <div className="absolute -bottom-8 left-6 hidden w-48 rounded-[1.25rem] border border-border/70 bg-background/98 p-5 shadow-soft md:block">
//               <div className="text-[10px] uppercase tracking-[0.3em] text-toffee">Baked Fresh</div>
//               <p className="mt-3 font-serif text-[1.55rem] leading-tight text-primary">
//                 From birthday cakes to brownie trays, everything is packed the day it leaves our
//                 kitchen.
//               </p>
//             </div>
//             <div className="absolute -right-6 top-8 hidden h-34 w-34 items-center justify-center rounded-full border-4 border-background bg-surface-soft p-5 text-center font-serif text-base leading-tight text-primary shadow-display md:flex">
//               Where every bite earns brownie points.
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* SIGNATURE */}
//       <Reveal as="section" className="mt-20 md:mt-28">
//         <div className="container-x">
//           <div className="max-w-2xl">
//             <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
//               THE SIGNATURE COLLECTION
//             </span>
//             <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
//               Recipes we're known for.
//             </h2>
//             <p className="mt-5 text-muted-foreground">
//               From timeless classics to indulgent favourites, there's a brownie for every kind of
//               craving.
//             </p>
//           </div>
//           <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
//             {signature.map((p) => (
//               <Link key={p.id} to="/product/$id" params={{ id: p.slug }} className="group">
//                 <div className="aspect-square overflow-hidden rounded-md">
//                   <img
//                     src={p.square}
//                     alt={p.name}
//                     loading="lazy"
//                     className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
//                   />
//                 </div>
//                 <div className="mt-4 font-serif text-lg text-primary">{p.name}</div>
//                 <div className="text-xs uppercase tracking-wider text-muted-foreground">
//                   from ₹{fromPrice(p)}
//                 </div>
//               </Link>
//             ))}
//           </div>
//           <div className="mt-10 text-center">
//             <Link
//               to="/menu"
//               className="inline-flex items-center gap-1 text-sm uppercase tracking-[0.18em] text-accent hover:text-primary"
//             >
//               View full menu <ArrowUpRight className="h-4 w-4" />
//             </Link>
//           </div>
//         </div>
//       </Reveal>

//       {/* REVIEWS */}
//       <Reveal as="section" className="mt-20 bg-[oklch(0.9_0.03_78)] py-24">
//         <div className="container-x">
//           <div className="mx-auto max-w-2xl text-center">
//             <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Kind words</span>
//             <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
//               Baked with love, reviewed with love.
//             </h2>
//             <a
//               href={GOOGLE_REVIEWS_URL}
//               target="_blank"
//               rel="noreferrer"
//               className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
//             >
//               {googleRating
//                 ? `${googleRating.rating.toFixed(1)}★ on Google (${googleRating.count} reviews)`
//                 : "Read our Google reviews"}{" "}
//               <ArrowUpRight className="h-3.5 w-3.5" />
//             </a>
//           </div>
//           {reviews.length > 0 ? (
//             <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
//               {reviews.map((r) => (
//                 <figure key={r.id} className="flex flex-col rounded-md bg-background p-6">
//                   <div className="flex gap-0.5 text-accent">
//                     {Array.from({ length: r.rating }).map((_, i) => (
//                       <Star key={i} className="h-4 w-4 fill-current" />
//                     ))}
//                   </div>
//                   <blockquote className="mt-4 flex-1 font-serif text-lg leading-snug text-primary">
//                     "{r.text}"
//                   </blockquote>
//                   <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
//                     {r.name}
//                     {r.location ? ` · ${r.location}` : ""}
//                   </figcaption>
//                 </figure>
//               ))}
//             </div>
//           ) : (
//             <div className="mx-auto mt-14 max-w-md text-center text-sm text-muted-foreground">
//               Be the first to{" "}
//               <Link to="/reviews" className="text-accent hover:underline">
//                 leave a review
//               </Link>
//               , or read what customers say on Google.
//             </div>
//           )}
//         </div>
//       </Reveal>

//       {/* CTA */}
//       <Reveal as="section" className="container-x mt-20">
//         <div className="rounded-[1.2rem] border border-border bg-secondary/50 px-5 py-12 text-center sm:px-8 md:py-24">
//           <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
//             Let's make it just right
//           </span>
//           <h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight text-primary md:text-5xl">
//             Let's make your brownie box just right.
//           </h2>
//           <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
//             Have a question or a special request? We're just a WhatsApp message away.
//           </p>
//           <a
//             href={whatsappLink("Hi Little Brownie Co., I'd like to place an order.")}
//             target="_blank"
//             rel="noreferrer"
//             className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
//           >
//             Chat on WhatsApp <ArrowUpRight className="h-4 w-4" />
//           </a>
//         </div>
//       </Reveal>
//     </>
//   );
// }
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MessageCircleMore, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  IMG,
  getProducts,
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

const HERO_GALLERY = [
  IMG.homeImg1,
  IMG.homeImg2,
  IMG.homeImg3,
  IMG.homeImg4,
  IMG.homeImg5,
  IMG.homeImg6,
  IMG.homeImg7,
  IMG.homeImg8,
];

function Home() {
  const { products } = Route.useLoaderData() as { products: Product[] };
  const signature = signatureOf(products);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleRating, setGoogleRating] = useState<{ rating: number; count: number } | null>(
    null,
  );
  const [heroSlide, setHeroSlide] = useState(0);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const heroPausedRef = useRef(false);

  useEffect(() => {
    getApprovedReviews().then((r) => setReviews(r.slice(0, 4)));
    getGoogleReviews().then((g) => {
      if (g.configured && g.rating != null && g.ratingCount != null) {
        setGoogleRating({ rating: g.rating, count: g.ratingCount });
      }
    });
  }, []);

  const scrollHeroTo = (index: number) => {
    const el = heroScrollRef.current;
    if (!el) return;
    const clamped = (index + HERO_GALLERY.length) % HERO_GALLERY.length;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setHeroSlide(clamped);
  };

  const handleHeroScroll = () => {
    const el = heroScrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setHeroSlide(index);
  };

  // Auto-advance the hero gallery every 4s; pause while the user is
  // hovering, touching, or has just interacted with it.
  useEffect(() => {
    if (HERO_GALLERY.length <= 1) return;
    const interval = setInterval(() => {
      if (heroPausedRef.current) return;
      setHeroSlide((prev) => {
        const next = (prev + 1) % HERO_GALLERY.length;
        const el = heroScrollRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const pauseHeroAutoplay = () => {
    heroPausedRef.current = true;
  };
  const resumeHeroAutoplay = () => {
    // brief delay so a manual tap/scroll doesn't immediately get
    // overridden by the next auto-advance tick
    setTimeout(() => {
      heroPausedRef.current = false;
    }, 1500);
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid gap-10 pb-10 pt-8 md:grid-cols-12 md:items-center md:gap-8 md:pb-16 md:pt-14">
          <div className="md:col-span-6 flex flex-col justify-center">
            <div className="overflow-hidden rounded-[1.2rem] border border-border/80 shadow-soft">
              <img
                src={IMG.headerBanner}
                alt="Little Brownie Co. — where every bite earns you brownie points"
                className="h-auto w-full object-cover"
              />
            </div>
            <h1 className="mt-6 max-w-2xl font-serif text-[2.6rem] leading-[0.98] text-primary sm:text-[3.35rem] sm:leading-[0.94] md:text-[6rem]">
              Brownies made for the little moments that matter.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Crafted with premium ingredients
              and baked fresh in small batches, our brownies are irresistibly rich and fudgy, with
              a delicate crackly top and an indulgently gooey centre.
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
            <div className="mt-10 max-w-xl border-t border-border/70 pt-7">
              <p className="font-serif text-2xl leading-tight text-primary md:text-3xl">
                Rich. Fudgy. Gooey. The kind of brownie you take your time with.
              </p>
            </div>
          </div>
          <div className="relative md:col-span-6 md:pl-10">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-border/80 bg-card shadow-display"
              onMouseEnter={pauseHeroAutoplay}
              onMouseLeave={resumeHeroAutoplay}
              onTouchStart={pauseHeroAutoplay}
              onTouchEnd={resumeHeroAutoplay}
            >
              <div
                ref={heroScrollRef}
                onScroll={handleHeroScroll}
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {HERO_GALLERY.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Little Brownie Co. brownies"
                    className="h-full w-full flex-shrink-0 snap-center object-cover"
                  />
                ))}
              </div>
              {HERO_GALLERY.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => {
                      pauseHeroAutoplay();
                      scrollHeroTo(heroSlide - 1);
                      resumeHeroAutoplay();
                    }}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow-soft transition hover:bg-background"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => {
                      pauseHeroAutoplay();
                      scrollHeroTo(heroSlide + 1);
                      resumeHeroAutoplay();
                    }}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow-soft transition hover:bg-background"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {HERO_GALLERY.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Go to photo ${i + 1}`}
                        onClick={() => {
                          pauseHeroAutoplay();
                          scrollHeroTo(i);
                          resumeHeroAutoplay();
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          i === heroSlide ? "w-5 bg-background" : "w-1.5 bg-background/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
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

      {/* SIGNATURE */}
      <Reveal as="section" className="mt-14 md:mt-20">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
              THE SIGNATURE COLLECTION
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
              Recipes we're known for.
            </h2>
            <p className="mt-5 text-muted-foreground">
              From timeless classics to indulgent favourites, there's a brownie for every kind of
              craving.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {signature.map((p) => (
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
          <div className="mt-10 text-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-1 text-sm uppercase tracking-[0.18em] text-accent hover:text-primary"
            >
              View full menu <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* REVIEWS */}
      <Reveal as="section" className="mt-14 bg-[oklch(0.9_0.03_78)] py-16">
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
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="mx-auto mt-10 max-w-md text-center text-sm text-muted-foreground">
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
      <Reveal as="section" className="container-x mt-14">
        <div className="rounded-[1.2rem] border border-border bg-secondary/50 px-5 py-10 text-center sm:px-8 md:py-16">
          <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
            Let's make it just right
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight text-primary md:text-5xl">
            Let's make your brownie box just right.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Have a question or a special request? We're just a WhatsApp message away.
          </p>
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
