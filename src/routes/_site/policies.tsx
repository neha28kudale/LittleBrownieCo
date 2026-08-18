import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, IndianRupee, RefreshCw, Truck } from "lucide-react";
import { EMAIL, whatsappLink } from "@/lib/products";
import { POLICY_SECTIONS } from "@/lib/site-content";

const POLICY_ICONS = {
  cancellation: RefreshCw,
  refund: IndianRupee,
  modification: CalendarClock,
  delivery: Truck,
} as const;

export const Route = createFileRoute("/_site/policies")({
  head: () => ({
    meta: [
      { title: "Policies — Little Brownie Co." },
      {
        name: "description",
        content:
          "Cancellation, refund, order modification and delivery policies for Little Brownie Co., Bengaluru.",
      },
    ],
  }),
  component: Policies,
});

function Policies() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-20 md:pb-10">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Policies</span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl">
          Order &amp; delivery policies.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
          Please read this before ordering. If anything is unclear, message us on{" "}
          <a
            href={whatsappLink("Hi, I had a question about your order policies.")}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            WhatsApp
          </a>{" "}
          and we're happy to help.
        </p>
      </section>

      <section className="container-x grid gap-8 pb-16 md:grid-cols-2 md:pb-24">
        {POLICY_SECTIONS.map((section) => {
          const Icon = POLICY_ICONS[section.id];
          return (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-md border border-border bg-card p-8"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-accent" />
                <h2 className="font-serif text-2xl text-primary">{section.title}</h2>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="container-x pb-20 text-center text-sm text-muted-foreground md:pb-28">
        For ingredients, allergens and storage, see{" "}
        <Link to="/good-to-know" className="text-accent hover:underline">
          Good to Know
        </Link>
        . Questions?{" "}
        <a
          href={whatsappLink("Hi, I had a question about my order.")}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          WhatsApp
        </a>{" "}
        or{" "}
        <a href={`mailto:${EMAIL}`} className="text-accent hover:underline">
          {EMAIL}
        </a>
        .
      </section>
    </>
  );
}
