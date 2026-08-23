// supabase/functions/places-autocomplete/index.ts
//
// Powers a live "pick your landmark from a list" dropdown on the checkout
// page's Nearby landmark field — the same pattern Uber/Ola use for address
// entry. Instead of the customer typing freeform text that the backend then
// has to reverse-guess against Google Places (see calculate-delivery-fee),
// the customer picks a REAL place as they type, and we get back an exact
// place_id + coordinates immediately. That sidesteps the fuzzy-matching
// problem entirely for anyone who picks a suggestion.
//
// Two request shapes (both POST):
//
//   { type: "autocomplete", input: "tenent diagnostic" }
//     -> { predictions: [{ placeId, description }, ...], debug: {...} }
//     Tries Places Autocomplete first, then Places Text Search against a
//     city-qualified query AND the bare input, in that order, stopping at
//     the first one that returns anything. The `debug` block on the
//     response reports exactly what each attempt returned (Google's raw
//     status + result count), and a `sourceVersion` tag, so it's possible
//     to tell at a glance — from the response alone, no server log access
//     needed — whether this exact version of the code is the one actually
//     running, and if not, why any given query failed.
//
//   { type: "details", placeId: "ChIJ..." }
//     -> { placeId, description, lat, lng }
//
// The API key stays server-side only — same reasoning as google-reviews:
// anything in frontend code is publicly visible in "view source", so keys
// don't belong there even when "restricted".
//
// Required secret (already set for calculate-delivery-fee, reused here):
//   GOOGLE_MAPS_API_KEY
//
// Until that secret is set, this returns configured: false and the
// frontend falls back to a plain text input — nothing breaks.

const SOURCE_VERSION = "places-autocomplete-v4-diagnostic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same dispatch-area bias as calculate-delivery-fee, so suggestions favor
// real places near the kitchen rather than same-named places elsewhere.
const DISPATCH_LAT = 12.9279;
const DISPATCH_LNG = 77.5937;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const jsonHeaders = { ...CORS_HEADERS, "Content-Type": "application/json" };
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

  if (!apiKey) {
    return new Response(JSON.stringify({ configured: false, sourceVersion: SOURCE_VERSION }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ configured: true, error: "Invalid request.", sourceVersion: SOURCE_VERSION }),
      { status: 200, headers: jsonHeaders },
    );
  }

  const type = String(body?.type ?? "");

  try {
    if (type === "autocomplete") {
      const input = String(body?.input ?? "").trim();
      const debug: any = { sourceVersion: SOURCE_VERSION, input, attempts: [] };

      if (input.length < 3) {
        return new Response(
          JSON.stringify({ configured: true, predictions: [], debug: { ...debug, reason: "input too short" } }),
          { status: 200, headers: jsonHeaders },
        );
      }

      const cityQuery = `${input}, Bangalore, India`;

      // 1. Autocomplete on the city-qualified query.
      const autocompleteUrl =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(cityQuery)}` +
        `&location=${DISPATCH_LAT},${DISPATCH_LNG}&radius=30000` +
        `&components=country:in&key=${apiKey}`;

      const res = await fetch(autocompleteUrl);
      const data = await res.json();

      debug.attempts.push({
        method: "autocomplete",
        query: cityQuery,
        googleStatus: data.status,
        googleErrorMessage: data.error_message ?? null,
        resultCount: (data.predictions ?? []).length,
      });

      let predictions = (data.predictions ?? []).slice(0, 6).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
      }));

      // 2. Fall back to Text Search — city-qualified query, then bare
      // input — if Autocomplete came up empty.
      if (predictions.length === 0) {
        for (const query of [cityQuery, input]) {
          const textSearchUrl =
            `https://maps.googleapis.com/maps/api/place/textsearch/json` +
            `?query=${encodeURIComponent(query)}` +
            `&location=${DISPATCH_LAT},${DISPATCH_LNG}&radius=30000` +
            `&region=in&key=${apiKey}`;

          const tsRes = await fetch(textSearchUrl);
          const tsData = await tsRes.json();

          debug.attempts.push({
            method: "textsearch",
            query,
            googleStatus: tsData.status,
            googleErrorMessage: tsData.error_message ?? null,
            resultCount: (tsData.results ?? []).length,
          });

          predictions = (tsData.results ?? []).slice(0, 6).map((r: any) => ({
            placeId: r.place_id,
            description: r.formatted_address ? `${r.name}, ${r.formatted_address}` : r.name,
          }));

          if (predictions.length > 0) break;
        }
      }

      return new Response(JSON.stringify({ configured: true, predictions, debug }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (type === "details") {
      const placeId = String(body?.placeId ?? "").trim();

      if (!placeId) {
        return new Response(
          JSON.stringify({ configured: true, error: "Missing placeId.", sourceVersion: SOURCE_VERSION }),
          { status: 200, headers: jsonHeaders },
        );
      }

      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(placeId)}&fields=geometry,name,formatted_address&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();
      const loc = data?.result?.geometry?.location;

      if (data.status !== "OK" || typeof loc?.lat !== "number" || typeof loc?.lng !== "number") {
        console.error("[places-autocomplete] details not OK", {
          placeId,
          status: data.status,
          error_message: data.error_message,
        });
        return new Response(
          JSON.stringify({
            configured: true,
            error: "Couldn't resolve that place.",
            sourceVersion: SOURCE_VERSION,
            debug: { googleStatus: data.status, googleErrorMessage: data.error_message ?? null },
          }),
          { status: 200, headers: jsonHeaders },
        );
      }

      return new Response(
        JSON.stringify({
          configured: true,
          placeId,
          description: data.result?.formatted_address ?? data.result?.name ?? "",
          lat: loc.lat,
          lng: loc.lng,
          sourceVersion: SOURCE_VERSION,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({ configured: true, error: "Unknown request type.", sourceVersion: SOURCE_VERSION }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("[places-autocomplete]", err);
    return new Response(
      JSON.stringify({
        configured: true,
        error: "Something went wrong.",
        sourceVersion: SOURCE_VERSION,
        debug: { caughtError: String(err) },
      }),
      { status: 200, headers: jsonHeaders },
    );
  }
});
