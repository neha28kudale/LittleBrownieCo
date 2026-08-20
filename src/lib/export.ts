/**
 * Admin dashboard → Excel export.
 *
 * Builds a single .xlsx workbook (via SheetJS) with four sheets — Orders,
 * Customers, Product Performance, and a Summary/Analytics sheet — so the
 * bakery can download one file for bookkeeping, taxes, or general
 * record-keeping instead of copy-pasting out of the dashboard.
 */

import * as XLSX from "xlsx";
import type { Order } from "./orders";
import type { Product } from "./products";
import { formatDisplayDate } from "./delivery";

function money(n: number) {
  return Number(n.toFixed(2));
}

function ordersSheet(orders: Order[]) {
  const rows = orders.map((o) => ({
    "Order #": o.orderNumber,
    "Placed At": new Date(o.createdAt).toLocaleString("en-IN"),
    Customer: o.customerName,
    Phone: o.phone,
    Email: o.email ?? "",
    Address: o.address,
    Items: o.items.map((i) => `${i.qty} x ${i.productName} (${i.variantLabel})`).join("; "),
    "Delivery Date": formatDisplayDate(o.deliveryDate),
    "Delivery Slot": o.deliverySlot,
    Subtotal: money(o.subtotal),
    "Delivery Fee": money(o.deliveryFee),
    Total: money(o.total),
    "Payment Status": o.paymentStatus,
    "Order Status": o.orderStatus,
    Notes: o.notes ?? "",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 22 },
    { wch: 30 }, { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
  ];
  return sheet;
}

function customersSheet(orders: Order[]) {
  const byPhone = new Map<
    string,
    { name: string; phone: string; email?: string; orders: number; spend: number; lastOrder: string }
  >();

  for (const o of orders) {
    const paidTotal = o.orderStatus !== "rejected" && o.paymentStatus === "paid" ? o.total : 0;
    const existing = byPhone.get(o.phone);
    if (existing) {
      existing.orders += 1;
      existing.spend += paidTotal;
      if (new Date(o.createdAt) > new Date(existing.lastOrder)) existing.lastOrder = o.createdAt;
      if (!existing.email && o.email) existing.email = o.email;
    } else {
      byPhone.set(o.phone, {
        name: o.customerName,
        phone: o.phone,
        email: o.email,
        orders: 1,
        spend: paidTotal,
        lastOrder: o.createdAt,
      });
    }
  }

  const rows = Array.from(byPhone.values())
    .sort((a, b) => b.spend - a.spend)
    .map((c) => ({
      Customer: c.name,
      Phone: c.phone,
      Email: c.email ?? "",
      "Total Orders": c.orders,
      "Total Spend (Paid)": money(c.spend),
      "Last Order": new Date(c.lastOrder).toLocaleDateString("en-IN"),
    }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
  ];
  return sheet;
}

function productPerformanceSheet(orders: Order[], products: Product[]) {
  const byName = new Map<string, { qty: number; revenue: number }>();

  for (const o of orders) {
    if (o.orderStatus === "rejected") continue;
    for (const item of o.items) {
      const key = `${item.productName} — ${item.variantLabel}`;
      const existing = byName.get(key);
      if (existing) {
        existing.qty += item.qty;
        existing.revenue += item.lineTotal;
      } else {
        byName.set(key, { qty: item.qty, revenue: item.lineTotal });
      }
    }
  }

  const rows = Array.from(byName.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, stats]) => ({
      "Product (Variant)": name,
      "Units Sold": stats.qty,
      "Revenue": money(stats.revenue),
    }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 36 }, { wch: 12 }, { wch: 14 }];
  return { sheet, activeProductCount: products.filter((p) => p.isActive !== false).length };
}

function summarySheet(orders: Order[], activeProductCount: number) {
  const paidOrders = orders.filter((o) => o.orderStatus !== "rejected" && o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.orderStatus === "order_placed").length;
  const confirmed = orders.filter((o) => o.orderStatus === "order_confirmed").length;
  const rejected = orders.filter((o) => o.orderStatus === "rejected").length;

  const rows = [
    { Metric: "Report generated", Value: new Date().toLocaleString("en-IN") },
    { Metric: "Total orders", Value: orders.length },
    { Metric: "Orders placed (awaiting confirmation)", Value: pending },
    { Metric: "Orders confirmed", Value: confirmed },
    { Metric: "Orders rejected", Value: rejected },
    { Metric: "Paid orders counted in revenue", Value: paidOrders.length },
    { Metric: "Total revenue (paid, non-rejected)", Value: money(revenue) },
    {
      Metric: "Average order value (paid)",
      Value: paidOrders.length ? money(revenue / paidOrders.length) : 0,
    },
    { Metric: "Active products", Value: activeProductCount },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 36 }, { wch: 20 }];
  return sheet;
}

/** Builds and downloads the .xlsx workbook — call directly from a click handler. */
export function exportAdminDataToExcel(orders: Order[], products: Product[]) {
  const wb = XLSX.utils.book_new();

  const { sheet: productSheet, activeProductCount } = productPerformanceSheet(orders, products);

  XLSX.utils.book_append_sheet(wb, summarySheet(orders, activeProductCount), "Summary");
  XLSX.utils.book_append_sheet(wb, ordersSheet(orders), "Orders");
  XLSX.utils.book_append_sheet(wb, customersSheet(orders), "Customers");
  XLSX.utils.book_append_sheet(wb, productSheet, "Product Performance");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `little-brownie-co-report-${stamp}.xlsx`);
}
