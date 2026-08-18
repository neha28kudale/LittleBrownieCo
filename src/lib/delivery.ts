import { supabase } from "./supabase";

export type DeliverySlab = {
  id: string;
  minKm: number;
  maxKm: number | null; // null = "and above"
  fee: number;
  sortOrder: number;
};

const FALLBACK_SLABS: DeliverySlab[] = [
  { id: "fallback-1", minKm: 0, maxKm: 5, fee: 40, sortOrder: 1 },
  { id: "fallback-2", minKm: 5, maxKm: 10, fee: 60, sortOrder: 2 },
  { id: "fallback-3", minKm: 10, maxKm: 15, fee: 80, sortOrder: 3 },
  { id: "fallback-4", minKm: 15, maxKm: 20, fee: 100, sortOrder: 4 },
  { id: "fallback-5", minKm: 20, maxKm: null, fee: 120, sortOrder: 5 },
];

export async function getDeliverySlabs(): Promise<DeliverySlab[]> {
  const { data, error } = await supabase
    .from("delivery_slabs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) {
    if (error) console.error("[delivery] getDeliverySlabs", error);
    return FALLBACK_SLABS;
  }
  return data.map((r: any) => ({
    id: r.id,
    minKm: Number(r.min_km),
    maxKm: r.max_km === null ? null : Number(r.max_km),
    fee: Number(r.fee),
    sortOrder: r.sort_order,
  }));
}

export async function updateDeliverySlab(
  id: string,
  fee: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("delivery_slabs").update({ fee }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function feeForDistance(slabs: DeliverySlab[], km: number): number {
  const slab = slabs.find((s) => km >= s.minKm && (s.maxKm === null || km < s.maxKm));
  return slab ? slab.fee : slabs[slabs.length - 1]?.fee ?? 0;
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
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
