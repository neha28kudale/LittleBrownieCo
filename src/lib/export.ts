/**
 * Admin dashboard → Excel export.
 *
 * Creates a single .xlsx workbook with four sheets:
 *
 * 1. Summary
 * 2. Orders
 * 3. Customers
 * 4. Product Performance
 *
 * The report includes both:
 * - Total order value (all non-rejected orders)
 * - Paid revenue (paid + non-rejected orders)
 *
 * This is intended for bookkeeping, taxes,
 * sales tracking, and general record keeping.
 */

import * as XLSX from "xlsx";

import type { Order } from "./orders";
import type { Product } from "./products";

import { formatDisplayDate } from "./delivery";

/* ============================================================
   HELPERS
============================================================ */

function money(value: number): number {
  return Number((value || 0).toFixed(2));
}

function formatDateTime(value: string): string {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN");
}

function formatDate(value: string): string {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN");
}

/* ============================================================
   ORDERS SHEET
============================================================ */

function ordersSheet(orders: Order[]) {
  const rows = orders.map((order) => ({
    "Order #": order.orderNumber,

    "Placed At": formatDateTime(order.createdAt),

    Customer: order.customerName,

    Phone: order.phone,

    Email: order.email ?? "",

    Address: order.address,

    Items: order.items
      .map(
        (item) =>
          `${item.qty} x ${item.productName} (${item.variantLabel})`,
      )
      .join("; "),

    "Delivery Date": formatDisplayDate(
      order.deliveryDate,
    ),

    "Delivery Slot": order.deliverySlot,

    Subtotal: money(order.subtotal),

    "Delivery Fee": money(order.deliveryFee),

    Total: money(order.total),

    "Payment Status": order.paymentStatus,

    "Order Status": order.orderStatus,

    Notes: order.notes ?? "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 14 }, // Order #
    { wch: 22 }, // Placed At
    { wch: 22 }, // Customer
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 35 }, // Address
    { wch: 50 }, // Items
    { wch: 16 }, // Delivery Date
    { wch: 18 }, // Delivery Slot
    { wch: 12 }, // Subtotal
    { wch: 14 }, // Delivery Fee
    { wch: 12 }, // Total
    { wch: 16 }, // Payment Status
    { wch: 18 }, // Order Status
    { wch: 30 }, // Notes
  ];

  return sheet;
}

/* ============================================================
   CUSTOMERS SHEET
============================================================ */

function customersSheet(orders: Order[]) {
  type CustomerData = {
    name: string;
    phone: string;
    email?: string;
    orders: number;
    totalOrderValue: number;
    paidSpend: number;
    pendingPayment: number;
    lastOrder: string;
  };

  const byPhone = new Map<string, CustomerData>();

  for (const order of orders) {
    /*
     * Rejected orders are not treated as sales.
     */
    const isRejected =
      order.orderStatus === "rejected";

    const orderValue = isRejected
      ? 0
      : order.total;

    const paidValue =
      !isRejected &&
      order.paymentStatus === "paid"
        ? order.total
        : 0;

    const pendingValue =
      !isRejected &&
      order.paymentStatus !== "paid"
        ? order.total
        : 0;

    const existing = byPhone.get(order.phone);

    if (existing) {
      /*
       * Count only non-rejected orders as customer orders.
       */
      if (!isRejected) {
        existing.orders += 1;
        existing.totalOrderValue += orderValue;
        existing.paidSpend += paidValue;
        existing.pendingPayment += pendingValue;
      }

      if (
        new Date(order.createdAt) >
        new Date(existing.lastOrder)
      ) {
        existing.lastOrder = order.createdAt;
      }

      if (!existing.email && order.email) {
        existing.email = order.email;
      }
    } else {
      byPhone.set(order.phone, {
        name: order.customerName,

        phone: order.phone,

        email: order.email,

        orders: isRejected ? 0 : 1,

        totalOrderValue: orderValue,

        paidSpend: paidValue,

        pendingPayment: pendingValue,

        lastOrder: order.createdAt,
      });
    }
  }

  const rows = Array.from(byPhone.values())
    .sort(
      (a, b) =>
        b.totalOrderValue -
        a.totalOrderValue,
    )
    .map((customer) => ({
      Customer: customer.name,

      Phone: customer.phone,

      Email: customer.email ?? "",

      "Total Orders": customer.orders,

      "Total Order Value":
        money(customer.totalOrderValue),

      "Paid Spend":
        money(customer.paidSpend),

      "Pending Payment":
        money(customer.pendingPayment),

      "Last Order":
        formatDate(customer.lastOrder),
    }));

  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 22 },
    { wch: 15 },
    { wch: 25 },
    { wch: 14 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
  ];

  return sheet;
}

/* ============================================================
   PRODUCT PERFORMANCE SHEET
============================================================ */

