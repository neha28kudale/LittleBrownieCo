import { createFileRoute } from "@tanstack/react-router";
import storyImg from "@/assets/About.jpg";
import { BadgeCheck, MapPin, Sparkles } from "lucide-react";
import { FSSAI_NUMBER } from "@/lib/products";

import ab1 from "@/assets/real/ab1.jpg";
import ab2 from "@/assets/real/ab2.jpg";
import ab3 from "@/assets/real/ab3.jpg";
import ab4 from "@/assets/real/ab4.jpg";
import ab5 from "@/assets/real/ab5.jpg";
import ab6 from "@/assets/real/ab6.jpg";
import ab7 from "@/assets/real/ab7.jpg";
import ab8 from "@/assets/real/ab8.jpg";

const GALLERY_IMAGES = [ab1, ab2, ab3, ab4, ab5, ab6, ab7, ab8];

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About Us — Little Brownie Co." },
      {
        name: "description",
        content:
          "The story behind Little Brownie Co. — a family recipe, three women, and a whole lot of love for brownies.",
      },
      { property: "og:title", content: "About Us — Little Brownie Co." },
      {
        property: "og:description",
        content:
          "Three women. One family recipe. A whole lot of love for brownies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      {/* OUR STORY */}
      <section className="container-x pt-10 pb-10 md:pt-24 md:pb-16">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
          Our Story
        </span>

        <h1 className="mt-4 max-w-5xl font-serif text-3xl leading-[1.08] text-primary sm:text-5xl sm:leading-[1.05] md:text-7xl">
          Three women. One family recipe. A whole lot of love for brownies.
        </h1>
      </section>

      <section className="container-x grid gap-8 md:grid-cols-12 md:items-start md:gap-12">
        {/* STORY CONTENT */}
        <div className="md:col-span-7 space-y-6 text-sm leading-relaxed text-primary/80">
          <p>
            What began as a little tradition at home eventually became the
            beginning of Little Brownie Co.
          </p>

          <p>
            Growing up, brownies were never an everyday treat in our home.
            They were usually made for birthdays, celebrations, or whenever we
            wanted to make a day a little more special. We’d watch our mom
            bake, wait for the familiar smell of chocolate to fill the house,
            and sneak a little taste whenever we could.
          </p>

          <p>
            It was a simple family tradition, but one that gave us some of our
            fondest memories. Over the years, those brownies became more than
            just a recipe — they became something we genuinely loved and wanted
            to share beyond our home.
          </p>

          <p>
            And that’s how Little Brownie Co. came to life.
          </p>

          <h2 className="pt-4 font-serif text-3xl leading-tight text-primary sm:text-4xl">
            A little brownie, made a little differently.
          </h2>

          <p>
            We wanted to make brownies that were not only delicious, but easy
            to enjoy whenever a craving struck. That’s what led us to our mini
            brownies — and we’re proud to have been the first to introduce them
            in Bangalore.
          </p>

          <p>
            Each mini brownie is baked individually, giving every piece the
            soft, gooey centre, rich chocolate flavour and freshly baked
            texture we love.
          </p>

          <p>
            As a small, homegrown bakery, we keep our batches small and bake
            fresh to order. We use quality ingredients in every batch and
            maintain a clean, hygienic baking setup. For us, it’s not just
            about how the brownie tastes, but also about the care and attention
            that goes into making it.
          </p>

          <p>
            What started as a family recipe and a simple idea in our kitchen
            has grown into the heart of Little Brownie Co. Seeing our brownies
            become part of your celebrations, cravings and everyday moments
            has been incredibly special to us.
          </p>

          <p>
            At its heart, Little Brownie Co. is about family, quality, and the
            joy of sharing something we’ve loved for years.
          </p>

          <p>
            From our family to yours, we hope our brownies become a little part
            of your story, too. 🤎
          </p>

          <div className="pt-2">
            <p className="font-serif text-xl text-primary">— Pragathi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Founder, Little Brownie Co.
            </p>
          </div>
        </div>

        {/* STORY IMAGE */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-border/70 shadow-soft">
            <img
              src={storyImg}
              alt="Little Brownie Co. — fudgy brownie slab topped with roasted almonds and chocolate drizzle"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* BRAND HIGHLIGHTS */}
      <section className="container-x mt-16 grid gap-6 md:mt-24 md:grid-cols-3">
        {[
          {
            icon: MapPin,
            title: "Bengaluru based",
            body: "Baked and packed fresh, delivered across Bengaluru — next day onwards (no same-day delivery).",
          },
          {
            icon: BadgeCheck,
            title: "FSSAI Certified",
            body: `Registration No. ${FSSAI_NUMBER}. Traceable ingredients, hygienic kitchen.`,
          },
          {
            icon: Sparkles,
            title: "Small-batch always",
            body: "Never mass-produced. Every square hand-cut and inspected before it ships.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-md border border-border bg-card p-8"
          >
            <Icon className="h-6 w-6 text-accent" />

            <h3 className="mt-4 font-serif text-2xl text-primary">
              {title}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </section>

      {/* PHOTO GALLERY */}
      <section className="mt-16 mb-4 md:mt-24">
        <div className="container-x mb-6">
          <h3 className="font-serif text-2xl text-primary sm:text-3xl">
            A peek behind the scenes
          </h3>
        </div>

        <div className="container-x">
          <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className="aspect-[4/5] w-56 flex-shrink-0 overflow-hidden rounded-[1rem] border border-border/70 shadow-soft sm:w-64"
              >
                <img
                  src={img}
                  alt={`Little Brownie Co. — behind the scenes photo ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
