import { createFileRoute, Link } from "@tanstack/react-router";
import { getProducts, hampersOf, IMG, giftingGallery, fromPrice, whatsappLink, type Product } from "@/lib/products";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_site/gifts")({
  loader: async () => ({ products: await getProducts() }),
  head: () => ({
    meta: [
      { title: "Gift Hampers — Little Brownie Co." },
      {
        name: "description",
        content:
          "Send a little joy. Curated brownie gift hampers, celebration cakes and corporate boxes from Bengaluru.",
      },
      { property: "og:title", content: "Gift Hampers — Little Brownie Co." },
      {
        property: "og:description",
        content: "Corporate, wedding and festive brownie hampers, hand-tied and delivered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gifts,
});

function Gifts() {
  const { products } = Route.useLoaderData() as { products: Product[] };
  const hampers = hampersOf(products);
  return (
    <>
      <section className="container-x grid gap-8 pt-10 pb-12 md:grid-cols-12 md:gap-10 md:pt-24 md:pb-16">
        <div className="md:col-span-6">
          <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
            Gifting Collection
          </span>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl md:text-7xl">
            Wrapped, ribboned,
            <br />
            ready to <em className="not-italic text-accent">delight.</em>
          </h1>
          <p className="mt-6 max-w-lg text-muted-foreground md:text-lg">
            From Diwali baskets to corporate thank-yous, our hampers are curated by hand and packed
            in kraft boxes with satin ribbon. Custom notes, logos and dietary swaps all welcome.
          </p>
          <a
            href={whatsappLink("Hi! I'd like to enquire about custom gift hampers.")}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
          >
            Custom Enquiry <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          <div className="aspect-[3/4] overflow-hidden rounded-[1rem] border border-border/70 shadow-soft md:mt-14">
            <img
              src={IMG.hamperWoodenBox}
              alt="Ribbon-tied wooden brownie gift box"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-[3/4] overflow-hidden rounded-[1rem] border border-border/70 shadow-soft">
            <img
              src={IMG.hamperBagHeart}
              alt="Kraft gift bag with hand-stamped hearts, ribbon-tied"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-x mt-4 md:mt-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {giftingGallery.map((g) => (
            <div key={g.src} className="aspect-square overflow-hidden rounded-md border border-border/70 shadow-soft">
              <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-12 space-y-16 md:mt-16 md:space-y-24">
        {hampers.map((p, i) => (
          <article
            key={p.id}
            className={`grid gap-10 md:grid-cols-2 md:items-center ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}
          >
            <div className="aspect-square overflow-hidden rounded-md border border-border/70 sm:aspect-[4/5]">
              <img
                src={p.image}
                loading="lazy"
                alt={p.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
                {p.category}
              </span>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
                {p.name}
              </h2>
              <p className="mt-4 text-muted-foreground">{p.description}</p>
              <div className="mt-4 font-serif text-2xl text-primary">from ₹{fromPrice(p)}</div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/product/$id"
                  params={{ id: p.slug }}
                  className="rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
                >
                  View details
                </Link>
                <a
                  href={whatsappLink(
                    `Hi, I'm interested in the ${p.name} (from ₹${fromPrice(p)}).`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Order on WhatsApp
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