function productPerformanceSheet(
  orders: Order[],
  products: Product[],
) {
  type ProductStats = {
    qty: number;
    revenue: number;
  };

  const byName = new Map<
    string,
    ProductStats
  >();

  for (const order of orders) {
    /*
     * Rejected orders should not contribute
     * to product sales/revenue.
     */
    if (order.orderStatus === "rejected") {
      continue;
    }

    for (const item of order.items) {
      const key = `${item.productName} — ${item.variantLabel}`;

      const existing = byName.get(key);

      if (existing) {
        existing.qty += item.qty;
        existing.revenue += item.lineTotal;
      } else {
        byName.set(key, {
          qty: item.qty,
          revenue: item.lineTotal,
        });
      }
    }
  }

  const rows = Array.from(byName.entries())
    .sort(
      (a, b) =>
        b[1].revenue - a[1].revenue,
    )
    .map(([name, stats]) => ({
      "Product (Variant)": name,

      "Units Sold": stats.qty,

      Revenue: money(stats.revenue),
    }));

  /*
   * Add products that have never been ordered.
   */
  const soldProductNames = new Set(
    Array.from(byName.keys()).map((name) =>
      name.split(" — ")[0],
    ),
  );

  for (const product of products) {
    if (!soldProductNames.has(product.name)) {
      rows.push({
        "Product (Variant)": `${product.name} — No sales`,
        "Units Sold": 0,
        Revenue: 0,
      });
    }
  }

  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 40 },
    { wch: 14 },
    { wch: 16 },
  ];

  const activeProductCount = products.filter(
    (product) =>
      product.isActive !== false,
  ).length;

  return {
    sheet,
    activeProductCount,
  };
}

/* ============================================================
   SUMMARY SHEET
============================================================ */

function summarySheet(
  orders: Order[],
  activeProductCount: number,
) {
  /*
   * Rejected orders are excluded from sales.
   */
  const validOrders = orders.filter(
    (order) =>
      order.orderStatus !== "rejected",
  );

  /*
   * Paid orders:
   * paymentStatus === "paid"
   */
  const paidOrders = validOrders.filter(
    (order) =>
      order.paymentStatus === "paid",
  );

  /*
   * Pending/unpaid orders.
   *
   * Anything that isn't paid is treated as
   * pending payment for reporting purposes.
   */
  const unpaidOrders = validOrders.filter(
    (order) =>
      order.paymentStatus !== "paid",
  );

  /*
   * TOTAL ORDER VALUE
   *
   * Includes every non-rejected order,
   * regardless of payment status.
   */
  const totalOrderValue = validOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0,
  );

  /*
   * PAID REVENUE
   *
   * Only paid + non-rejected orders.
   */
  const paidRevenue = paidOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0,
  );

  /*
   * PENDING PAYMENT VALUE
   */
  const pendingPayment = unpaidOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0,
  );

  /*
   * Average value across ALL valid orders.
   */
  const averageOrderValue =
    validOrders.length > 0
      ? totalOrderValue / validOrders.length
      : 0;

  /*
   * Average paid order value.
   */
  const averagePaidOrderValue =
    paidOrders.length > 0
      ? paidRevenue / paidOrders.length
      : 0;

  /*
   * Order status counts.
   */
  const pendingOrders = orders.filter(
    (order) =>
      order.orderStatus === "order_placed",
  ).length;

  const confirmedOrders = orders.filter(
    (order) =>
      order.orderStatus ===
      "order_confirmed",
  ).length;

  const rejectedOrders = orders.filter(
    (order) =>
      order.orderStatus === "rejected",
  ).length;

  /*
   * Build summary rows.
   */
  const rows = [
    {
      Metric: "Report generated",
      Value: new Date().toLocaleString("en-IN"),
    },

    {
      Metric: "Total orders",
      Value: orders.length,
    },

    {
      Metric:
        "Orders placed (awaiting confirmation)",
      Value: pendingOrders,
    },

    {
      Metric: "Orders confirmed",
      Value: confirmedOrders,
    },

    {
      Metric: "Orders rejected",
      Value: rejectedOrders,
    },

    {
      Metric: "Valid orders (non-rejected)",
      Value: validOrders.length,
    },

    {
      Metric: "Paid orders",
      Value: paidOrders.length,
    },

    {
      Metric: "Unpaid / pending payment orders",
      Value: unpaidOrders.length,
    },

    {
      Metric: "Total order value (non-rejected)",
      Value: money(totalOrderValue),
    },

    {
      Metric: "Paid revenue (non-rejected)",
      Value: money(paidRevenue),
    },

    {
      Metric: "Pending payment value",
      Value: money(pendingPayment),
    },

    {
      Metric: "Average order value",
      Value: money(averageOrderValue),
    },

    {
      Metric: "Average paid order value",
      Value: money(averagePaidOrderValue),
    },

    {
      Metric: "Active products",
      Value: activeProductCount,
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 42 },
    { wch: 24 },
  ];

  return sheet;
}

/* ============================================================
   MAIN EXPORT FUNCTION
============================================================ */

/**
 * Builds and downloads the complete Excel workbook.
 */
export function exportAdminDataToExcel(
  orders: Order[],
  products: Product[],
) {
  /*
   * Create a new workbook.
   */
  const workbook = XLSX.utils.book_new();

  /*
   * Create all four sheets.
   */
  const {
    sheet: productSheet,
    activeProductCount,
  } = productPerformanceSheet(
    orders,
    products,
  );

  const summary = summarySheet(
    orders,
    activeProductCount,
  );

  const ordersSheetData =
    ordersSheet(orders);

  const customersSheetData =
    customersSheet(orders);

  /*
   * IMPORTANT:
   *
   * All four sheets are explicitly added
   * to the SAME workbook.
   */
  XLSX.utils.book_append_sheet(
    workbook,
    summary,
    "Summary",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    ordersSheetData,
    "Orders",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    customersSheetData,
    "Customers",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    productSheet,
    "Product Performance",
  );

  /*
   * Filename.
   */
  const stamp = new Date()
    .toISOString()
    .slice(0, 10);

  const filename =
    `little-brownie-co-report-${stamp}.xlsx`;

  /*
   * Download workbook.
   */
  XLSX.writeFile(
    workbook,
    filename,
  );
}
