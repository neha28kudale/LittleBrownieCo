// supabase/functions/cashfree-webhook/index.ts
//
// Cashfree calls this URL directly (configured as the webhook endpoint in
// the Cashfree dashboard, and also passed as order_meta.notify_url when the
// order is created). It verifies the webhook signature server-side before
// trusting anything in the payload — this is the ONLY place payment_status
// is ever set to "paid".
//
// Required secret:
//   CASHFREE_SECRET_KEY   (same one used to create orders — Cashfree signs
//                          webhooks with it)
//
// Cashfree signature scheme (2023-08-01 webhooks):
//   signature = base64( HMAC_SHA256( timestamp + rawBody, secretKey ) )
// Headers sent by Cashfree: `x-webhook-signature`, `x-webhook-timestamp`.

import { supabaseAdmin, CORS_HEADERS } from "../_shared/supabase-admin.ts";

async function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

  if (!secretKey) {
    console.error("[cashfree-webhook] CASHFREE_SECRET_KEY not set");
    return new Response("Server not configured", { status: 500 });
  }

  const valid = await verifySignature(rawBody, timestamp, signature, secretKey);
  if (!valid) {
    console.error("[cashfree-webhook] invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Cashfree webhook payload shape (2023-08-01):
  // { type: "PAYMENT_SUCCESS_WEBHOOK" | "PAYMENT_FAILED_WEBHOOK" | ..., data: { order: { order_id }, payment: { cf_payment_id, payment_status } } }
  const eventType: string = payload?.type ?? "";
  const cfOrderNumber: string | undefined = payload?.data?.order?.order_id;
  const paymentStatusRaw: string | undefined = payload?.data?.payment?.payment_status;
  const cfPaymentId: string | undefined = payload?.data?.payment?.cf_payment_id?.toString();

  if (!cfOrderNumber) {
    return new Response("Missing order_id in payload", { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("order_number", cfOrderNumber)
    .maybeSingle();

  if (findError || !order) {
    console.error("[cashfree-webhook] order not found for", cfOrderNumber);
    return new Response("Order not found", { status: 404 });
  }

  const isSuccess = eventType === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatusRaw === "SUCCESS";
  const isFailure =
    eventType === "PAYMENT_FAILED_WEBHOOK" ||
    paymentStatusRaw === "FAILED" ||
    paymentStatusRaw === "CANCELLED";

  // Never downgrade an already-paid order (e.g. a stray retry webhook).
  if (order.payment_status === "paid") {
    return new Response(JSON.stringify({ ok: true, note: "already paid" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (isSuccess) {
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        cashfree_payment_id: cfPaymentId ?? null,
        // order_status stays "order_placed" (customer-facing) — an admin
        // must still manually Approve before it becomes "order_confirmed".
      })
      .eq("id", order.id);
  } else if (isFailure) {
    await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        order_status: "rejected",
        cashfree_payment_id: cfPaymentId ?? null,
      })
      .eq("id", order.id);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
