import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/site-content";
import { whatsappLink } from "@/lib/products";

export const Route = createFileRoute("/_site/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — Little Brownie Co." },
      {
        name: "description",
        content:
          "Frequently asked questions about ordering, delivery, storage and allergens at Little Brownie Co., Bengaluru.",
      },
    ],
  }),
  component: FAQs,
});

function FAQs() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-20 md:pb-10">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">FAQs</span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl">
          Questions we hear often.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
          Can't find what you're looking for?{" "}
          <Link to="/contact" className="text-accent hover:underline">
            Contact us
          </Link>{" "}
          or{" "}
          <a
            href={whatsappLink("Hi, I had a question about ordering.")}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            message us on WhatsApp
          </a>
          .
        </p>
      </section>

      <section className="container-x max-w-3xl pb-20 md:pb-28">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-serif text-lg text-primary hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            For delivery, cancellation, refund and modification details, see our{" "}
            <Link to="/policies" className="text-accent hover:underline">
              Policies
            </Link>{" "}
            page. For ingredients and storage, visit{" "}
            <Link to="/good-to-know" className="text-accent hover:underline">
              Good to Know
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
