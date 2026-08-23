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
//   2. If the address doesn't geocode confidently, fall back to geocoding
//      the landmark (+ pincode) instead — landmarks are far more likely to
//      exist as a real, well-known Google Place, which is the whole point
//      of asking for one.
//   3. Once we have a confident set of coordinates (from either step), get
//      the DRIVING distance (not straight-line) from our fixed dispatch
//      address to those coordinates, via the Distance Matrix API.
//   4. Match that distance against the `delivery_slabs` table (11 distance
//      ranges, editable from Admin → Delivery Fees) to get the fee.
//   5. If BOTH the address and the landmark fail to geocode confidently,
//      don't block the order — return needsManualConfirm: true so the
//      storefront can let the customer through with "we'll confirm your
//      delivery charge on WhatsApp before baking" instead.
//
// Never exposes the underlying distance slabs to the caller beyond the
// final fee, since the owner doesn't want customers seeing the km bands.
//
// Required secret (set via `supabase secrets set`, NOT in this repo):
//   GOOGLE_MAPS_API_KEY — a Google Cloud API key with the "Geocoding API"
//                         AND "Distance Matrix API" enabled. This can be
//                         the same key already used for
//                         GOOGLE_PLACES_API_KEY (google-reviews function)
//                         as long as both APIs are also turned on for it in
//                         Google Cloud Console.
//
// Until that secret is set, this returns configured: false and the
// checkout page falls back to "Calculated at dispatch" — nothing breaks.

import { CORS_HEADERS, supabaseAdmin } from "../_shared/supabase-admin.ts";

// Fixed dispatch location (our kitchen). Using the full address rather
// than just the pincode means the ORIGIN side of the driving-distance
// calculation is also point-to-point (not "pincode centroid to
// coordinates"), which matters because pincode centroids can be a
// kilometre or more off from where we actually are.
const DISPATCH_ADDRESS = "Hotel Palm Suites, Tavarekere Main Road, Bangalore-560029";

// Geocoding location_type values Google considers reasonably precise.
// "APPROXIMATE" (city/locality-level guess) is deliberately excluded —
// that's the case where Google "found something" but it's not trustworthy
// enough to bill a customer against.
const CONFIDENT_LOCATION_TYPES = new Set([
  "ROOFTOP",
  "RANGE_INTERPOLATED",
  "GEOMETRIC_CENTER",
]);

type GeocodeResult = { lat: number; lng: number } | null;

async function geocodeConfident(query: string, apiKey: string): Promise<GeocodeResult> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}&region=in&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  const locationType = result?.geometry?.location_type as string | undefined;
  const isPartialMatch = Boolean(result?.partial_match);

  if (!locationType || !CONFIDENT_LOCATION_TYPES.has(locationType) || isPartialMatch) {
    return null;
  }

  const loc = result?.geometry?.location;
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
    // 1. Try the address first.
    let destination: GeocodeResult = null;
    let usedFallback = false;

    if (address) {
      destination = await geocodeConfident(`${address}, ${pincode}, India`, apiKey);
    }

    // 2. Address didn't geocode confidently — fall back to the landmark.
    if (!destination) {
      destination = await geocodeConfident(`${landmark}, ${pincode}, India`, apiKey);
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
      console.error("[calculate-delivery-fee] distance matrix error", distData);
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
