// supabase/functions/calculate-delivery-fee/index.ts
//
// Given a customer's delivery pincode, works out the delivery fee:
//   1. Calls Google's Distance Matrix API for the driving distance between
//      our fixed dispatch pincode (560029) and the customer's pincode.
//   2. Matches that distance against the `delivery_slabs` table (11
//      distance ranges, editable from Admin → Delivery Fees) to get the fee.
//   3. Returns ONLY the distance + fee — never the slab ranges themselves,
//      since the owner doesn't want customers seeing the km bands.
//
// Required secret (set via `supabase secrets set`, NOT in this repo):
//   GOOGLE_MAPS_API_KEY — a Google Cloud API key with the "Distance Matrix
//                         API" enabled. This can be the same key already
//                         used for GOOGLE_PLACES_API_KEY (google-reviews
//                         function) as long as Distance Matrix API is also
//                         turned on for it in Google Cloud Console.
//
// Until that secret is set, this returns configured: false and the
// checkout page falls back to "Calculated at dispatch" — nothing breaks.

import { CORS_HEADERS, supabaseAdmin } from "../_shared/supabase-admin.ts";

const DISPATCH_PINCODE = "560029";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const jsonHeaders = { ...CORS_HEADERS, "Content-Type": "application/json" };

  let pincode: string | undefined;
  try {
    const body = await req.json();
    pincode = String(body?.pincode ?? "").trim();
  } catch {
    // ignore — handled by the validation below
  }

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Please enter a valid 6-digit pincode." }),
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
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${DISPATCH_PINCODE},India` +
      `&destinations=${pincode},India` +
      `&mode=driving&units=metric&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    const element = data?.rows?.[0]?.elements?.[0];

    if (data.status !== "OK" || !element || element.status !== "OK") {
      console.error("[calculate-delivery-fee] distance matrix error", data);
      return new Response(
        JSON.stringify({
          ok: false,
          configured: true,
          error: "We couldn't recognise that pincode. Please double-check it.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const distanceKm = element.distance.value / 1000;

    // Look up the matching slab. min_km <= distance < max_km, with the
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
