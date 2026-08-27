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
import { GOOGLE_REVIEWS_URL, GOOGLE_MAPS_URL } from "@/lib/products";

export const Route = createFileRoute("/_site/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Little Brownie Co." },
      {
        name: "description",
        content:
          "What customers say about Little Brownie Co., and a place to leave your own review.",
      },
      {
        property: "og:title",
        content: "Reviews — Little Brownie Co.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reviews,
});

function Stars({
  rating,
  size = "h-4 w-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div
      className="flex gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < rating
              ? "fill-accent text-accent"
              : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

// Homepage displays the top 4 highest-rated reviews.
// This page displays the next 5 unique reviews.
const HOMEPAGE_REVIEW_COUNT = 4;
const REVIEWS_PAGE_COUNT = 5;

function Reviews() {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = () => {
      getApprovedReviews().then((r) => {
        // Same sorting used on the homepage.
        const sorted = [...r].sort(
          (a, b) => b.rating - a.rating,
        );

        setAllReviews(sorted);

        // Skip the first 4 reviews shown on the homepage
        // and display the next 5 unique reviews here.
        const uniqueReviews = sorted.slice(
          HOMEPAGE_REVIEW_COUNT,
          HOMEPAGE_REVIEW_COUNT + REVIEWS_PAGE_COUNT,
        );

        setReviews(uniqueReviews);
      });
    };

    load();

    return subscribeReviews(load);
  }, []);

  const avg =
    allReviews.length > 0
      ? (
          allReviews.reduce((s, r) => s + r.rating, 0) /
          allReviews.length
        ).toFixed(1)
      : "5.0";

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !text.trim()) {
      toast.error("Please add your name and a review.");
      return;
    }

    if (!rating) {
      toast.error("Please pick a star rating.");
      return;
    }

    const result = await submitReview({
      name,
      location: "",
      rating,
      text,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSubmitted(true);
    setName("");
    setRating(0);
    setText("");

    toast.success(
      "Thanks! Your review has been submitted for approval.",
    );
  };

  return (
    <>
      {/* PAGE HEADER */}
      <section className="container-x pt-10 pb-6 text-center md:pt-20 md:pb-8">
        <span className="text-[11px] uppercase tracking-[0.28em] text-toffee">
          Reviews
        </span>

        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-4xl leading-[1.05] text-primary sm:text-5xl md:text-7xl">
          A few words from our happy customers.
        </h1>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Stars
            rating={Math.round(Number(avg))}
            size="h-5 w-5"
          />

          <span className="text-sm text-muted-foreground">
            {avg} average · {allReviews.length} review
            {allReviews.length === 1 ? "" : "s"}
          </span>
        </div>

        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          4.9 ★ on Google (25+ reviews)
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* REVIEWS + FORM */}
      <section className="container-x mt-8 grid gap-8 md:mt-12 md:grid-cols-12">
        {/* CUSTOMER REVIEWS */}
        <div className="md:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-md border border-border bg-card p-6 shadow-soft"
              >
                <Stars rating={r.rating} />

                <p className="mt-3 text-sm leading-relaxed text-primary/85">
                  "{r.text}"
                </p>

                <div className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {r.name}
                </div>
              </div>
            ))}

            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No additional reviews yet — be the first to leave
                one!
              </p>
            )}
          </div>
        </div>

        {/* LEAVE A REVIEW */}
        <div className="md:col-span-5">
          <div className="rounded-md border border-border bg-card p-6 shadow-soft sm:p-8">
            <h2 className="font-serif text-2xl text-primary">
              Leave a review
            </h2>

            {/* GOOGLE REVIEW BUTTON */}
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark"
            >
              Leave a review on Google
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Google reviews have to be posted by you on Google
              directly — tap above to open their review form.
            </p>

            {/* DIVIDER */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />

              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                or
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-xs text-muted-foreground">
              Prefer to leave a review here instead?
            </p>

            {/* SUBMITTED STATE */}
            {submitted ? (
              <div className="mt-6 rounded-md border border-border bg-surface-soft p-5 text-sm text-primary/80">
                Thank you for taking the time to leave us a
                review!

                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 block text-xs uppercase tracking-[0.18em] text-accent hover:underline"
                >
                  Write another
                </button>
              </div>
            ) : (
              /* REVIEW FORM */
              <form
                onSubmit={submit}
                className="mt-6 space-y-4"
              >
                {/* NAME */}
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

                {/* RATING */}
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
                            n <= rating
                              ? "fill-accent text-accent"
                              : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* REVIEW TEXT */}
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

                {/* SUBMIT */}
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
