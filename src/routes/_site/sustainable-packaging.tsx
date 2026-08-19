import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
// TODO: import the green sustainable-packaging poster from Google Drive once confirmed, e.g.:
// import sustainablePosterImg from "@/assets/sustainable-poster.jpg";

export const Route = createFileRoute("/_site/sustainable-packaging")({
  head: () => ({
    meta: [
      { title: "Sustainable Packaging — Little Brownie Co." },
      {
        name: "description",
        content:
          "Baked with care, packed with purpose — how Little Brownie Co. uses eco-friendly Kraft paper packaging.",
      },
      {
        property: "og:title",
        content: "Sustainable Packaging — Little Brownie Co.",
      },
      {
        property: "og:description",
        content:
          "We use eco-friendly, sustainable Kraft paper packaging across our brownie boxes, covers and tubs.",
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
      <div className="grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-6">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-toffee">
            <Leaf className="h-4 w-4" />
            Good to Know
          </span>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
            Baked with care. Packed with purpose.
          </h1>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              We believe that great brownies and thoughtful choices can go hand in hand. That's
              why we use eco-friendly, sustainable Kraft paper packaging across our brownie boxes,
              covers and tubs — a simple, more conscious alternative to conventional plastic
              packaging.
            </p>
            <p>
              It's one of the little ways we're doing our bit to reduce unnecessary plastic and
              make more conscious choices, without compromising on the experience of receiving
              your brownies.
            </p>
            <p>
              Sustainability doesn't have to be complicated. Sometimes, it starts with something
              as simple as the box your brownies come in.
            </p>
            <p>
              Because every brownie deserves a beautiful box — and every box can be a little
              kinder to the planet. 🌿
            </p>
          </div>
        </div>

        <div className="md:col-span-6">
          {/* TODO: replace with the green sustainable-packaging poster image once confirmed */}
          <div className="flex aspect-[4/5] items-center justify-center rounded-[1rem] border border-dashed border-border/70 bg-secondary/30 text-center text-sm text-muted-foreground">
            Green poster image goes here
          </div>
        </div>
      </div>
    </section>
  );
}
