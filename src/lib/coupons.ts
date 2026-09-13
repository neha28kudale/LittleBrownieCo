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
