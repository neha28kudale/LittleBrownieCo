import { createFileRoute, Link } from "@tanstack/react-router";
import { TriangleAlert, UtensilsCrossed } from "lucide-react";
import { GOOD_TO_KNOW } from "@/lib/site-content";

export const Route = createFileRoute("/_site/good-to-know")({
  head: () => ({
    meta: [
      { title: "Good to Know — Little Brownie Co." },
      {
        name: "description",
        content:
          "Ingredients, allergen information and storage instructions for Little Brownie Co. brownies.",
      },
    ],
  }),
  component: GoodToKnow,
});

function GoodToKnow() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-20 md:pb-10">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Good to Know</span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl">
          Ingredients, allergens &amp; storage.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
          Please read this before placing your order, especially if you have food allergies or
          dietary restrictions.
        </p>
      </section>

      <section className="container-x grid gap-8 pb-20 md:grid-cols-2 md:pb-28">
        <div
          id="allergens"
          className="scroll-mt-28 rounded-md border border-destructive/30 bg-card p-8"
        >
          <div className="flex items-center gap-2.5">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            <h2 className="font-serif text-2xl text-primary">{GOOD_TO_KNOW.allergy.title}</h2>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {GOOD_TO_KNOW.allergy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div id="storage" className="scroll-mt-28 rounded-md border border-border bg-card p-8">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-2xl text-primary">{GOOD_TO_KNOW.storage.title}</h2>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {GOOD_TO_KNOW.storage.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-x pb-20 text-center text-sm text-muted-foreground md:pb-28">
        Questions? Visit our{" "}
        <Link to="/faqs" className="text-accent hover:underline">
          FAQs
        </Link>{" "}
        or{" "}
        <Link to="/contact" className="text-accent hover:underline">
          contact us
        </Link>
        .
      </section>
    </>
  );
}
