/**
 * Coupon codes. All checking/consuming happens server-side, in two Edge
 * Functions:
 *   - validate-coupon: read-only check, used by the "Apply" button at
 *     checkout. Never consumes the code.
 *   - redeem-coupon: actually consumes one use, called right when the
 *     order is placed (see CheckoutPage.tsx).
 * The client never reads the `coupons` table directly and never decides
 * "is this valid" or "has this been used" on its own — it only shows
 * whatever these functions return.
 */

import { supabase } from "./supabase";

export type AppliedCoupon = {
  couponId: string;
  code: string;
  discountAmount: number;
};

/** Admin-only shape — includes fields the checkout flow never needs. */
export type Coupon = {
  id: string;
  code: string;
  discountAmount: number;
  active: boolean;
  createdAt: string;
};

function couponFromRow(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountAmount: Number(row.discount_amount),
    active: row.is_active,
    createdAt: row.created_at,
  };
}

/** Admin-only: list every coupon (active or not). */
export async function getAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) console.error("[coupons] getAllCoupons", error);
    return [];
  }
  return data.map(couponFromRow);
}

/** Admin-only: create a new coupon code. */
export async function createCoupon(input: {
  code: string;
  discountAmount: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };
  if (!Number.isFinite(input.discountAmount) || input.discountAmount <= 0) {
    return { ok: false, error: "Enter a discount amount greater than ₹0." };
  }

  const { error } = await supabase
    .from("coupons")
    .insert({ code, discount_amount: input.discountAmount });

  if (error) {
    console.error("[coupons] createCoupon", error);
    if (error.code === "23505") {
      return { ok: false, error: "That code already exists." };
    }
    return { ok: false, error: "Could not create the coupon." };
  }
  return { ok: true };
}

/** Admin-only: turn a coupon on/off without deleting it (keeps redemption
 * history intact). Turning it off stops it working immediately. */
export async function setCouponActive(id: string, active: boolean) {
  const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id);
  if (error) console.error("[coupons] setCouponActive", error);
  return !error;
}

/** Admin-only: permanently delete a coupon. Also removes its redemption
 * history (via cascade), so past orders keep their discount_amount but
 * the link to "who used this code" is lost. Prefer setCouponActive(false)
 * if you just want to stop new uses. */
export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) console.error("[coupons] deleteCoupon", error);
  return !error;
}


export async function applyCoupon(
  code: string,
  phone: string,
): Promise<{ ok: true; coupon: AppliedCoupon } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke("validate-coupon", {
    body: { code, phone },
  });

  if (error || !data?.valid) {
    let detail = error?.message || "That coupon code isn't valid.";
    const ctx = (error as any)?.context;
    if (ctx?.json) {
      try {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } catch {
        // ignore — fall back to generic message
      }
    }
    return { ok: false, error: detail };
  }

  return {
    ok: true,
    coupon: {
      couponId: data.couponId,
      code: data.code,
      discountAmount: Number(data.discountAmount),
    },
  };
}

/** Actually consumes one use of the coupon for this phone number. Called
 * right after the order row is created, before payment is initiated —
 * if this fails (e.g. the same number redeemed it moments earlier from
 * another tab), the caller should treat the coupon as no longer usable. */
export async function redeemCoupon(
  code: string,
  phone: string,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke("redeem-coupon", {
    body: { code, phone, orderId },
  });

  if (error || !data?.ok) {
    let detail = error?.message || "Could not apply the coupon to this order.";
    const ctx = (error as any)?.context;
    if (ctx?.json) {
      try {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } catch {
        // ignore — fall back to generic message
      }
    }
    return { ok: false, error: detail };
  }

  return { ok: true };
}
