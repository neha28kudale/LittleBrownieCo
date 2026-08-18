import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Recycle, Droplet, Wind } from "lucide-react";

export const Route = createFileRoute("/_site/sustainable-packaging")({
  head: () => ({
    meta: [
      { title: "Sustainable Packaging — Little Brownie Co." },
      {
        name: "description",
        content: "Learn about our eco-friendly packaging initiatives and commitment to sustainability.",
      },
      {
        property: "og:title",
        content: "Sustainable Packaging — Little Brownie Co.",
      },
      {
        property: "og:description",
        content: "Discover how Little Brownie Co. is reducing environmental impact through sustainable packaging.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SustainablePackaging,
});

function SustainablePackaging() {
  return (
    <section className="container-x py-10 md:py-16">
      <div className="max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Our Commitment</span>
        <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl md:text-6xl">
          Sustainable Packaging
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          At Little Brownie Co., we believe that great taste and environmental responsibility go
          hand in hand. Our commitment to sustainable packaging is an integral part of how we
          operate as a modern, conscious business.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary/30 p-6">
          <Leaf className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Eco-Friendly Materials</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            All our packaging is made from recyclable and biodegradable materials. We use kraft
            paper boxes, recycled cardboard, and natural binding materials that minimize
            environmental impact.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-6">
          <Recycle className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-2xl text-primary">100% Recyclable</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Every component of our packaging can be recycled. Even our stickers use sustainable
            adhesives. We encourage our customers to recycle or compost their boxes after use.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-6">
          <Droplet className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Water-Based Inks</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Our labels and branding are printed with water-based, non-toxic inks that are safe
            for recycling and composting processes.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-6">
          <Wind className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Minimal Waste</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We minimize packaging waste by using efficient designs that reduce excess material
            while ensuring your brownies arrive fresh and protected.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border bg-card p-8">
        <h2 className="font-serif text-2xl text-primary">Our Journey</h2>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            When we started Little Brownie Co., we made a conscious decision to prioritize
            sustainability. We recognized that small choices in packaging can collectively make
            a big difference for our planet.
          </p>
          <p>
            Every brownie box that leaves our kitchen carries our values. We've eliminated single-use
            plastics entirely, and we're continuously exploring new ways to reduce our environmental
            footprint. Our goal is to make every delivery one step closer to a more sustainable future.
          </p>
          <p>
            By choosing Little Brownie Co., you're not just enjoying premium brownies made with
            Belgian chocolate and cultured butter—you're also supporting a business that cares about
            the environment.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-accent/20 bg-accent/5 p-8">
        <h2 className="font-serif text-2xl text-primary">How You Can Help</h2>
        <ul className="mt-6 space-y-3 text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
            <span>Recycle our packaging boxes along with your regular recycling.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
            <span>Compost the padding materials if you use composting services.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
            <span>Reuse the boxes for storage or gifting—they're sturdy and beautiful.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
            <span>Spread the word about sustainable packaging and conscious businesses.</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Questions about our packaging or sustainability practices?{" "}
          <a href="/contact" className="text-accent hover:underline">
            Get in touch
          </a>
        </p>
      </div>
    </section>
  );
}
