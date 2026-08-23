// supabase/functions/calculate-delivery-fee/index.ts
//
// Given a customer's delivery address (+ pincode + a mandatory landmark),
// works out the delivery fee:
//
//   1. Geocode the free-text address (+ pincode) with Google's Geocoding
//      API. Only accept the result if it's a HIGH-CONFIDENCE match — Google
//      almost always returns *something*, even for garbage input, so a low
//      confidence match (locality-level guess, or a "partial match") is
//      treated the same as "not found".
//   2. If the address doesn't geocode confidently, fall back to looking up
//      the landmark instead — via Google Places, NOT the Geocoding API.
//      Geocoding expects fairly exact, address-like text; Places is built
//      for loose, natural-language queries. We try Places Autocomplete
//      first (the same predictive engine behind Google Maps' own search
//      box — tolerant of imprecise wording like "hub" vs the place's
//      actual "centre"), then fall back to Places Text Search. Common
//      filler phrases ("next to", "near", "opposite", "behind", …) are
//      stripped first so the search query is just the place name.
//   3. Once we have a confident set of coordinates (from either step), get
//      the DRIVING distance (not straight-line) from our fixed dispatch
//      address to those coordinates, via the Distance Matrix API.
//   4. Match that distance against the `delivery_slabs` table (11 distance
//      ranges, editable from Admin → Delivery Fees) to get the fee.
//   5. If BOTH the address and the landmark fail to resolve, don't block
//      the order — return needsManualConfirm: true so the storefront can
//      let the customer through with "we'll confirm your delivery charge
//      on WhatsApp before baking" instead.
//
// Never exposes the underlying distance slabs to the caller beyond the
// final fee, since the owner doesn't want customers seeing the km bands.
//
// Required secret (set via `supabase secrets set`, NOT in this repo):
//   GOOGLE_MAPS_API_KEY — a Google Cloud API key with THREE APIs enabled:
//                         "Geocoding API", "Places API" (legacy, for Text
//                         Search) and "Distance Matrix API". This can be
//                         the same key already used for
//                         GOOGLE_PLACES_API_KEY (google-reviews function)
//                         as long as all three are turned on for it in
//                         Google Cloud Console, with billing enabled.
//
// Until that secret is set, this returns configured: false and the
// checkout page falls back to "Calculated at dispatch" — nothing breaks.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// Fixed dispatch location (our kitchen). Using the full address rather
// than just the pincode means the ORIGIN side of the driving-distance
// calculation is also point-to-point (not "pincode centroid to
// coordinates"), which matters because pincode centroids can be a
// kilometre or more off from where we actually are.
const DISPATCH_ADDRESS = "Hotel Palm Suites, Tavarekere Main Road, Bangalore-560029";
const DISPATCH_LAT = 12.9279; // approximate coords for the dispatch address,
const DISPATCH_LNG = 77.5937; // used only to bias/limit the landmark search radius.

// Geocoding location_type values Google considers reasonably precise.
// "APPROXIMATE" (city/locality-level guess) is deliberately excluded —
// that's the case where Google "found something" but it's not trustworthy
// enough to bill a customer against.
const CONFIDENT_LOCATION_TYPES = new Set([
  "ROOFTOP",
  "RANGE_INTERPOLATED",
  "GEOMETRIC_CENTER",
]);

// Filler phrases customers commonly prefix/suffix a landmark with, which
// mean nothing to a place-name search and can actively hurt matching.
// Stripped (case-insensitively) before searching.
const FILLER_PATTERN =
  /\b(next to|nearby|near to|near|opposite to|opposite|behind|beside|besides|in front of|infront of|close to|adjacent to|by the|by|at)\b/gi;

function cleanLandmarkQuery(raw: string): string {
  return raw
    .replace(FILLER_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type GeoPoint = { lat: number; lng: number } | null;

/** Strict, address-style geocoding — used only for the free-text delivery
 * address. Rejects low-confidence / partial matches. */
async function geocodeAddress(query: string, apiKey: string): Promise<GeoPoint> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}&region=in&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
    console.error("[calculate-delivery-fee] geocode not OK", {
      query,
      status: data.status,
      error_message: data.error_message,
    });
    return null;
  }

  const result = data.results[0];
  const locationType = result?.geometry?.location_type as string | undefined;
  const isPartialMatch = Boolean(result?.partial_match);

  if (!locationType || !CONFIDENT_LOCATION_TYPES.has(locationType) || isPartialMatch) {
    console.error("[calculate-delivery-fee] geocode low confidence", {
      query,
      locationType,
      isPartialMatch,
      formatted_address: result?.formatted_address,
    });
    return null;
  }

  const loc = result?.geometry?.location;
  if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;

  return { lat: loc.lat, lng: loc.lng };
}

/** Fuzzy, natural-language place lookup — used for the landmark. We try
 * TWO different Google Places mechanisms, in order, because they're
 * tolerant of different kinds of imprecision:
 *
 *   1. Places Autocomplete — the same predictive engine behind Google
 *      Maps' own search box. It's built to handle partial, loosely-worded,
 *      even slightly-wrong input ("tenet diagnostic hub" still predicting
 *      "Tenet Diagnostics Centre"), which Text Search's more literal
 *      keyword matching can miss (a generic descriptor like "Hub" instead
 *      of the place's actual "Centre" was enough to return zero results
 *      there).
 *   2. Places Text Search — kept as a fallback for cases Autocomplete
 *      doesn't resolve.
 *
 * Biased toward the dispatch area (30km radius) so an ambiguous landmark
 * name resolves to the nearest match, not some same-named place
 * elsewhere. */
