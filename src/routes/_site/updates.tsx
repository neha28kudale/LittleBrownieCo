import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_site/updates")({
  head: () => ({
    meta: [
      { title: "Updates & News — Little Brownie Co." },
      {
        name: "description",
        content: "Latest updates, news, and announcements from Little Brownie Co.",
      },
      { property: "og:title", content: "Updates & News — Little Brownie Co." },
      { property: "og:description", content: "Stay updated with the latest from our bakery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Updates,
});

const UPDATES = [
  {
    id: 1,
    title: "Summer Special Edition Brownies Now Available!",
    date: "2024-08-15",
    category: "New Product",
    content:
      "Introducing our limited edition Summer Brownies with Madagascar vanilla and white chocolate. Perfect for the season, available while supplies last!",
    badge: "New",
  },
  {
    id: 2,
    title: "Expanded Delivery Area: Whitefield Now Served",
    date: "2024-08-10",
    category: "Announcement",
    content:
      "We're happy to announce we now deliver to Whitefield! Check our delivery calculator to confirm your location and enjoy fresh brownies at your doorstep.",
    badge: "Expansion",
  },
  {
    id: 3,
    title: "Bulk Orders for Corporate Gifting",
    date: "2024-08-01",
    category: "Service",
    content:
      "Planning a corporate gift? We now offer special bulk pricing for orders of 20+ boxes. Contact us on WhatsApp for custom hamper designs and quotes.",
    badge: "Corporate",
  },
  {
    id: 4,
    title: "Kitchen Hygiene Certification Renewed",
    date: "2024-07-20",
    category: "Certification",
    content:
      "We're proud to announce our FSSAI certification has been renewed! Our commitment to food safety and quality remains unwavering.",
    badge: "Certified",
  },
  {
    id: 5,
    title: "Flash Sale: 15% Off Gift Hampers",
    date: "2024-07-15",
    category: "Offer",
    content:
      "This weekend only! Enjoy 15% off on all gift hampers. Use code GIFTING15 at checkout. Perfect for last-minute gifts!",
    badge: "Limited",
  },
];

function Updates() {
  return (
    <section className="container-x py-10 md:py-16">
      <div className="mb-12">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">What's New</span>
        <h1 className="mt-3 font-serif text-4xl text-primary sm:text-5xl md:text-6xl">
          Updates &amp; News
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Stay in the loop with the latest announcements, new products, and special offers from
          Little Brownie Co.
        </p>
      </div>

      <div className="space-y-6">
        {UPDATES.map((update) => (
          <article
            key={update.id}
            className="group rounded-lg border border-border bg-card p-6 transition-all hover:shadow-soft hover:border-caramel"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="inline-block rounded-full bg-accent px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cocoa font-semibold">
                    {update.badge}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {update.category}
                  </span>
                </div>
                <h2 className="mt-3 font-serif text-2xl text-primary group-hover:text-accent transition-colors">
                  {update.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {update.content}
                </p>
                <time className="mt-4 block text-xs text-muted-foreground">
                  {new Date(update.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <button className="mt-4 flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-secondary sm:mt-0">
                Read more
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-accent/20 bg-accent/5 p-8">
        <div className="flex items-start gap-4">
          <Sparkles className="h-6 w-6 shrink-0 text-accent" />
          <div>
            <h2 className="font-serif text-2xl text-primary">Subscribe for Updates</h2>
            <p className="mt-2 text-muted-foreground">
              Want to stay updated with new products and special offers? Follow us on Instagram or
              WhatsApp for the latest news straight from our kitchen!
            </p>
            <div className="mt-4 flex gap-3 flex-wrap">
              <a
                href="https://www.instagram.com/littlebrownieco.blr?igsh=MXZjejM3YTNwOXczaA==&igsi=MXZjejM3YTNwOXczaA=="
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-cocoa-dark transition-colors"
              >
                Follow on Instagram
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2 text-xs uppercase tracking-[0.18em] text-primary hover:bg-secondary transition-colors"
              >
                WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
