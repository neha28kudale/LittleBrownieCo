/**
 * Order persistence — Supabase-backed (`orders` + `order_items` tables, see
 * supabase/migrations/0001_init.sql).
 *
 * Placing an order here only ever creates a row with payment_status =
 * 'pending' and order_status = 'order_placed' (enforced by RLS on the
 * `orders` insert policy — the amount fields are trusted as entered here,
 * but the actual Cashfree order/payment is created & verified server-side
 * from this same row's `total`, via the Edge Functions in supabase/functions —
 * so the client can't just mark itself paid).
 */

import { supabase } from "./supabase";
import type { DetailedItem } from "./cart";

export type OrderStatus = "order_placed" | "order_confirmed" | "rejected";
export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderItemRow = {
  productName: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  distanceKm?: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  deliveryDate: string;
  deliverySlot: string;
  notes?: string;
  isGift: boolean;
  giftMessage?: string;
  ribbonFee: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cashfreeOrderId?: string;
  createdAt: string;
  items: OrderItemRow[];
};

// Order numbers (LBC001, LBC002, ...) are assigned sequentially by a
// Postgres trigger (see supabase/migrations/0005_sequential_order_number.sql)
// so they're never random and never collide, even under concurrent orders.

export async function createOrder(input: {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  distanceKm?: number;
  deliveryFee: number;
  deliveryDate: string;
  deliverySlot: string;
  notes?: string;
  isGift?: boolean;
  giftMessage?: string;
  ribbonFee?: number;
  items: DetailedItem[];
}): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
  const ribbonFee = input.isGift ? input.ribbonFee ?? 0 : 0;
  const total = subtotal + input.deliveryFee + ribbonFee;

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      // order_number is intentionally omitted — assigned sequentially by
      // the trg_set_order_number database trigger.
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email || null,
      address: input.address,
      distance_km: input.distanceKm ?? null,
      delivery_fee: input.deliveryFee,
      subtotal,
      total,
      delivery_date: input.deliveryDate,
      delivery_slot: input.deliverySlot,
      notes: input.notes || null,
      is_gift: input.isGift ?? false,
      gift_message: input.isGift ? input.giftMessage || null : null,
      ribbon_fee: ribbonFee,
      payment_status: "pending",
      order_status: "order_placed",
    })
    .select()
    .single();

  if (orderError || !orderRow) {
    return { ok: false, error: orderError?.message ?? "Could not create order." };
  }

  const itemRows = input.items.map((i) => ({
    order_id: orderRow.id,
    // product_id left null: the storefront catalog (src/lib/products.ts) is
    // still local, not yet mirrored into the Supabase `products` table, so
    // there's no real FK to point at. product_name/variant_label/price are
    // captured directly on the line item instead, which is enough for
    // receipts, admin views and the bakery's own records.
    product_id: null,
    product_name: i.product.name,
    variant_label: i.variant.label,
    unit_price: i.variant.price,
    qty: i.qty,
    line_total: i.lineTotal,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) {
    return { ok: false, error: itemsError.message };
  }

  return { ok: true, order: fromRow(orderRow, itemRows) };
}

function fromRow(row: any, items: any[]): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address,
    distanceKm: row.distance_km ?? undefined,
    deliveryFee: Number(row.delivery_fee),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    deliveryDate: row.delivery_date,
    deliverySlot: row.delivery_slot,
    notes: row.notes ?? undefined,
    isGift: row.is_gift ?? false,
    giftMessage: row.gift_message ?? undefined,
    ribbonFee: Number(row.ribbon_fee ?? 0),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    cashfreeOrderId: row.cashfree_order_id ?? undefined,
    createdAt: row.created_at,
    items: items.map((i) => ({
      productName: i.product_name,
      variantLabel: i.variant_label,
      qty: i.qty,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.line_total),
    })),
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !order) return null;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  return fromRow(order, items ?? []);
}

/** Admin-only (RLS-gated): all orders with items, newest first. */
export async function getAllOrders(): Promise<Order[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !orders) {
    if (error) console.error("[orders] getAllOrders", error);
    return [];
  }
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .in(
      "order_id",
      orders.map((o: any) => o.id),
    );
  return orders.map((o: any) => fromRow(o, (items ?? []).filter((i: any) => i.order_id === o.id)));
}

/** Admin approve/reject — flips the customer-facing order_status. */
export async function setOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", id);
  if (error) console.error("[orders] setOrderStatus", error);
}

