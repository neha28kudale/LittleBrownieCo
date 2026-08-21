import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ADDRESS,
  DELIVERY_HOURS,
  EMAIL,
  ORDER_HOURS,
  PHONE_DISPLAY,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/products";

export const Route = createFileRoute("/_site/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs & Contact — Little Brownie Co." },
      {
        name: "description",
        content:
          "Answers to frequently asked questions, plus how to get in touch with Little Brownie Co. in Bengaluru — WhatsApp, phone, email or Instagram.",
      },
    ],
  }),
  component: FaqsAndContact,
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

function FaqsAndContact() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-16 md:pb-8">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">FAQs & Contact</span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl">
          Questions we hear often.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
          Find quick answers below, or reach out to us directly — we'd love to hear from you.
        </p>
      </section>

      <section className="container-x max-w-3xl pb-14">
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

        <div className="mt-8 rounded-lg border border-border bg-card p-6 text-center">
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

      <section className="container-x max-w-3xl pb-20 md:pb-28">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Contact</span>
        <h2 className="mt-3 font-serif text-3xl leading-[1.05] text-primary sm:text-4xl">
          We'd love to hear from you.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Questions about an order, custom gifting or anything else — reach out anytime during
          business hours.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
          <a
            href={whatsappLink("Hi Little Brownie Co., I'd like to get in touch.")}
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-border bg-card p-5 transition hover:border-accent/50 hover:shadow-soft"
          >
            <MessageCircle className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-serif text-xl text-primary group-hover:text-accent">
              WhatsApp
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fastest way to place an order or ask a question.
            </p>
            <p className="mt-3 text-primary">{PHONE_DISPLAY}</p>
          </a>

          <div className="rounded-lg border border-border bg-card p-5">
            <Phone className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-serif text-xl text-primary">Phone</h3>
            <a href={`tel:+${WHATSAPP_NUMBER}`} className="mt-3 block text-primary hover:text-accent">
              {PHONE_DISPLAY}
            </a>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <Mail className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-serif text-xl text-primary">Email</h3>
            <a href={`mailto:${EMAIL}`} className="mt-3 block break-all text-primary hover:text-accent">
              {EMAIL}
            </a>
          </div>

          <a
            href="https://www.instagram.com/littlebrownieco.blr?igsh=MXZjejM3YTNwOXczaA==&igsi=MXZjejM3YTNwOXczaA=="
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-border bg-card p-5 transition hover:border-accent/50 hover:shadow-soft"
          >
            <Instagram className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-serif text-xl text-primary group-hover:text-accent">
              Instagram
            </h3>
            <p className="mt-3 text-primary">@littlebrownieco</p>
          </a>

          <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
            <MapPin className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-serif text-xl text-primary">Location</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ADDRESS}</p>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Taking orders · {ORDER_HOURS}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Deliveries · {DELIVERY_HOURS}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
