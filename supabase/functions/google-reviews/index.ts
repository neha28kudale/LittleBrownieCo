// supabase/functions/google-reviews/index.ts
//
// Fetches the business's live Google reviews server-side, so the Google
// Places API key never has to be shipped in the client-side bundle (anything
// in frontend code is publicly visible in "view source" — API keys don't
// belong there, even ones intended to be "restricted").
//
// Required secrets (set via `supabase secrets set`, NOT in this repo):
//   GOOGLE_PLACES_API_KEY   — the API key the owner shared
//   GOOGLE_PLACE_ID         — her Google Business Profile Place ID (she said
//                             she'd share this by end of day — once you have
//                             it, run:
//                             supabase secrets set GOOGLE_PLACE_ID=<the id>
//
// Until both secrets are set, this function returns { reviews: [], rating:
// null } and the site falls back to the "Read our Google reviews" link —
// nothing breaks.
//
// Google's Places API terms don't allow permanently storing/caching reviews
// beyond a short period, so this always fetches fresh rather than writing to
// the database — the client below caches the result in memory for the
// session only.

import { CORS_HEADERS } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  const placeId = Deno.env.get("GOOGLE_PLACE_ID");

  if (!apiKey || !placeId) {
    return new Response(JSON.stringify({ reviews: [], rating: null, configured: false }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    // Places API (New) — Place Details, requesting only the fields we need.
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[google-reviews] Places API error", res.status, text);
      return new Response(JSON.stringify({ reviews: [], rating: null, configured: true, error: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reviews = (data.reviews ?? []).map((r: any) => ({
      name: r.authorAttribution?.displayName ?? "Google user",
      rating: r.rating,
      text: r.text?.text ?? "",
      relativeTime: r.relativePublishTimeDescription,
    }));

    return new Response(
      JSON.stringify({
        reviews,
        rating: data.rating ?? null,
        ratingCount: data.userRatingCount ?? null,
        mapsUrl: data.googleMapsUri ?? null,
        configured: true,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[google-reviews]", err);
    return new Response(JSON.stringify({ reviews: [], rating: null, configured: true, error: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
