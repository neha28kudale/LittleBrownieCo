/**
 * Delivery date & time scheduling, plus the pincode-based delivery fee
 * lookup (calls the `calculate-delivery-fee` Edge Function — see
 * supabase/functions/calculate-delivery-fee/index.ts). The distance-based
 * fee slab table (`delivery_slabs`, admin-editable) is what actually
 * decides the price; this file just calls out to it.
 */

import { supabase } from "./supabase";

export type DeliveryFeeResult =
  | { ok: true; distanceKm: number; fee: number; locatedVia: "address" | "landmark" }
  | { ok: false; configured: false }
  | { ok: false; configured: true; needsManualConfirm?: boolean; error: string };

/** Looks up the delivery fee for a delivery address, based on driving
 * distance from our fixed dispatch location (560029). Geocodes the address
 * first; if that doesn't resolve with high confidence, falls back to
 * geocoding the (mandatory) landmark instead. If neither resolves
 * confidently, returns `needsManualConfirm: true` rather than blocking the
 * order — the caller should let checkout proceed with a note that the fee
 * will be confirmed manually. Never exposes the underlying distance slabs
 * to the caller beyond the final fee. */
export async function getDeliveryFee(input: {
  address: string;
  pincode: string;
  landmark: string;
  /** Set when the customer picked a suggestion from the landmark
   * autocomplete dropdown rather than typing free text — see
   * LandmarkAutocomplete.tsx. Lets the backend skip fuzzy text matching
   * entirely and resolve the exact place instead. */
  landmarkPlaceId?: string;
}): Promise<DeliveryFeeResult> {
  const pincode = input.pincode.trim();
  if (!/^\d{6}$/.test(pincode)) {
    return { ok: false, configured: true, error: "Please enter a valid 6-digit pincode." };
  }

  if (!input.landmark.trim()) {
    return { ok: false, configured: true, error: "Please enter a nearby landmark." };
  }

  try {
    const { data, error } = await supabase.functions.invoke("calculate-delivery-fee", {
      body: {
        address: input.address.trim(),
        pincode,
        landmark: input.landmark.trim(),
        landmarkPlaceId: input.landmarkPlaceId || undefined,
      },
    });

    if (error) {
      return { ok: false, configured: true, error: "Couldn't calculate delivery charges right now." };
    }

    if (!data?.configured) {
      return { ok: false, configured: false };
    }

    if (!data.ok) {
      return {
        ok: false,
        configured: true,
        needsManualConfirm: Boolean(data.needsManualConfirm),
        error: data.error ?? "Couldn't calculate delivery charges.",
      };
    }

    return { ok: true, distanceKm: data.distanceKm, fee: data.fee, locatedVia: data.locatedVia };
  } catch {
    return { ok: false, configured: true, error: "Couldn't calculate delivery charges right now." };
  }
}

/** @deprecated Use {@link getDeliveryFee} — kept only in case other code
 * still imports the old pincode-only signature. */
export async function getDeliveryFeeForPincode(pincode: string): Promise<DeliveryFeeResult> {
  return getDeliveryFee({ address: "", pincode, landmark: pincode });
}

/* ---------------- Admin: delivery fee slabs ---------------- */

export type DeliverySlab = {
  id: string;
  minKm: number;
  maxKm: number | null;
  fee: number;
  sortOrder: number;
};

function slabFromRow(row: any): DeliverySlab {
  return {
    id: row.id,
    minKm: Number(row.min_km),
    maxKm: row.max_km === null ? null : Number(row.max_km),
    fee: Number(row.fee),
    sortOrder: row.sort_order,
  };
}

/** Admin-only (RLS-gated): all delivery slabs, in display order. */
export async function getDeliverySlabs(): Promise<DeliverySlab[]> {
  const { data, error } = await supabase
    .from("delivery_slabs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[delivery] getDeliverySlabs", error);
    return [];
  }
  return data.map(slabFromRow);
}

/** Admin-only: update the fee for a single slab. */
export async function updateDeliverySlabFee(id: string, fee: number) {
  const { error } = await supabase.from("delivery_slabs").update({ fee }).eq("id", id);
  if (error) console.error("[delivery] updateDeliverySlabFee", error);
  return !error;
}

/** Admin-only: update the km range (and fee) for a single slab. Pass
 * `maxKm: null` for an open-ended "X+ km" range. */
export async function updateDeliverySlab(
  id: string,
  input: { minKm: number; maxKm: number | null; fee: number }
) {
  const { error } = await supabase
    .from("delivery_slabs")
    .update({ min_km: input.minKm, max_km: input.maxKm, fee: input.fee })
    .eq("id", id);
  if (error) console.error("[delivery] updateDeliverySlab", error);
  return !error;
}

/** Admin-only: add a new km range. Appended to the end of the display
 * order by default. */
export async function createDeliverySlab(input: {
  minKm: number;
  maxKm: number | null;
  fee: number;
  sortOrder: number;
}) {
  const { error } = await supabase.from("delivery_slabs").insert({
    min_km: input.minKm,
    max_km: input.maxKm,
    fee: input.fee,
    sort_order: input.sortOrder,
  });
  if (error) console.error("[delivery] createDeliverySlab", error);
  return !error;
}

/** Admin-only: remove a km range entirely. */
export async function deleteDeliverySlab(id: string) {
  const { error } = await supabase.from("delivery_slabs").delete().eq("id", id);
  if (error) console.error("[delivery] deleteDeliverySlab", error);
  return !error;
}

/* ---------------- Delivery date & time scheduling ---------------- */

export const DELIVERY_TIME_SLOTS = [
  "9 AM – 12 noon",
  "12 noon – 3 PM",
  "3 PM – 6 PM",
  "6 PM – 9 PM",
] as const;

export type DeliveryTimeSlot = (typeof DELIVERY_TIME_SLOTS)[number];

function toDateOnly(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Earliest selectable delivery date, given the current moment.
 * - Order placed 9:00 AM–5:00 PM  -> earliest is tomorrow.
 * - Order placed after 5:00 PM (or before 9:00 AM) -> earliest is day after tomorrow.
 * No same-day delivery ever.
 */
export function earliestDeliveryDate(now: Date = new Date()): Date {
  const hour = now.getHours();
  const placedInWindow = hour >= 9 && hour < 17; // 9:00 AM–5:00 PM
  const leadDays = placedInWindow ? 1 : 2;
  return toDateOnly(addDays(now, leadDays));
}

export function maxDeliveryDate(now: Date = new Date()): Date {
  return toDateOnly(addDays(now, 60));
}

export function isDateSelectable(dateStr: string, now: Date = new Date()): boolean {
  if (!dateStr) return false;
  const d = toDateOnly(new Date(dateStr + "T00:00:00"));
  return d.getTime() >= earliestDeliveryDate(now).getTime() && d.getTime() <= maxDeliveryDate(now).getTime();
}

export function toISODate(d: Date) {
  // IMPORTANT: do NOT use d.toISOString() here. toISOString() converts to
  // UTC first, and since our dates are built from *local* midnight (IST is
  // UTC+5:30), that conversion rolls the date back by one day — which was
  // silently letting same-day delivery slip through checkout. Format the
  // local calendar date directly instead.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