async function findLandmark(rawLandmark: string, pincode: string, apiKey: string): Promise<GeoPoint> {
  const cleaned = cleanLandmarkQuery(rawLandmark);
  const query = `${cleaned}, ${pincode}, Bangalore, India`;

  // 1. Autocomplete — most tolerant of loose/imprecise wording.
  const autocompleteUrl =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&location=${DISPATCH_LAT},${DISPATCH_LNG}&radius=30000` +
    `&components=country:in&key=${apiKey}`;

  const acRes = await fetch(autocompleteUrl);
  const acData = await acRes.json();

  if (acData.status === "OK" && Array.isArray(acData.predictions) && acData.predictions.length > 0) {
    const placeId = acData.predictions[0]?.place_id;
    if (placeId) {
      const detailsUrl =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${apiKey}`;
      const detRes = await fetch(detailsUrl);
      const detData = await detRes.json();
      const loc = detData?.result?.geometry?.location;
      if (detData.status === "OK" && typeof loc?.lat === "number" && typeof loc?.lng === "number") {
        return { lat: loc.lat, lng: loc.lng };
      }
      console.error("[calculate-delivery-fee] place details not OK", {
        placeId,
        status: detData.status,
        error_message: detData.error_message,
      });
    }
  } else {
    console.error("[calculate-delivery-fee] autocomplete not OK", {
      query,
      status: acData.status,
      error_message: acData.error_message,
    });
  }

  // 2. Fallback: Text Search.
  const textSearchUrl =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}` +
    `&location=${DISPATCH_LAT},${DISPATCH_LNG}&radius=30000` +
    `&region=in&key=${apiKey}`;

  const tsRes = await fetch(textSearchUrl);
  const tsData = await tsRes.json();

  if (tsData.status !== "OK" || !Array.isArray(tsData.results) || tsData.results.length === 0) {
    console.error("[calculate-delivery-fee] places text search not OK", {
      query,
      status: tsData.status,
      error_message: tsData.error_message,
    });
    return null;
  }

  const top = tsData.results[0];
  const loc = top?.geometry?.location;
  if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;

  return { lat: loc.lat, lng: loc.lng };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const jsonHeaders = { ...CORS_HEADERS, "Content-Type": "application/json" };

  let address: string | undefined;
  let pincode: string | undefined;
  let landmark: string | undefined;

  try {
    const body = await req.json();
    address = String(body?.address ?? "").trim();
    pincode = String(body?.pincode ?? "").trim();
    landmark = String(body?.landmark ?? "").trim();
  } catch {
    // ignore — handled by the validation below
  }

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return new Response(
      JSON.stringify({ ok: false, configured: true, error: "Please enter a valid 6-digit pincode." }),
      { status: 200, headers: jsonHeaders },
    );
  }

  if (!landmark) {
    return new Response(
      JSON.stringify({ ok: false, configured: true, error: "Please enter a nearby landmark." }),
      { status: 200, headers: jsonHeaders },
    );
  }

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

  if (!apiKey) {
    // Not configured yet — let the frontend fall back gracefully.
    return new Response(JSON.stringify({ ok: false, configured: false }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  try {
    // 1. Try the address first (strict geocoding).
    let destination: GeoPoint = null;
    let usedFallback = false;

    if (address) {
      destination = await geocodeAddress(`${address}, ${pincode}, India`, apiKey);
    }

    // 2. Address didn't geocode confidently — fall back to a fuzzy
    // landmark search instead.
    if (!destination) {
      destination = await findLandmark(landmark, pincode, apiKey);
      usedFallback = true;
    }

    // 3. Neither worked — don't block the order, ask for manual confirmation.
    if (!destination) {
      return new Response(
        JSON.stringify({
          ok: false,
          configured: true,
          needsManualConfirm: true,
          error:
            "We couldn't automatically locate this address. We'll confirm the exact delivery charge with you on WhatsApp before baking.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // 4. Driving distance from dispatch to the resolved coordinates.
    const distUrl =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(DISPATCH_ADDRESS)}` +
      `&destinations=${destination.lat},${destination.lng}` +
      `&mode=driving&units=metric&key=${apiKey}`;

    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    const element = distData?.rows?.[0]?.elements?.[0];

    if (distData.status !== "OK" || !element || element.status !== "OK") {
      console.error("[calculate-delivery-fee] distance matrix error", {
        status: distData.status,
        error_message: distData.error_message,
        element_status: element?.status,
      });
      return new Response(
        JSON.stringify({
          ok: false,
          configured: true,
          needsManualConfirm: true,
          error:
            "We couldn't calculate the driving distance for this address. We'll confirm the delivery charge with you on WhatsApp before baking.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const distanceKm = element.distance.value / 1000;

    // 5. Look up the matching slab. min_km <= distance < max_km, with the
    // last row (max_km = null) acting as the "and above" catch-all.
    const admin = supabaseAdmin();
    const { data: slabs, error } = await admin
      .from("delivery_slabs")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !slabs || slabs.length === 0) {
      console.error("[calculate-delivery-fee] slabs lookup error", error);
      return new Response(
        JSON.stringify({ ok: false, configured: true, error: "Delivery pricing isn't set up yet." }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const slab =
      slabs.find(
        (s: any) => distanceKm >= Number(s.min_km) && (s.max_km === null || distanceKm < Number(s.max_km)),
      ) ?? slabs[slabs.length - 1];

    return new Response(
      JSON.stringify({
        ok: true,
        configured: true,
        distanceKm: Math.round(distanceKm * 10) / 10,
        fee: Number(slab.fee),
        locatedVia: usedFallback ? "landmark" : "address",
      }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    console.error("[calculate-delivery-fee]", err);
    return new Response(
      JSON.stringify({ ok: false, configured: true, error: "Something went wrong. Please try again." }),
      { status: 200, headers: jsonHeaders },
    );
  }
});
