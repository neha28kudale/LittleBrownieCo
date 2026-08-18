// supabase/functions/create-cashfree-order/index.ts
//
// Called from the client with { orderId, mode }. Looks up the order's
// `total` directly from the database — the amount charged is NEVER taken
// from the request body — creates a matching order on Cashfree, and
// returns the payment_session_id the frontend needs to open Cashfree's
// hosted checkout.
//
// Required secrets (set via `supabase secrets set` or the dashboard):
//   CASHFREE_APP_ID
//   CASHFREE_SECRET_KEY
// (CASHFREE_ENV is read from the request's `mode` field, "sandbox" | "production",
//  but you can also hardcode it here via a secret if you'd rather not trust the client for this.)

import { supabaseAdmin, CORS_HEADERS } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { orderId, mode } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = supabaseAdmin();

    // Source of truth for the amount — never trust a client-supplied amount.
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, total, customer_name, phone, email")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!appId || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Cashfree is not configured (missing API keys)." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const isSandbox = mode !== "production";
    const cashfreeBase = isSandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    const siteUrl = Deno.env.get("SITE_URL") || "https://littilebrownieco.vercel.app";

    const cfResp = await fetch(`${cashfreeBase}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify({
        order_id: order.order_number,
        order_amount: Number(order.total),
        order_currency: "INR",
        customer_details: {
          customer_id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.phone,
          customer_email: order.email || "orders@littlebrownieco.example",
        },
        order_meta: {
          return_url: `${siteUrl}/order-confirmation/${order.id}?order_id={order_id}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    const cfData = await cfResp.json();

    if (!cfResp.ok) {
      console.error("[create-cashfree-order] Cashfree error", cfData);
      return new Response(
        JSON.stringify({ error: cfData?.message || "Cashfree order creation failed." }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("orders")
      .update({ cashfree_order_id: cfData.cf_order_id ?? cfData.order_id })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ paymentSessionId: cfData.payment_session_id, cashfreeOrderId: cfData.order_id }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[create-cashfree-order] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