export function subscribeOrders(cb: () => void) {
  const channel = supabase
    .channel("orders-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => cb())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function formatPlacedAt(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ` · ${time}`;
}
// /**
//  * Order persistence — Supabase-backed (`orders` + `order_items` tables, see
//  * supabase/migrations/0001_init.sql).
//  *
//  * Placing an order here only ever creates a row with payment_status =
//  * 'pending' and order_status = 'order_placed' (enforced by RLS on the
//  * `orders` insert policy — the amount fields are trusted as entered here,
//  * but the actual Cashfree order/payment is created & verified server-side
//  * from this same row's `total`, via the Edge Functions in supabase/functions —
//  * so the client can't just mark itself paid).
//  */

// import { supabase } from "./supabase";
// import type { DetailedItem } from "./cart";

// export type OrderStatus = "order_placed" | "order_confirmed" | "rejected";
// export type PaymentStatus = "pending" | "paid" | "failed";

// export type OrderItemRow = {
//   productName: string;
//   variantLabel: string;
//   qty: number;
//   unitPrice: number;
//   lineTotal: number;
// };

// export type Order = {
//   id: string;
//   orderNumber: string;
//   customerName: string;
//   phone: string;
//   email?: string;
//   address: string;
//   distanceKm?: number;
//   deliveryFee: number;
//   subtotal: number;
//   total: number;
//   deliveryDate: string;
//   deliverySlot: string;
//   notes?: string;
//   paymentStatus: PaymentStatus;
//   orderStatus: OrderStatus;
//   cashfreeOrderId?: string;
//   createdAt: string;
//   items: OrderItemRow[];
// };

// // Order numbers (LBC-000001, LBC-000002, ...) are now assigned sequentially
// // by a Postgres trigger (see supabase/migrations/0004_sequential_order_number.sql)
// // so they're never random and never collide, even under concurrent orders.

// export async function createOrder(input: {
//   customerName: string;
//   phone: string;
//   email?: string;
//   address: string;
//   distanceKm?: number;
//   deliveryFee: number;
//   deliveryDate: string;
//   deliverySlot: string;
//   notes?: string;
//   items: DetailedItem[];
// }): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
//   const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
//   const total = subtotal + input.deliveryFee;

//   const { data: orderRow, error: orderError } = await supabase
//     .from("orders")
//     .insert({
//       // order_number is intentionally omitted — assigned sequentially by
//       // the trg_set_order_number database trigger.
//       customer_name: input.customerName,
//       phone: input.phone,
//       email: input.email || null,
//       address: input.address,
//       distance_km: input.distanceKm ?? null,
//       delivery_fee: input.deliveryFee,
//       subtotal,
//       total,
//       delivery_date: input.deliveryDate,
//       delivery_slot: input.deliverySlot,
//       notes: input.notes || null,
//       payment_status: "pending",
//       order_status: "order_placed",
//     })
//     .select()
//     .single();

//   if (orderError || !orderRow) {
//     return { ok: false, error: orderError?.message ?? "Could not create order." };
//   }

//   const itemRows = input.items.map((i) => ({
//     order_id: orderRow.id,
//     // product_id left null: the storefront catalog (src/lib/products.ts) is
//     // still local, not yet mirrored into the Supabase `products` table, so
//     // there's no real FK to point at. product_name/variant_label/price are
//     // captured directly on the line item instead, which is enough for
//     // receipts, admin views and the bakery's own records.
//     product_id: null,
//     product_name: i.product.name,
//     variant_label: i.variant.label,
//     unit_price: i.variant.price,
//     qty: i.qty,
//     line_total: i.lineTotal,
//   }));

//   const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
//   if (itemsError) {
//     return { ok: false, error: itemsError.message };
//   }

//   return { ok: true, order: fromRow(orderRow, itemRows) };
// }

// function fromRow(row: any, items: any[]): Order {
//   return {
//     id: row.id,
//     orderNumber: row.order_number,
//     customerName: row.customer_name,
//     phone: row.phone,
//     email: row.email ?? undefined,
//     address: row.address,
//     distanceKm: row.distance_km ?? undefined,
//     deliveryFee: Number(row.delivery_fee),
//     subtotal: Number(row.subtotal),
//     total: Number(row.total),
//     deliveryDate: row.delivery_date,
//     deliverySlot: row.delivery_slot,
//     notes: row.notes ?? undefined,
//     paymentStatus: row.payment_status,
//     orderStatus: row.order_status,
//     cashfreeOrderId: row.cashfree_order_id ?? undefined,
//     createdAt: row.created_at,
//     items: items.map((i) => ({
//       productName: i.product_name,
//       variantLabel: i.variant_label,
//       qty: i.qty,
//       unitPrice: Number(i.unit_price),
//       lineTotal: Number(i.line_total),
//     })),
//   };
// }

// export async function getOrderById(id: string): Promise<Order | null> {
//   const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
//   if (error || !order) return null;
//   const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
//   return fromRow(order, items ?? []);
// }

// /** Admin-only (RLS-gated): all orders with items, newest first. */
// export async function getAllOrders(): Promise<Order[]> {
//   const { data: orders, error } = await supabase
//     .from("orders")
//     .select("*")
//     .order("created_at", { ascending: false });
//   if (error || !orders) {
//     if (error) console.error("[orders] getAllOrders", error);
//     return [];
//   }
//   const { data: items } = await supabase
//     .from("order_items")
//     .select("*")
//     .in(
//       "order_id",
//       orders.map((o: any) => o.id),
//     );
//   return orders.map((o: any) => fromRow(o, (items ?? []).filter((i: any) => i.order_id === o.id)));
// }

// /** Admin approve/reject — flips the customer-facing order_status. */
// export async function setOrderStatus(id: string, status: OrderStatus) {
//   const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", id);
//   if (error) console.error("[orders] setOrderStatus", error);
// }

// export function subscribeOrders(cb: () => void) {
//   const channel = supabase
//     .channel("orders-changes")
//     .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => cb())
//     .subscribe();
//   return () => {
//     supabase.removeChannel(channel);
//   };
// }

// export function formatPlacedAt(iso: string) {
//   const d = new Date(iso);
//   const today = new Date();
//   const isToday = d.toDateString() === today.toDateString();
//   const yesterday = new Date(today);
//   yesterday.setDate(yesterday.getDate() - 1);
//   const isYesterday = d.toDateString() === yesterday.toDateString();
//   const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
//   if (isToday) return `Today · ${time}`;
//   if (isYesterday) return `Yesterday · ${time}`;
//   return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ` · ${time}`;
// }
