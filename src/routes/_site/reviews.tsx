import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getApprovedReviews,
  submitReview,
  subscribeReviews,
  type Review,
} from "@/lib/reviews";
import { GOOGLE_REVIEWS_URL } from "@/lib/products";

export const Route = createFileRoute("/_site/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Little Brownie Co." },
      {
        name: "description",
        content: "What customers say about Little Brownie Co., and a place to leave your own review.",
      },
      { property: "og:title", content: "Reviews — Little Brownie Co." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reviews,
});

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < rating ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedRating, setLastSubmittedRating] = useState(5);

  useEffect(() => {
    const load = () => {
      getApprovedReviews().then((r) =>
        setReviews([...r].sort((a, b) => b.rating - a.rating)),
      );
    };
    load();
    return subscribeReviews(load);
  }, []);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      toast.error("Please add your name and a review.");
      return;
    }
    const result = await submitReview({ name, location, rating, text });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSubmitted(true);
    setLastSubmittedRating(rating);
    setName("");
    setLocation("");
    setRating(5);
    setText("");
    toast.success("Thanks! Your review has been submitted for approval.");
  };

  return (
    <>
      <section className="container-x pt-10 pb-6 text-center md:pt-20 md:pb-8">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">Reviews</span>
        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-4xl leading-[1.05] text-primary sm:text-5xl md:text-7xl">
          What our customers say.
        </h1>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Stars rating={Math.round(Number(avg))} size="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {avg} average · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        </div>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          Read more reviews on Google
        </a>
      </section>

      <section className="container-x mt-8 grid gap-8 md:mt-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-md border border-border bg-card p-6 shadow-soft"
              >
                <Stars rating={r.rating} />
                <p className="mt-3 text-sm leading-relaxed text-primary/85">"{r.text}"</p>
                <div className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {r.name}
                  {r.location ? ` · ${r.location}` : ""}
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet — be the first to leave one!
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-md border border-border bg-card p-6 shadow-soft sm:p-8">
            <h2 className="font-serif text-2xl text-primary">Leave a review</h2>

            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
            >
              Leave a review on Google <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Google reviews have to be posted by you on Google directly — tap above to open their review form.
            </p>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-xs text-muted-foreground">
              Prefer to leave it here instead? Reviews below are checked by our team before they go live on this page.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-md border border-border bg-surface-soft p-5 text-sm text-primary/80">
                Thank you! Your review is awaiting approval and will appear here once it's live.
                {lastSubmittedRating >= 4 && (
                  <div className="mt-4 rounded-md border border-accent/30 bg-background p-4">
                    <p className="text-sm text-primary">
                      Loved it? It'd mean a lot if you shared it on Google too — it takes less than a minute.
                    </p>
                    <a
                      href={GOOGLE_REVIEWS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-accent hover:underline"
                    >
                      Post this on Google <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 block text-xs uppercase tracking-[0.18em] text-accent hover:underline"
                >
                  Write another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Your name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Area (optional)
                  </span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Indiranagar"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Rating
                  </span>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star`}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            n <= rating ? "fill-accent text-accent" : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Your review
                  </span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
                >
                  Submit review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
