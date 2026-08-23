import { useEffect, useState } from "react";
import { Instagram, ArrowUpRight, PlayCircle } from "lucide-react";
import { getInstagramFeed, type InstagramPost } from "@/lib/instagram";
import { Reveal } from "@/components/site/Reveal";

const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/littlebrownieco.blr?igsh=MXZjejM3YTNwOXczaA==&igsi=MXZjejM3YTNwOXczaA==";

/**
 * Live "From our kitchen" strip pulling the latest posts/reels from
 * Instagram via the `instagram-feed` edge function. Renders nothing at all
 * (not even the heading) until posts are actually available, so there's no
 * broken/empty section if the Instagram API credentials aren't set up yet.
 */
export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);

  useEffect(() => {
    getInstagramFeed().then((r) => setPosts(r.posts));
  }, []);

  if (posts.length === 0) return null;

  return (
    <Reveal as="section" className="mt-8 md:mt-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.28em] text-toffee">
              <Instagram className="h-3.5 w-3.5" /> From our kitchen
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
              Fresh off the reel.
            </h2>
          </div>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            Follow @littlebrownieco.blr <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-md bg-secondary"
            >
              <img
                src={p.imageUrl}
                alt={p.caption || "Little Brownie Co. on Instagram"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {p.mediaType === "VIDEO" && (
                <span className="absolute right-2 top-2 text-primary-foreground drop-shadow">
                  <PlayCircle className="h-5 w-5" />
                </span>
              )}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all duration-300 group-hover:bg-primary/30 group-hover:opacity-100">
                <Instagram className="h-5 w-5 text-primary-foreground" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
