import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const FAQ_ITEMS = [
  {
    q: "How do I place an order?",
    a: "You can place your order directly through our website. Choose your brownies, select your preferred quantity, delivery time and date, and complete your payment securely online at checkout.",
  },
  {
    q: "Where do you deliver?",
    a: "We currently deliver across Bangalore.",
  },
  {
    q: "Do you offer same-day delivery?",
    a: "We don’t offer same-day delivery, as all our brownies are baked fresh to order. All orders must be placed at least one day in advance, between 9 AM and 5 PM, for delivery the following day or later.",
  },
  {
    q: "What are your order and delivery timings?",
    a: "Orders can be placed between 9 AM and 5 PM. For delivery, you can choose your preferred time slot between 9 AM and 9 PM from the available options at checkout.",
  },
  {
    q: "Do you charge for delivery?",
    a: "Yes, delivery charges are additional and vary based on your delivery location. We use delivery partners such as Uber, Rapido and Porter, and always try to choose the most economical available option. The exact delivery charge and tracking details will be shared with you when your order is dispatched.",
  },
  {
    q: "Are your brownies baked fresh?",
    a: "Yes! Our brownies are baked fresh to order in small batches, so you receive them at their best.",
  },
  {
    q: "How should I store my brownies and how long do they stay fresh?",
    a: "Our brownies are best enjoyed fresh. They can be stored for up to 4 days at room temperature or up to 7 days when refrigerated. For detailed storage instructions, ingredients and allergen information, please refer to the “Good to Know” section.",
  },
  {
    q: "Do you offer eggless brownies?",
    a: "All our brownies contain eggs. Our Choco Lava Cake is currently the only eggless option we offer. For detailed ingredient and allergen information, please refer to the “Good to Know” section.",
  },
  {
    q: "Do you take bulk or corporate orders?",
    a: "Yes! We accept bulk, corporate and event orders. For larger quantities, customised packaging or specific requirements, please contact us directly.",
  },
  {
    q: "Can I cancel or modify my order after placing it?",
    a: "No. Once an order has been confirmed, it cannot be cancelled or modified, as our brownies are baked fresh to order. Please refer to our Policies section for more details.",
  },
];

function FAQs() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-20 md:pb-10">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
          FAQs
        </span>

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
            For delivery, cancellation, refund and modification details, see
            our{" "}
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
