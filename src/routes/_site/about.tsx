import { createFileRoute } from "@tanstack/react-router";
import storyImg from "@/assets/story.jpeg";
import { BadgeCheck, Leaf, MapPin, Recycle, Sparkles, TriangleAlert } from "lucide-react";
import { ALLERGENS, FSSAI_NUMBER, IMG } from "@/lib/products";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About Us — Little Brownie Co." },
      {
        name: "description",
        content:
          "A home bakery from Bengaluru, baking small-batch brownies with Belgian chocolate and cultured butter. FSSAI certified.",
      },
      { property: "og:title", content: "About Us — Little Brownie Co." },
      { property: "og:description", content: "Where every bite earns you brownie points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="container-x pt-10 pb-10 md:pt-24 md:pb-16">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">About Us</span>
        <h1 className="mt-4 max-w-4xl font-serif text-3xl leading-[1.08] text-primary sm:text-5xl sm:leading-[1.05] md:text-7xl">
          Hi, I’m Pragathi &hearts;
        </h1>
      </section>

      <section className="container-x grid gap-8 md:grid-cols-12 md:items-start md:gap-12">
        <div className="md:col-span-7 space-y-6 text-lg leading-relaxed text-primary/80">
          <p>
            I’m an aerospace engineer by profession 🚀, someone who grew up valuing precision,
            discipline, and consistency — and a baker by passion 👩🏽‍🍳, led by creativity, patience,
            and heart. Somewhere between science and late-night baking experiments, Little Brownie
            Co. was born.✨ 
            </p>
            <p>
            What started as a simple love for baking slowly became a space where I
            pour my time, effort, and emotions — learning, refining, and growing with every batch 🤍
            </p>
            <p>
            I believe baking is not just about recipes, but about attention to detail, quality
            ingredients, and intention behind every single piece. Every brownie you see here is
            thoughtfully made — measured with care, baked with love, and created to feel just as
            special as it tastes 🍫✨ 
            </p> 
            <p>
            This page is a reflection of who I am, my journey, and my
            belief in doing things the right way — one brownie at a time. Thank you for being here,
            and welcome to Little Brownie Co. 🤎
          </p>
        </div>
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-border/70 shadow-soft">
            <img
              src={storyImg}
              alt="Fresh brownies arranged for a Little Brownie Co. tasting session"
              className="h-full w-full object-cover"
            />
          </div>
          {/* <div className="aspect-video overflow-hidden rounded-[1rem] border border-border/70 shadow-soft">
            <img
              src={IMG.about2}
              alt="A tray of Little Brownie Co. brownie bites during prep"
              className="h-full w-full object-cover"
            />
          </div> */}
        </div>
      </section>

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
          <div key={title} className="rounded-md border border-border bg-card p-8">
            <Icon className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-serif text-2xl text-primary">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {/* SUSTAINABLE PACKAGING */}
      <section className="container-x mt-16 grid gap-10 md:mt-24 md:grid-cols-12 md:items-center">
        <div className="md:col-span-6">
          <div className="overflow-hidden rounded-[1rem] border border-border/70 shadow-soft">
            <img
              src={IMG.sustainablePackaging}
              alt="Kraft paper brownie box and compostable cups used for Little Brownie Co. packaging"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="md:col-span-6">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-toffee">
            <Leaf className="h-4 w-4" /> Sustainable Packaging
          </span>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-primary sm:text-4xl">
            Good for you, gentler on the planet.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-primary/80">
            We package every order in 100% eco-friendly, recyclable kraft boxes and cups —
            no single-use plastic. It's a small choice on our end that adds up: less waste, and
            packaging that breaks down responsibly instead of sitting in a landfill.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-card p-5">
            <Recycle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm text-muted-foreground">
              Kraft boxes, paper cups and tubs — fully recyclable, sourced to reduce our footprint
              with every order we pack.
            </p>
          </div>
        </div>
      </section>

      {/* CARE & ALLERGY */}
      <section className="container-x mt-16 mb-4 md:mt-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-8">
            <h3 className="font-serif text-2xl text-primary">Heating &amp; storage</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A quick 10–15 seconds in the microwave makes your brownie perfectly warm and gooey.
              Store in an airtight container — up to 4 days at room temperature, or up to 7 days
              refrigerated (bring to room temperature or microwave before eating).
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-8">
            <h3 className="font-serif text-2xl text-primary">Pro tip</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Pairs perfectly with a scoop of ice cream, whipped cream, or an extra drizzle of our
              signature chocolate dip.
            </p>
          </div>
          <div className="rounded-md border border-destructive/30 bg-card p-8">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              <h3 className="font-serif text-2xl text-primary">Allergy warning</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Contains {ALLERGENS.short}. {ALLERGENS.crossContamination} Please check with us
              before ordering if you have a food allergy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
