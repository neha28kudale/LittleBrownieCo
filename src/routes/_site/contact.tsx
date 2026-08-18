import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  ADDRESS,
  EMAIL,
  HOURS,
  PHONE_DISPLAY,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/products";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Little Brownie Co." },
      {
        name: "description",
        content:
          "Get in touch with Little Brownie Co. in Bengaluru — WhatsApp, phone, email or Instagram.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <section className="container-x pt-10 pb-6 md:pt-20 md:pb-10">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Contact</span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary sm:text-5xl">
          We'd love to hear from you.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground md:text-lg">
          Questions about an order, custom gifting or anything else — reach out anytime during
          business hours.
        </p>
      </section>

      <section className="container-x grid gap-6 pb-20 md:grid-cols-2 md:gap-8 md:pb-28 lg:max-w-4xl">
        <a
          href={whatsappLink("Hi Little Brownie Co., I'd like to get in touch.")}
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border bg-card p-8 transition hover:border-accent/50 hover:shadow-soft"
        >
          <MessageCircle className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary group-hover:text-accent">
            WhatsApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fastest way to place an order or ask a question.
          </p>
          <p className="mt-4 text-primary">{PHONE_DISPLAY}</p>
        </a>

        <div className="rounded-lg border border-border bg-card p-8">
          <Phone className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Phone</h2>
          <a href={`tel:+${WHATSAPP_NUMBER}`} className="mt-4 block text-primary hover:text-accent">
            {PHONE_DISPLAY}
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-8">
          <Mail className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Email</h2>
          <a href={`mailto:${EMAIL}`} className="mt-4 block break-all text-primary hover:text-accent">
            {EMAIL}
          </a>
        </div>

        <a
          href="https://www.instagram.com/littlebrownieco.blr?igsh=MXZjejM3YTNwOXczaA==&igsi=MXZjejM3YTNwOXczaA=="
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border bg-card p-8 transition hover:border-accent/50 hover:shadow-soft"
        >
          <Instagram className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary group-hover:text-accent">
            Instagram
          </h2>
          <p className="mt-4 text-primary">@littlebrownieco</p>
        </a>

        <div className="rounded-lg border border-border bg-card p-8 md:col-span-2">
          <MapPin className="h-6 w-6 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary">Location</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ADDRESS}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-accent" />
            Open daily · {HOURS}
          </div>
        </div>
      </section>
    </>
  );
}
