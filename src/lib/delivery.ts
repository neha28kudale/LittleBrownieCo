/**
 * Delivery is now charged as "Calculated at dispatch" (see checkout /
 * order-confirmation / admin order details) rather than via a distance-based
 * fee slab table, so the old getDeliverySlabs/updateDeliverySlab/
 * feeForDistance helpers have been removed along with the admin "Delivery
 * Fees" tab. This file now only handles delivery date & time scheduling.
 */

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
