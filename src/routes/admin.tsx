import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  getAllProductsAdmin,
  createProductRow,
  updateProductRow,
  deleteProductRow,
  uploadProductImage,
  deleteProductImage,
  type Product,
  type Variant,
  IMG,
  fromPrice,
} from "@/lib/products";
import {
  getAllOrders,
  setOrderStatus,
  subscribeOrders,
  formatPlacedAt,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

import {
  getAdminSession,
  adminSignIn,
  adminSignOut,
  onAdminAuthChange,
  type AdminSession,
} from "@/lib/admin-auth";
import {
  getDeliverySlabs,
  updateDeliverySlabFee,
  updateDeliverySlab,
  createDeliverySlab,
  deleteDeliverySlab,
  type DeliverySlab,
} from "@/lib/delivery";
import {
  getAllReviews,
  setReviewStatus,
  setShowOnHomepage,
  subscribeReviews,
  type Review,
} from "@/lib/reviews";
import { exportAdminDataToExcel } from "@/lib/export";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  LogOut,
  Star,
  MessageSquare,
  Check,
  Ban,
  ImagePlus,
  Loader2,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  MapPin,
  Download,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Little Brownie Co." },
      { name: "description", content: "Little Brownie Co. admin dashboard (demo)." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Admin — Little Brownie Co." },
      { property: "og:description", content: "Admin dashboard (demo)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Customer = {
  key: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function itemsSummary(order: Order) {
  return order.items.map((it) => `${it.qty} × ${it.productName}`).join(", ");
}

function Admin() {
  const [session, setSession] = useState<AdminSession | "loading">("loading");

  const refresh = async () => setSession(await getAdminSession());

  useEffect(() => {
    refresh();
    return onAdminAuthChange(refresh);
  }, []);

  if (session === "loading") return null;
  if (!session) return <AdminLogin onSuccess={refresh} />;
  return <AdminDashboard session={session} onLogout={refresh} />;
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await adminSignIn(email, password);
    setSubmitting(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Toaster position="bottom-center" theme="light" />
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-soft">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-accent">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-center font-serif text-2xl text-primary">Admin sign in</h1>
        <p className="mt-2 text-center text-xs text-muted-foreground">Little Brownie Co. staff dashboard</p>
        <label className="mt-6 block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email</span>
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
          />
        </label>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-accent">
          Back to site
        </Link>
      </form>
    </div>
  );
}

function AdminDashboard({
  session,
  onLogout,
}: {
  session: NonNullable<AdminSession>;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<
    "overview" | "orders" | "products" | "customers" | "reviews" | "analytics" | "delivery"
  >("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [deliverySlabs, setDeliverySlabs] = useState<DeliverySlab[]>([]);
  const [exporting, setExporting] = useState(false);

  const refreshProducts = () => getAllProductsAdmin().then(setProducts);
  const refreshDeliverySlabs = () => getDeliverySlabs().then(setDeliverySlabs);

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    refreshDeliverySlabs();
  }, []);

  useEffect(() => {
    const load = () => {
      getAllOrders().then(setOrders);
    };
    load();
    return subscribeOrders(load);
  }, []);

  useEffect(() => {
    const load = () => {
      getAllReviews().then(setReviews);
    };
    load();
    return subscribeReviews(load);
  }, []);

  const reviewHomepage = async (id: string, showOnHomepage: boolean) => {
    await setShowOnHomepage(id, showOnHomepage);
    setReviews(await getAllReviews());
    toast.success(showOnHomepage ? "Added to homepage" : "Removed from homepage");
  };

  const reviewStatus = async (id: string, status: Review["status"]) => {
    await setReviewStatus(id, status);
    setReviews(await getAllReviews());
    toast.success(`Review ${status}`);
  };

  const pendingReviewCount = reviews.filter((r) => r.status === "pending").length;

  const setStatus = async (id: string, status: OrderStatus) => {
    await setOrderStatus(id, status);
    setOrders(await getAllOrders());
    toast.success(`Order ${status.replace("_", " ")}`);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export yet");
      return;
    }
    try {
      setExporting(true);
      exportAdminDataToExcel(orders, products);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Export failed — please try again");
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === "order_placed").length,
      completed: orders.filter((o) => o.orderStatus === "order_confirmed").length,
      approved: orders.filter((o) => o.orderStatus === "order_confirmed").length,
      baking: orders.filter((o) => o.orderStatus === "baking").length,
      outForDelivery: orders.filter((o) => o.orderStatus === "out_for_delivery").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      rejected: orders.filter((o) => o.orderStatus === "rejected").length,
      products: products.length,
      revenue: orders
        .filter((o) => o.orderStatus !== "rejected" && o.paymentStatus === "paid")
        .reduce((s, o) => s + o.total, 0),
    }),
    [orders, products],
  );

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      const key = o.phone || o.email || o.customerName;
      const existing = map.get(key);
      const isPaid = o.orderStatus !== "rejected" && o.paymentStatus === "paid";
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += isPaid ? o.total : 0;
        if (new Date(o.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = o.createdAt;
          existing.customerName = o.customerName;
          existing.address = o.address;
        }
        if (!existing.email && o.email) existing.email = o.email;
      } else {
        map.set(key, {
          key,
          customerName: o.customerName,
          phone: o.phone,
          email: o.email,
          address: o.address,
          orderCount: 1,
          totalSpent: isPaid ? o.total : 0,
          lastOrderAt: o.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
    );
  }, [orders]);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "delivery", label: "Delivery Fees", icon: Truck },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reviews", label: "Reviews", icon: MessageSquare, badge: pendingReviewCount },
    { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-center" theme="light" offset={{ bottom: "72px" }} mobileOffset={{ bottom: "76px" }} />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-3 border-b border-border px-6 py-5">
          <img src={IMG.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="font-serif text-base leading-tight text-primary">Little Brownie</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Admin
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex w-full items-center justify-between rounded-md px-4 py-2.5 text-sm transition ${
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-primary/80 hover:bg-sidebar-accent"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" /> {label}
              </span>
              {!!badge && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-cocoa">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 border-t border-border p-4 text-left text-[10px] uppercase tracking-[0.18em] text-primary/80 hover:text-accent disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export to Excel"}
        </button>
        <button
          onClick={async () => {
            await adminSignOut();
            onLogout();
          }}
          className="flex items-center gap-2 border-t border-border p-4 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out ({session.email})
        </button>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-10 md:py-5">
            <Link to="/" className="flex items-center gap-2.5 md:hidden">
              <img src={IMG.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="leading-tight">
                <div className="font-serif text-sm text-primary">Little Brownie</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Admin
                </div>
              </div>
            </Link>
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-toffee">Dashboard</div>
                <h1 className="mt-1 font-serif text-2xl text-primary capitalize md:text-3xl">{tab}</h1>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-primary hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "Exporting…" : "Export to Excel"}
              </button>
            </div>
            <button
              onClick={async () => {
                await adminSignOut();
                onLogout();
              }}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-destructive md:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 md:hidden">
            <h1 className="font-serif text-xl text-primary capitalize">{tab}</h1>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-primary disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "…" : "Export"}
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 md:p-10 md:pb-10">
          {tab === "overview" && <Overview stats={stats} orders={orders} />}
          {tab === "orders" && <Orders orders={orders} setStatus={setStatus} />}
          {tab === "products" && <ProductsAdmin products={products} refresh={refreshProducts} />}
          {tab === "delivery" && (
            <DeliveryFeesAdmin slabs={deliverySlabs} refresh={refreshDeliverySlabs} />
          )}
          {tab === "customers" && <CustomersAdmin customers={customers} />}
          {tab === "reviews" && (
            <ReviewsAdmin reviews={reviews} setStatus={reviewStatus} setHomepage={reviewHomepage} />
          )}
          {tab === "analytics" && <Analytics orders={orders} products={products} />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-7 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`relative flex flex-col items-center gap-1 py-2.5 text-[9px] uppercase tracking-tight transition ${
              tab === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${tab === id ? "text-primary" : ""}`} />
              {!!badge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] text-cocoa">
                  {badge}
                </span>
              )}
            </span>
            <span className="leading-none">{label}</span>
            {tab === id && (
              <span className="absolute inset-x-3 -top-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Overview({
  stats,
  orders,
}: {
  stats: {
    total: number;
    pending: number;
    completed: number;
    approved: number;
    baking: number;
    outForDelivery: number;
    delivered: number;
    rejected: number;
    products: number;
    revenue: number;
  };
  orders: Order[];
}) {
  const cards = [
    { label: "Total Orders", value: stats.total },
    { label: "Pending Orders", value: stats.pending },
    { label: "Completed Orders", value: stats.completed },
    { label: "Products Live", value: stats.products },
  ];
  const orderStatusCards = [
    { label: "Pending", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Baking", value: stats.baking },
    { label: "Out for Delivery", value: stats.outForDelivery },
    { label: "Delivered", value: stats.delivered },
    { label: "Rejected", value: stats.rejected },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              {c.label}
            </div>
            <div className="mt-2 font-serif text-2xl text-primary sm:mt-3 sm:text-4xl">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-primary">Orders by status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick summary of every order tab in the Orders page.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {orderStatusCards.map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-2 font-serif text-2xl text-primary">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl text-primary">Revenue this week</h2>
          <div className="font-serif text-3xl text-accent">
            ₹{stats.revenue.toLocaleString("en-IN")}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Across {stats.total} orders. Excludes cancellations.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-2xl text-primary">Recent orders</h2>
        </div>
        <div className="divide-y divide-border">
          {orders.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No orders yet — orders placed on the site's /order form will show up here in real
              time.
            </div>
          )}
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
              <div className="min-w-0">
                <div className="truncate font-medium text-primary">
                  {o.orderNumber} · {o.customerName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{itemsSummary(o)}</div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <StatusBadge order={o} />
                <div className="font-serif text-lg text-primary">₹{o.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ order }: { order: Order }) {
  if (order.orderStatus === "rejected") {
    return (
      <span className="rounded-full bg-[oklch(0.9_0.03_30)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.13_25)]">
        Rejected
      </span>
    );
  }
  if (order.orderStatus === "order_confirmed") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_140)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.35_0.08_140)]">
        Order confirmed
      </span>
    );
  }
  if (order.orderStatus === "baking") {
    return (
      <span className="rounded-full bg-[oklch(0.9_0.06_75)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_60)]">
        Baking
      </span>
    );
  }
  if (order.orderStatus === "out_for_delivery") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_240)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_240)]">
        Out for delivery
      </span>
    );
  }
  if (order.orderStatus === "delivered") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_140)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.35_0.08_140)]">
        Delivered
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[oklch(0.92_0.06_75)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_60)]">
      Order placed
    </span>
  );
}

function PaymentBadge({ status }: { status: Order["paymentStatus"] }) {
  const map = {
    pending: "bg-[oklch(0.9_0.02_60)] text-muted-foreground",
    paid: "bg-[oklch(0.88_0.06_140)] text-[oklch(0.35_0.08_140)]",
    failed: "bg-[oklch(0.9_0.03_30)] text-[oklch(0.4_0.13_25)]",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${map[status]}`}>
      {status}
    </span>
  );
}

const ORDER_STATUS_TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "order_placed", label: "Pending" },
  { id: "order_confirmed", label: "Approved" },
  { id: "baking", label: "Baking" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "rejected", label: "Rejected" },
];

function Orders({
  orders,
  setStatus,
}: {
  orders: Order[];
  setStatus: (id: string, status: OrderStatus) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const statusCounts = useMemo(() => {
    const counts: Record<"all" | OrderStatus, number> = {
      all: orders.length,
      order_placed: 0,
      order_confirmed: 0,
      baking: 0,
      out_for_delivery: 0,
      delivered: 0,
      rejected: 0,
    };
    for (const o of orders) counts[o.orderStatus] += 1;
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusTab !== "all" && o.orderStatus !== statusTab) return false;
      if (dateFilter && o.deliveryDate !== dateFilter) return false;
      if (q) {
        const haystack = `${o.customerName} ${o.orderNumber} ${o.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusTab, search, dateFilter]);

  const hasActiveFilters = !!search || !!dateFilter;

  const ActionButtons = ({ o }: { o: Order }) => (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {o.orderStatus !== "order_confirmed" && (
        <button
          onClick={() => setStatus(o.id, "order_confirmed")}
          title="Approve — customer sees 'Order confirmed'"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] text-primary-foreground hover:bg-cocoa-dark"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
      )}
      {o.orderStatus !== "rejected" && (
        <button
          onClick={() => setStatus(o.id, "rejected")}
          title="Reject"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-primary hover:bg-destructive/10 hover:text-destructive"
        >
          <Ban className="h-3.5 w-3.5" /> Reject
        </button>
      )}
      {o.orderStatus !== "rejected" && (
        <select
          value={
            ["baking", "out_for_delivery", "delivered"].includes(o.orderStatus)
              ? o.orderStatus
              : ""
          }
          onChange={(e) => e.target.value && setStatus(o.id, e.target.value as OrderStatus)}
          title="Update tracking stage — shown to the customer on their order page"
          className="rounded-full border border-border bg-transparent px-2.5 py-1.5 text-[11px] text-primary"
        >
          <option value="">Tracking…</option>
          <option value="baking">Baking</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      )}
    </div>
  );

  const OrderDetails = ({ o }: { o: Order }) => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Items</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {o.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 text-primary/85">
              <span>
                {it.qty} × {it.productName}{" "}
                <span className="text-xs text-muted-foreground">({it.variantLabel})</span>
              </span>
              <span className="shrink-0">₹{it.lineTotal}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Delivery fee</span>
          <span>{o.deliveryFee > 0 ? `₹${o.deliveryFee}` : "Calculated at dispatch"}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Delivery
        </div>
        <p className="mt-2 text-sm text-primary/85">
          {o.address}
          <br />
          <span className="font-medium text-primary">Delivery date &amp; time:</span>{" "}
          {o.deliveryDate} · {o.deliverySlot}
          {o.email && (
            <>
              <br />
              {o.email}
            </>
          )}
          {o.notes && (
            <>
              <br />
              Notes: {o.notes}
            </>
          )}
          {o.cashfreeOrderId && (
            <>
              <br />
              Cashfree order: {o.cashfreeOrderId}
            </>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary of orders by status */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ORDER_STATUS_TABS.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-3">
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {t.label}
            </div>
            <div className="mt-1.5 font-serif text-xl text-primary">{statusCounts[t.id]}</div>
          </div>
        ))}
      </div>

      {/* Search + date filter — shared across all status tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, order # or phone"
          className="w-full flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-primary outline-none focus:border-accent sm:max-w-xs"
        />
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter by delivery date"
            className="w-full rounded-full border border-border bg-background px-4 py-2.5 pr-9 text-sm text-primary outline-none focus:border-accent sm:w-auto"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              aria-label="Clear delivery date filter"
              title="Clear delivery date filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {ORDER_STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusTab(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
              statusTab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-primary/80 hover:border-accent hover:text-accent"
            }`}
          >
            {t.label} ({statusCounts[t.id]})
          </button>
        ))}
      </div>

      {/* MOBILE: card list */}
      <div className="space-y-3 md:hidden">
        {filteredOrders.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            {orders.length === 0
              ? "No orders yet — orders placed at checkout will show up here in real time."
              : "No orders match your search or filters."}
          </div>
        )}
        {filteredOrders.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <button
              className="flex w-full flex-col gap-3 px-4 py-4 text-left"
              onClick={() => setExpanded((e) => (e === o.id ? null : o.id))}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-primary">{o.orderNumber}</div>
                  <div className="truncate text-sm text-primary/80">{o.customerName}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </div>
                <div className="shrink-0 text-right font-serif text-lg text-primary">
                  ₹{o.total}
                </div>
              </div>
              <div className="truncate text-xs text-muted-foreground">{itemsSummary(o)}</div>
              <div className="text-xs text-muted-foreground">
                Delivery: {o.deliveryDate} · {o.deliverySlot}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PaymentBadge status={o.paymentStatus} />
                <StatusBadge order={o} />
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {formatPlacedAt(o.createdAt)}
                </span>
              </div>
            </button>
            <div className="border-t border-border px-4 py-3">
              <ActionButtons o={o} />
            </div>
            {expanded === o.id && (
              <div className="border-t border-border bg-secondary/20 px-4 py-4">
                <OrderDetails o={o} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-6 py-4 text-left">Order</th>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Items</th>
              <th className="px-6 py-4 text-left">Placed</th>
              <th className="px-6 py-4 text-left">Delivery date &amp; time</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {orders.length === 0
                    ? "No orders yet — orders placed at checkout will show up here in real time."
                    : "No orders match your search or filters."}
                </td>
              </tr>
            )}
            {filteredOrders.map((o) => (
              <React.Fragment key={o.id}>
                <tr
                  className="cursor-pointer hover:bg-secondary/30"
                  onClick={() => setExpanded((e) => (e === o.id ? null : o.id))}
                >
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-muted-foreground">
                    {itemsSummary(o)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatPlacedAt(o.createdAt)}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {o.deliveryDate} · {o.deliverySlot}
                  </td>
                  <td className="px-6 py-4 text-right font-serif text-base text-primary">
                    ₹{o.total}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge order={o} />
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons o={o} />
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr className="bg-secondary/20">
                    <td colSpan={9} className="px-6 py-5">
                      <OrderDetails o={o} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

/* Delivery fees are distance-based (see src/lib/delivery.ts +
   supabase/functions/calculate-delivery-fee). Admins can add, edit (both
   the km range and the fee), and remove ranges here. */

type SlabDraft = { minKm: string; maxKm: string; fee: string };

function DeliveryFeesAdmin({
  slabs,
  refresh,
}: {
  slabs: DeliverySlab[];
  refresh: () => void;
}) {
  const [edits, setEdits] = useState<Record<string, SlabDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSlab, setNewSlab] = useState<SlabDraft>({ minKm: "", maxKm: "", fee: "" });

  const rangeLabel = (s: DeliverySlab) =>
    s.maxKm === null ? `${s.minKm}+ km` : `${s.minKm}–${s.maxKm} km`;

  const startEdit = (s: DeliverySlab) =>
    setEdits((d) => ({
      ...d,
      [s.id]: { minKm: String(s.minKm), maxKm: s.maxKm === null ? "" : String(s.maxKm), fee: String(s.fee) },
    }));

  const cancelEdit = (id: string) =>
    setEdits((d) => {
      const { [id]: _drop, ...rest } = d;
      return rest;
    });

  const parseDraft = (draft: SlabDraft): { minKm: number; maxKm: number | null; fee: number } | null => {
    const minKm = Number(draft.minKm);
    const fee = Number(draft.fee);
    const maxKm = draft.maxKm.trim() === "" ? null : Number(draft.maxKm);
    if (Number.isNaN(minKm) || minKm < 0) return null;
    if (Number.isNaN(fee) || fee < 0) return null;
    if (maxKm !== null && (Number.isNaN(maxKm) || maxKm <= minKm)) return null;
    return { minKm, maxKm, fee };
  };

  const save = async (id: string) => {
    const draft = edits[id];
    const parsed = draft && parseDraft(draft);
    if (!parsed) {
      toast.error("Please enter a valid range (max > min) and fee.");
      return;
    }
    setSavingId(id);
    const ok = await updateDeliverySlab(id, parsed);
    setSavingId(null);
    if (ok) {
      toast.success("Delivery range updated");
      cancelEdit(id);
      refresh();
    } else {
      toast.error("Couldn't save — please try again.");
    }
  };

  const remove = async (s: DeliverySlab) => {
    if (!window.confirm(`Remove the ${rangeLabel(s)} range?`)) return;
    setDeletingId(s.id);
    const ok = await deleteDeliverySlab(s.id);
    setDeletingId(null);
    if (ok) {
      toast.success("Range removed");
      refresh();
    } else {
      toast.error("Couldn't remove — please try again.");
    }
  };

  const addSlab = async () => {
    const parsed = parseDraft(newSlab);
    if (!parsed) {
      toast.error("Please enter a valid range (max > min) and fee.");
      return;
    }
    setAdding(true);
    const nextSortOrder = slabs.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 1;
    const ok = await createDeliverySlab({ ...parsed, sortOrder: nextSortOrder });
    setAdding(false);
    if (ok) {
      toast.success("Range added");
      setNewSlab({ minKm: "", maxKm: "", fee: "" });
      refresh();
    } else {
      toast.error("Couldn't add — please try again.");
    }
  };

  const draftInputClass =
    "w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-primary outline-none focus:border-accent";

  return (
    <div className="max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-2xl text-primary">Delivery Fees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          At checkout, the customer's delivery pincode is checked against our
          dispatch pincode (560029) to work out the distance, which is
          matched against the ranges below. Customers only ever see the
          final fee, never these ranges. Ranges should not overlap.
        </p>

        <div className="mt-5 divide-y divide-border">
          {slabs.map((s) => {
            const editing = edits[s.id];
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                {editing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editing.minKm}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, minKm: e.target.value } }))}
                      placeholder="Min km"
                      className={draftInputClass}
                    />
                    <span className="text-sm text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      value={editing.maxKm}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, maxKm: e.target.value } }))}
                      placeholder="Max (blank = +)"
                      className={draftInputClass}
                    />
                    <span className="text-sm text-muted-foreground">km · ₹</span>
                    <input
                      type="number"
                      min={0}
                      value={editing.fee}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, fee: e.target.value } }))}
                      placeholder="Fee"
                      className={draftInputClass}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-primary/90">
                    {rangeLabel(s)} — ₹{s.fee}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => save(s.id)}
                        disabled={savingId === s.id}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-cocoa-dark disabled:opacity-50"
                      >
                        {savingId === s.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => cancelEdit(s.id)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(s)}
                        disabled={deletingId === s.id}
                        className="rounded-full border border-destructive/40 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === s.id ? "Removing…" : "Remove"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {slabs.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No delivery fee ranges found.
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Add a new range</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              value={newSlab.minKm}
              onChange={(e) => setNewSlab((d) => ({ ...d, minKm: e.target.value }))}
              placeholder="Min km"
              className={draftInputClass}
            />
            <span className="text-sm text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              value={newSlab.maxKm}
              onChange={(e) => setNewSlab((d) => ({ ...d, maxKm: e.target.value }))}
              placeholder="Max (blank = +)"
              className={draftInputClass}
            />
            <span className="text-sm text-muted-foreground">km · ₹</span>
            <input
              type="number"
              min={0}
              value={newSlab.fee}
              onChange={(e) => setNewSlab((d) => ({ ...d, fee: e.target.value }))}
              placeholder="Fee"
              className={draftInputClass}
            />
            <button
              onClick={addSlab}
              disabled={adding}
              className="rounded-full bg-primary px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-cocoa-dark disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add range"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsAdmin({
  reviews,
  setStatus,
  setHomepage,
}: {
  reviews: Review[];
  setStatus: (id: string, status: Review["status"]) => void | Promise<void>;
  setHomepage: (id: string, showOnHomepage: boolean) => void | Promise<void>;
}) {
  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </div>
  );

  const Card = ({ r }: { r: Review }) => {
    const shown = r.status === "approved";
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-primary">
              {r.name}
              {r.location ? ` · ${r.location}` : ""}
            </div>
            <RatingStars rating={r.rating} />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {shown ? "On site" : "Hidden"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={shown}
              onClick={() => setStatus(r.id, shown ? "rejected" : "approved")}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                shown ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  shown ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-primary/80">"{r.text}"</p>
        {shown && (
          <div className="mt-4">
            <button
              onClick={() => setHomepage(r.id, !r.showOnHomepage)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
                r.showOnHomepage
                  ? "border-accent bg-accent/25 text-cocoa"
                  : "border-border text-primary hover:bg-secondary"
              }`}
            >
              {r.showOnHomepage ? "On homepage ✓" : "Show on homepage"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="font-serif text-2xl text-primary">Reviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Flip a review "On site" to show it on the public Reviews page, or "Hidden" to keep it
        off. Once a review is on site, use "Show on homepage" to also feature it there
        separately.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
        {reviews.map((r) => (
          <Card key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

type Draft = Partial<Product> & { price?: number };

function emptyVariant(): Variant {
  return { id: `v-${Math.random().toString(36).slice(2, 9)}`, label: "", price: 0 };
}

function ProductsAdmin({
  products,
  refresh,
}: {
  products: Product[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (draft: Draft) => {
    if (!draft.name || !draft.price) {
      toast.error("Name and price are required");
      return;
    }
    const cleanVariants = (draft.variants || [])
      .filter((v) => v.label.trim() && v.price > 0)
      .map((v) => ({ id: v.id, label: v.label.trim(), price: Number(v.price) }));
    const cleanGallery = (draft.gallery || []).filter(Boolean);
    const cleanGalleryPositions = cleanGallery.map((_, i) => (draft.galleryPositions || [])[i] || "center");
    const cleanFlavours = (draft.flavours || []).map((f) => f.trim()).filter(Boolean);
    const cleanIngredients = (draft.ingredients || []).map((i) => i.trim()).filter(Boolean);

    setSaving(true);
    if (draft.id) {
      const result = await updateProductRow(draft.id, {
        name: draft.name,
        tagline: draft.tagline,
        category: draft.category as Product["category"],
        description: draft.description,
        image: draft.image,
        imagePosition: draft.imagePosition,
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : draft.image ? [draft.image] : undefined,
        galleryPositions: cleanGallery.length ? cleanGalleryPositions : undefined,
        flavours: cleanFlavours,
        ingredients: cleanIngredients,
      });
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Product updated");
    } else {
      const result = await createProductRow({
        name: draft.name as string,
        tagline: draft.tagline,
        category: (draft.category as Product["category"]) || "Signature",
        description: draft.description,
        image: draft.image || IMG.littleBox,
        imagePosition: draft.imagePosition,
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : undefined,
        galleryPositions: cleanGallery.length ? cleanGalleryPositions : undefined,
        flavours: cleanFlavours,
        ingredients: cleanIngredients,
      });
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Product added");
    }
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteProductRow(id);
    toast.success("Product removed");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>
      {/* MOBILE: card list */}
      <div className="space-y-3 md:hidden">
        {products.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No products yet — add your first one above.
          </div>
        )}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <img
              src={p.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-primary">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">{p.tagline}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{p.category}</span>
                <span>·</span>
                <span className="font-serif text-sm text-primary">₹{fromPrice(p)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button
                onClick={() => setEditing({ ...p, price: fromPrice(p) })}
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(p.id)}
                className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                      <div>
                        <div className="font-medium text-primary">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{p.category}</td>
                  <td className="px-6 py-4 text-right font-serif text-base text-primary">
                    ₹{fromPrice(p)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing({ ...p, price: fromPrice(p) })}
                        className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductModal draft={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function ProductModal({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(!draft.image);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const previousImage = d.image;
    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Clean up the previous uploaded image so storage doesn't fill up with orphans.
    if (previousImage) void deleteProductImage(previousImage);
    setD((prev) => ({ ...prev, image: result.url }));
    toast.success("Image uploaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-lg sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-2xl text-primary sm:text-3xl">
          {d.id ? "Edit product" : "New product"}
        </h2>
        <div className="mt-6 space-y-3">
          <Field label="Name">
            <input
              value={d.name || ""}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Tagline">
            <input
              value={d.tagline || ""}
              onChange={(e) => setD({ ...d, tagline: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                value={d.price || ""}
                onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Category">
              <select
                value={d.category || "Mini Bites"}
                onChange={(e) => setD({ ...d, category: e.target.value as Product["category"] })}
                className="input"
              >
                {["Mini Bites", "Cakes", "Hampers", "Add-ons", "Limited Editions"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Product image">
            <div className="mt-1 flex items-start gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : d.image ? (
                  <img
                    src={d.image}
                    alt=""
                    style={{ objectPosition: d.imagePosition || "center" }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : d.image ? "Replace photo" : "Upload photo"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlField((s) => !s)}
                  className="block text-[11px] text-muted-foreground underline underline-offset-2 hover:text-accent"
                >
                  {showUrlField ? "Hide" : "Or paste an image URL instead"}
                </button>
                {showUrlField && (
                  <input
                    value={d.image || ""}
                    onChange={(e) => setD({ ...d, image: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                )}
              </div>
            </div>
          </Field>

          {d.image && (
            <Field label="Image alignment">
              <p className="mb-2 text-[11px] text-muted-foreground">
                Choose which part of the photo stays in frame when it's cropped into the square/portrait
                card on the site.
              </p>
              <div className="grid w-24 grid-cols-3 gap-1 rounded-lg border border-dashed border-border bg-secondary/40 p-1.5">
                {(
                  [
                    "left top",
                    "center top",
                    "right top",
                    "left center",
                    "center",
                    "right center",
                    "left bottom",
                    "center bottom",
                    "right bottom",
                  ] as const
                ).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setD({ ...d, imagePosition: pos })}
                    aria-label={pos}
                    className={`h-6 w-6 rounded-sm border transition-colors ${
                      (d.imagePosition || "center") === pos
                        ? "border-accent bg-accent"
                        : "border-border bg-card hover:border-accent"
                    }`}
                  />
                ))}
              </div>
            </Field>
          )}

          <Field label="Description">
            <textarea
              rows={3}
              value={d.description || ""}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              className="input"
            />
          </Field>

          <Field label="Flavours (comma separated)">
            <input
              value={(d.flavours || []).join(", ")}
              onChange={(e) =>
                setD({ ...d, flavours: e.target.value.split(",").map((s) => s.trim()) })
              }
              className="input"
              placeholder="Dark Chocolate, Walnut, Nutella"
            />
          </Field>

          <Field label="Ingredients (comma separated)">
            <input
              value={(d.ingredients || []).join(", ")}
              onChange={(e) =>
                setD({ ...d, ingredients: e.target.value.split(",").map((s) => s.trim()) })
              }
              className="input"
              placeholder="Belgian dark chocolate, Butter, Eggs"
            />
          </Field>

          {/* Variants: every size/flavour + price option shown as a button on the
              product page. Full CRUD here, not just a single price field. */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sizes / Options — each row below is one button shown on the product page
            </span>
            <div className="mt-2 space-y-3">
              {(d.variants || []).map((v, i) => (
                <div key={v.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                        Size / Quantity (e.g. 500g, 1kg, 6 pcs)
                      </label>
                      <input
                        value={v.label ?? ""}
                        onChange={(e) => {
                          const next = [...(d.variants || [])];
                          next[i] = { ...next[i], label: e.target.value };
                          setD({ ...d, variants: next });
                        }}
                        placeholder="e.g. 1kg"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="input w-full"
                      />
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={v.price ?? ""}
                        onChange={(e) => {
                          const next = [...(d.variants || [])];
                          next[i] = { ...next[i], price: Number(e.target.value) };
                          setD({ ...d, variants: next });
                        }}
                        placeholder="₹"
                        autoComplete="off"
                        className="input w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (d.variants || []).filter((_, idx) => idx !== i);
                        setD({ ...d, variants: next });
                      }}
                      className="mb-0.5 shrink-0 rounded-full border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setD({ ...d, variants: [...(d.variants || []), emptyVariant()] })}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-primary hover:border-accent hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add another size
              </button>
              <p className="text-[11px] text-muted-foreground">
                Customers will see one button per row above (e.g. "500g", "1kg"). If you leave
                all rows empty, the single Price field near the top of this form is used instead.
              </p>
            </div>
          </div>

          {/* Gallery: extra photos shown in the product page image strip. */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Gallery photos
            </span>
            <p className="mb-2 mt-1 text-[11px] text-muted-foreground">
              Use the arrows to reorder photos. Tap the dots under a photo to choose which part
              of it stays in frame.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {(d.gallery || []).map((g, i) => {
                const galleryLen = (d.gallery || []).length;
                const moveTo = (from: number, to: number) => {
                  if (to < 0 || to >= galleryLen) return;
                  const nextGallery = [...(d.gallery || [])];
                  const nextPositions = [...(d.galleryPositions || [])];
                  while (nextPositions.length < galleryLen) nextPositions.push("center");
                  const [movedImg] = nextGallery.splice(from, 1);
                  nextGallery.splice(to, 0, movedImg);
                  const [movedPos] = nextPositions.splice(from, 1);
                  nextPositions.splice(to, 0, movedPos);
                  setD({ ...d, gallery: nextGallery, galleryPositions: nextPositions });
                };
                return (
                <div key={g + i} className="w-20 shrink-0">
                  <div className="relative h-20 w-20">
                    <img
                      src={g}
                      alt=""
                      style={{ objectPosition: (d.galleryPositions || [])[i] || "center" }}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextGallery = (d.gallery || []).filter((_, idx) => idx !== i);
                        const nextPositions = (d.galleryPositions || []).filter((_, idx) => idx !== i);
                        setD({ ...d, gallery: nextGallery, galleryPositions: nextPositions });
                      }}
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => moveTo(i, i - 1)}
                      disabled={i === 0}
                      aria-label="Move photo left"
                      className="grid h-6 w-6 place-items-center rounded-md border border-border text-primary hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => moveTo(i, i + 1)}
                      disabled={i === galleryLen - 1}
                      aria-label="Move photo right"
                      className="grid h-6 w-6 place-items-center rounded-md border border-border text-primary hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 grid w-20 grid-cols-3 gap-0.5 rounded-md border border-dashed border-border bg-secondary/40 p-1">
                    {(
                      [
                        "left top",
                        "center top",
                        "right top",
                        "left center",
                        "center",
                        "right center",
                        "left bottom",
                        "center bottom",
                        "right bottom",
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          const next = [...(d.galleryPositions || [])];
                          while (next.length <= i) next.push("center");
                          next[i] = pos;
                          setD({ ...d, galleryPositions: next });
                        }}
                        aria-label={pos}
                        className={`h-4 w-full rounded-sm border transition-colors ${
                          ((d.galleryPositions || [])[i] || "center") === pos
                            ? "border-accent bg-accent"
                            : "border-border bg-card hover:border-accent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                );
              })}
              <label className="grid h-20 w-20 shrink-0 cursor-pointer place-items-center rounded-md border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
                {galleryUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={galleryUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setGalleryUploading(true);
                    const result = await uploadProductImage(file);
                    setGalleryUploading(false);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    setD((prev) => ({
                      ...prev,
                      gallery: [...(prev.gallery || []), result.url],
                      galleryPositions: [...(prev.galleryPositions || []), "center"],
                    }));
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              If left empty, the main product photo above is used as the only gallery image.
            </p>
          </div>
        </div>
        <div className="sticky -bottom-5 -mx-5 mt-6 flex justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(d)}
            disabled={saving || uploading}
            className="rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--border);background:var(--background);padding:0.5rem 0.75rem;border-radius:0.375rem;font-size:0.875rem;color:var(--foreground)}`}</style>
    </div>
  );
}
function Analytics({ orders, products }: { orders: Order[]; products: Product[] }) {
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
    const confirmedOrders = orders.filter((o) => o.orderStatus === "order_confirmed");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    // Calculate average order value
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    // Get top products by quantity sold
    const productSales: Record<string, number> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        productSales[item.productName] = (productSales[item.productName] || 0) + item.qty;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Calculate daily revenue for last 7 days
    const today = new Date();
    const dailyRevenue: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyRevenue[dateStr] = 0;
    }

    paidOrders.forEach((o) => {
      const dateStr = o.createdAt.split("T")[0];
      if (dateStr in dailyRevenue) {
        dailyRevenue[dateStr] += o.total;
      }
    });

    return {
      totalRevenue,
      avgOrderValue,
      paidOrders: paidOrders.length,
      confirmedOrders: confirmedOrders.length,
      topProducts,
      dailyRevenue,
    };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Revenue (Paid)
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Average Order Value
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">₹{stats.avgOrderValue}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Paid Orders
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">{stats.paidOrders}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Confirmed Orders
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">{stats.confirmedOrders}</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl text-primary">Top 5 Products by Quantity</h2>
          <div className="mt-6 space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="text-sm text-primary/80">
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-semibold text-primary">{p.qty} sold</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl text-primary">Last 7 Days Revenue</h2>
          <div className="mt-6 space-y-3">
            {Object.entries(stats.dailyRevenue)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, revenue]) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm text-primary/80">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold text-primary">₹{revenue.toLocaleString("en-IN")}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersAdmin({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary sm:max-w-sm"
        />
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {filtered.length} customer{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No customers found.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3 text-center">Orders</th>
                  <th className="px-6 py-3 text-right">Total spent</th>
                  <th className="px-6 py-3">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr
                    key={c.key}
                    className="cursor-pointer hover:bg-secondary/30"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-6 py-4 font-medium text-primary">{c.customerName}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-xs">{c.email}</div>}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-muted-foreground">
                      {c.address}
                    </td>
                    <td className="px-6 py-4 text-center">{c.orderCount}</td>
                    <td className="px-6 py-4 text-right font-serif text-base text-primary">
                      ₹{c.totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatPlacedAt(c.lastOrderAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelected(c)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-primary">{c.customerName}</div>
                  <div className="font-serif text-base text-primary">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.phone}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                  </span>
                  <span>{formatPlacedAt(c.lastOrderAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-card p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl text-primary">{selected.customerName}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Customer details
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-primary/90">
                <Phone className="h-4 w-4 text-toffee" /> {selected.phone}
              </div>
              {selected.email && (
                <div className="flex items-center gap-2.5 text-primary/90">
                  <Mail className="h-4 w-4 text-toffee" /> {selected.email}
                </div>
              )}
              <div className="flex items-start gap-2.5 text-primary/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-toffee" /> {selected.address}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total orders
                </div>
                <div className="mt-1 font-serif text-lg text-primary">{selected.orderCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total spent
                </div>
                <div className="mt-1 font-serif text-lg text-primary">
                  ₹{selected.totalSpent.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  getAllProductsAdmin,
  createProductRow,
  updateProductRow,
  deleteProductRow,
  uploadProductImage,
  deleteProductImage,
  type Product,
  type Variant,
  IMG,
  fromPrice,
} from "@/lib/products";
import {
  getAllOrders,
  setOrderStatus,
  subscribeOrders,
  formatPlacedAt,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

import {
  getAdminSession,
  adminSignIn,
  adminSignOut,
  onAdminAuthChange,
  type AdminSession,
} from "@/lib/admin-auth";
import {
  getDeliverySlabs,
  updateDeliverySlabFee,
  updateDeliverySlab,
  createDeliverySlab,
  deleteDeliverySlab,
  type DeliverySlab,
} from "@/lib/delivery";
import {
  getAllReviews,
  setReviewStatus,
  setShowOnHomepage,
  subscribeReviews,
  type Review,
} from "@/lib/reviews";
import { exportAdminDataToExcel } from "@/lib/export";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  LogOut,
  Star,
  MessageSquare,
  Check,
  Ban,
  ImagePlus,
  Loader2,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  MapPin,
  Download,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Little Brownie Co." },
      { name: "description", content: "Little Brownie Co. admin dashboard (demo)." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Admin — Little Brownie Co." },
      { property: "og:description", content: "Admin dashboard (demo)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Customer = {
  key: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function itemsSummary(order: Order) {
  return order.items.map((it) => `${it.qty} × ${it.productName}`).join(", ");
}

function Admin() {
  const [session, setSession] = useState<AdminSession | "loading">("loading");

  const refresh = async () => setSession(await getAdminSession());

  useEffect(() => {
    refresh();
    return onAdminAuthChange(refresh);
  }, []);

  if (session === "loading") return null;
  if (!session) return <AdminLogin onSuccess={refresh} />;
  return <AdminDashboard session={session} onLogout={refresh} />;
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await adminSignIn(email, password);
    setSubmitting(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Toaster position="bottom-center" theme="light" />
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-soft">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-accent">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-center font-serif text-2xl text-primary">Admin sign in</h1>
        <p className="mt-2 text-center text-xs text-muted-foreground">Little Brownie Co. staff dashboard</p>
        <label className="mt-6 block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email</span>
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent"
          />
        </label>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-accent">
          Back to site
        </Link>
      </form>
    </div>
  );
}

function AdminDashboard({
  session,
  onLogout,
}: {
  session: NonNullable<AdminSession>;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<
    "overview" | "orders" | "products" | "customers" | "reviews" | "analytics" | "delivery"
  >("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [deliverySlabs, setDeliverySlabs] = useState<DeliverySlab[]>([]);
  const [exporting, setExporting] = useState(false);

  const refreshProducts = () => getAllProductsAdmin().then(setProducts);
  const refreshDeliverySlabs = () => getDeliverySlabs().then(setDeliverySlabs);

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    refreshDeliverySlabs();
  }, []);

  useEffect(() => {
    const load = () => {
      getAllOrders().then(setOrders);
    };
    load();
    return subscribeOrders(load);
  }, []);

  useEffect(() => {
    const load = () => {
      getAllReviews().then(setReviews);
    };
    load();
    return subscribeReviews(load);
  }, []);

  const reviewHomepage = async (id: string, showOnHomepage: boolean) => {
    await setShowOnHomepage(id, showOnHomepage);
    setReviews(await getAllReviews());
    toast.success(showOnHomepage ? "Added to homepage" : "Removed from homepage");
  };

  const reviewStatus = async (id: string, status: Review["status"]) => {
    await setReviewStatus(id, status);
    setReviews(await getAllReviews());
    toast.success(`Review ${status}`);
  };

  const pendingReviewCount = reviews.filter((r) => r.status === "pending").length;

  const setStatus = async (id: string, status: OrderStatus) => {
    await setOrderStatus(id, status);
    setOrders(await getAllOrders());
    toast.success(`Order ${status.replace("_", " ")}`);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export yet");
      return;
    }
    try {
      setExporting(true);
      exportAdminDataToExcel(orders, products);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Export failed — please try again");
    } finally {
      setExporting(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === "order_placed").length,
      completed: orders.filter((o) => o.orderStatus === "order_confirmed").length,
      approved: orders.filter((o) => o.orderStatus === "order_confirmed").length,
      baking: orders.filter((o) => o.orderStatus === "baking").length,
      outForDelivery: orders.filter((o) => o.orderStatus === "out_for_delivery").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      rejected: orders.filter((o) => o.orderStatus === "rejected").length,
      products: products.length,
      revenue: orders
        .filter((o) => o.orderStatus !== "rejected" && o.paymentStatus === "paid")
        .reduce((s, o) => s + o.total, 0),
    }),
    [orders, products],
  );

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      const key = o.phone || o.email || o.customerName;
      const existing = map.get(key);
      const isPaid = o.orderStatus !== "rejected" && o.paymentStatus === "paid";
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += isPaid ? o.total : 0;
        if (new Date(o.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = o.createdAt;
          existing.customerName = o.customerName;
          existing.address = o.address;
        }
        if (!existing.email && o.email) existing.email = o.email;
      } else {
        map.set(key, {
          key,
          customerName: o.customerName,
          phone: o.phone,
          email: o.email,
          address: o.address,
          orderCount: 1,
          totalSpent: isPaid ? o.total : 0,
          lastOrderAt: o.createdAt,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
    );
  }, [orders]);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "delivery", label: "Delivery Fees", icon: Truck },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reviews", label: "Reviews", icon: MessageSquare, badge: pendingReviewCount },
    { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-center" theme="light" offset={{ bottom: "72px" }} mobileOffset={{ bottom: "76px" }} />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-3 border-b border-border px-6 py-5">
          <img src={IMG.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="font-serif text-base leading-tight text-primary">Little Brownie</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Admin
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex w-full items-center justify-between rounded-md px-4 py-2.5 text-sm transition ${
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-primary/80 hover:bg-sidebar-accent"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" /> {label}
              </span>
              {!!badge && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-cocoa">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 border-t border-border p-4 text-left text-[10px] uppercase tracking-[0.18em] text-primary/80 hover:text-accent disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export to Excel"}
        </button>
        <button
          onClick={async () => {
            await adminSignOut();
            onLogout();
          }}
          className="flex items-center gap-2 border-t border-border p-4 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out ({session.email})
        </button>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-10 md:py-5">
            <Link to="/" className="flex items-center gap-2.5 md:hidden">
              <img src={IMG.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="leading-tight">
                <div className="font-serif text-sm text-primary">Little Brownie</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Admin
                </div>
              </div>
            </Link>
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-toffee">Dashboard</div>
                <h1 className="mt-1 font-serif text-2xl text-primary capitalize md:text-3xl">{tab}</h1>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-primary hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {exporting ? "Exporting…" : "Export to Excel"}
              </button>
            </div>
            <button
              onClick={async () => {
                await adminSignOut();
                onLogout();
              }}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-destructive md:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 md:hidden">
            <h1 className="font-serif text-xl text-primary capitalize">{tab}</h1>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-primary disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "…" : "Export"}
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 md:p-10 md:pb-10">
          {tab === "overview" && <Overview stats={stats} orders={orders} />}
          {tab === "orders" && <Orders orders={orders} setStatus={setStatus} />}
          {tab === "products" && <ProductsAdmin products={products} refresh={refreshProducts} />}
          {tab === "delivery" && (
            <DeliveryFeesAdmin slabs={deliverySlabs} refresh={refreshDeliverySlabs} />
          )}
          {tab === "customers" && <CustomersAdmin customers={customers} />}
          {tab === "reviews" && (
            <ReviewsAdmin reviews={reviews} setStatus={reviewStatus} setHomepage={reviewHomepage} />
          )}
          {tab === "analytics" && <Analytics orders={orders} products={products} />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-7 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`relative flex flex-col items-center gap-1 py-2.5 text-[9px] uppercase tracking-tight transition ${
              tab === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${tab === id ? "text-primary" : ""}`} />
              {!!badge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] text-cocoa">
                  {badge}
                </span>
              )}
            </span>
            <span className="leading-none">{label}</span>
            {tab === id && (
              <span className="absolute inset-x-3 -top-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Overview({
  stats,
  orders,
}: {
  stats: {
    total: number;
    pending: number;
    completed: number;
    approved: number;
    baking: number;
    outForDelivery: number;
    delivered: number;
    rejected: number;
    products: number;
    revenue: number;
  };
  orders: Order[];
}) {
  const cards = [
    { label: "Total Orders", value: stats.total },
    { label: "Pending Orders", value: stats.pending },
    { label: "Completed Orders", value: stats.completed },
    { label: "Products Live", value: stats.products },
  ];
  const orderStatusCards = [
    { label: "Pending", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Baking", value: stats.baking },
    { label: "Out for Delivery", value: stats.outForDelivery },
    { label: "Delivered", value: stats.delivered },
    { label: "Rejected", value: stats.rejected },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              {c.label}
            </div>
            <div className="mt-2 font-serif text-2xl text-primary sm:mt-3 sm:text-4xl">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-primary">Orders by status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick summary of every order tab in the Orders page.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {orderStatusCards.map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-2 font-serif text-2xl text-primary">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl text-primary">Revenue this week</h2>
          <div className="font-serif text-3xl text-accent">
            ₹{stats.revenue.toLocaleString("en-IN")}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Across {stats.total} orders. Excludes cancellations.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-2xl text-primary">Recent orders</h2>
        </div>
        <div className="divide-y divide-border">
          {orders.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No orders yet — orders placed on the site's /order form will show up here in real
              time.
            </div>
          )}
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
              <div className="min-w-0">
                <div className="truncate font-medium text-primary">
                  {o.orderNumber} · {o.customerName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{itemsSummary(o)}</div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <StatusBadge order={o} />
                <div className="font-serif text-lg text-primary">₹{o.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ order }: { order: Order }) {
  if (order.orderStatus === "rejected") {
    return (
      <span className="rounded-full bg-[oklch(0.9_0.03_30)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.13_25)]">
        Rejected
      </span>
    );
  }
  if (order.orderStatus === "order_confirmed") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_140)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.35_0.08_140)]">
        Order confirmed
      </span>
    );
  }
  if (order.orderStatus === "baking") {
    return (
      <span className="rounded-full bg-[oklch(0.9_0.06_75)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_60)]">
        Baking
      </span>
    );
  }
  if (order.orderStatus === "out_for_delivery") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_240)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_240)]">
        Out for delivery
      </span>
    );
  }
  if (order.orderStatus === "delivered") {
    return (
      <span className="rounded-full bg-[oklch(0.88_0.06_140)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.35_0.08_140)]">
        Delivered
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[oklch(0.92_0.06_75)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0.1_60)]">
      Order placed
    </span>
  );
}

function PaymentBadge({ status }: { status: Order["paymentStatus"] }) {
  const map = {
    pending: "bg-[oklch(0.9_0.02_60)] text-muted-foreground",
    paid: "bg-[oklch(0.88_0.06_140)] text-[oklch(0.35_0.08_140)]",
    failed: "bg-[oklch(0.9_0.03_30)] text-[oklch(0.4_0.13_25)]",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${map[status]}`}>
      {status}
    </span>
  );
}

const ORDER_STATUS_TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "order_placed", label: "Pending" },
  { id: "order_confirmed", label: "Approved" },
  { id: "baking", label: "Baking" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "rejected", label: "Rejected" },
];

function Orders({
  orders,
  setStatus,
}: {
  orders: Order[];
  setStatus: (id: string, status: OrderStatus) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const statusCounts = useMemo(() => {
    const counts: Record<"all" | OrderStatus, number> = {
      all: orders.length,
      order_placed: 0,
      order_confirmed: 0,
      baking: 0,
      out_for_delivery: 0,
      delivered: 0,
      rejected: 0,
    };
    for (const o of orders) counts[o.orderStatus] += 1;
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusTab !== "all" && o.orderStatus !== statusTab) return false;
      if (dateFilter && o.deliveryDate !== dateFilter) return false;
      if (q) {
        const haystack = `${o.customerName} ${o.orderNumber} ${o.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusTab, search, dateFilter]);

  const hasActiveFilters = !!search || !!dateFilter;

  const ActionButtons = ({ o }: { o: Order }) => (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {o.orderStatus !== "order_confirmed" && (
        <button
          onClick={() => setStatus(o.id, "order_confirmed")}
          title="Approve — customer sees 'Order confirmed'"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] text-primary-foreground hover:bg-cocoa-dark"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
      )}
      {o.orderStatus !== "rejected" && (
        <button
          onClick={() => setStatus(o.id, "rejected")}
          title="Reject"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-primary hover:bg-destructive/10 hover:text-destructive"
        >
          <Ban className="h-3.5 w-3.5" /> Reject
        </button>
      )}
      {o.orderStatus !== "rejected" && (
        <select
          value={
            ["baking", "out_for_delivery", "delivered"].includes(o.orderStatus)
              ? o.orderStatus
              : ""
          }
          onChange={(e) => e.target.value && setStatus(o.id, e.target.value as OrderStatus)}
          title="Update tracking stage — shown to the customer on their order page"
          className="rounded-full border border-border bg-transparent px-2.5 py-1.5 text-[11px] text-primary"
        >
          <option value="">Tracking…</option>
          <option value="baking">Baking</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      )}
    </div>
  );

  const OrderDetails = ({ o }: { o: Order }) => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Items</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {o.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 text-primary/85">
              <span>
                {it.qty} × {it.productName}{" "}
                <span className="text-xs text-muted-foreground">({it.variantLabel})</span>
              </span>
              <span className="shrink-0">₹{it.lineTotal}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Delivery fee</span>
          <span>{o.deliveryFee > 0 ? `₹${o.deliveryFee}` : "Calculated at dispatch"}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Delivery
        </div>
        <p className="mt-2 text-sm text-primary/85">
          {o.address}
          <br />
          <span className="font-medium text-primary">Delivery date &amp; time:</span>{" "}
          {o.deliveryDate} · {o.deliverySlot}
          {o.email && (
            <>
              <br />
              {o.email}
            </>
          )}
          {o.notes && (
            <>
              <br />
              Notes: {o.notes}
            </>
          )}
          {o.cashfreeOrderId && (
            <>
              <br />
              Cashfree order: {o.cashfreeOrderId}
            </>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary of orders by status */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ORDER_STATUS_TABS.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card p-3">
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {t.label}
            </div>
            <div className="mt-1.5 font-serif text-xl text-primary">{statusCounts[t.id]}</div>
          </div>
        ))}
      </div>

      {/* Search + date filter — shared across all status tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, order # or phone"
          className="w-full flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-primary outline-none focus:border-accent sm:max-w-xs"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Filter by delivery date"
          className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm text-primary outline-none focus:border-accent sm:w-auto"
        />
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {ORDER_STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusTab(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
              statusTab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-primary/80 hover:border-accent hover:text-accent"
            }`}
          >
            {t.label} ({statusCounts[t.id]})
          </button>
        ))}
      </div>

      {/* MOBILE: card list */}
      <div className="space-y-3 md:hidden">
        {filteredOrders.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            {orders.length === 0
              ? "No orders yet — orders placed at checkout will show up here in real time."
              : "No orders match your search or filters."}
          </div>
        )}
        {filteredOrders.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <button
              className="flex w-full flex-col gap-3 px-4 py-4 text-left"
              onClick={() => setExpanded((e) => (e === o.id ? null : o.id))}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-primary">{o.orderNumber}</div>
                  <div className="truncate text-sm text-primary/80">{o.customerName}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </div>
                <div className="shrink-0 text-right font-serif text-lg text-primary">
                  ₹{o.total}
                </div>
              </div>
              <div className="truncate text-xs text-muted-foreground">{itemsSummary(o)}</div>
              <div className="text-xs text-muted-foreground">
                Delivery: {o.deliveryDate} · {o.deliverySlot}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PaymentBadge status={o.paymentStatus} />
                <StatusBadge order={o} />
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {formatPlacedAt(o.createdAt)}
                </span>
              </div>
            </button>
            <div className="border-t border-border px-4 py-3">
              <ActionButtons o={o} />
            </div>
            {expanded === o.id && (
              <div className="border-t border-border bg-secondary/20 px-4 py-4">
                <OrderDetails o={o} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-6 py-4 text-left">Order</th>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Items</th>
              <th className="px-6 py-4 text-left">Placed</th>
              <th className="px-6 py-4 text-left">Delivery date &amp; time</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {orders.length === 0
                    ? "No orders yet — orders placed at checkout will show up here in real time."
                    : "No orders match your search or filters."}
                </td>
              </tr>
            )}
            {filteredOrders.map((o) => (
              <React.Fragment key={o.id}>
                <tr
                  className="cursor-pointer hover:bg-secondary/30"
                  onClick={() => setExpanded((e) => (e === o.id ? null : o.id))}
                >
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-muted-foreground">
                    {itemsSummary(o)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatPlacedAt(o.createdAt)}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {o.deliveryDate} · {o.deliverySlot}
                  </td>
                  <td className="px-6 py-4 text-right font-serif text-base text-primary">
                    ₹{o.total}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge order={o} />
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons o={o} />
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr className="bg-secondary/20">
                    <td colSpan={9} className="px-6 py-5">
                      <OrderDetails o={o} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

/* Delivery fees are distance-based (see src/lib/delivery.ts +
   supabase/functions/calculate-delivery-fee). Admins can add, edit (both
   the km range and the fee), and remove ranges here. */

type SlabDraft = { minKm: string; maxKm: string; fee: string };

function DeliveryFeesAdmin({
  slabs,
  refresh,
}: {
  slabs: DeliverySlab[];
  refresh: () => void;
}) {
  const [edits, setEdits] = useState<Record<string, SlabDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSlab, setNewSlab] = useState<SlabDraft>({ minKm: "", maxKm: "", fee: "" });

  const rangeLabel = (s: DeliverySlab) =>
    s.maxKm === null ? `${s.minKm}+ km` : `${s.minKm}–${s.maxKm} km`;

  const startEdit = (s: DeliverySlab) =>
    setEdits((d) => ({
      ...d,
      [s.id]: { minKm: String(s.minKm), maxKm: s.maxKm === null ? "" : String(s.maxKm), fee: String(s.fee) },
    }));

  const cancelEdit = (id: string) =>
    setEdits((d) => {
      const { [id]: _drop, ...rest } = d;
      return rest;
    });

  const parseDraft = (draft: SlabDraft): { minKm: number; maxKm: number | null; fee: number } | null => {
    const minKm = Number(draft.minKm);
    const fee = Number(draft.fee);
    const maxKm = draft.maxKm.trim() === "" ? null : Number(draft.maxKm);
    if (Number.isNaN(minKm) || minKm < 0) return null;
    if (Number.isNaN(fee) || fee < 0) return null;
    if (maxKm !== null && (Number.isNaN(maxKm) || maxKm <= minKm)) return null;
    return { minKm, maxKm, fee };
  };

  const save = async (id: string) => {
    const draft = edits[id];
    const parsed = draft && parseDraft(draft);
    if (!parsed) {
      toast.error("Please enter a valid range (max > min) and fee.");
      return;
    }
    setSavingId(id);
    const ok = await updateDeliverySlab(id, parsed);
    setSavingId(null);
    if (ok) {
      toast.success("Delivery range updated");
      cancelEdit(id);
      refresh();
    } else {
      toast.error("Couldn't save — please try again.");
    }
  };

  const remove = async (s: DeliverySlab) => {
    if (!window.confirm(`Remove the ${rangeLabel(s)} range?`)) return;
    setDeletingId(s.id);
    const ok = await deleteDeliverySlab(s.id);
    setDeletingId(null);
    if (ok) {
      toast.success("Range removed");
      refresh();
    } else {
      toast.error("Couldn't remove — please try again.");
    }
  };

  const addSlab = async () => {
    const parsed = parseDraft(newSlab);
    if (!parsed) {
      toast.error("Please enter a valid range (max > min) and fee.");
      return;
    }
    setAdding(true);
    const nextSortOrder = slabs.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 1;
    const ok = await createDeliverySlab({ ...parsed, sortOrder: nextSortOrder });
    setAdding(false);
    if (ok) {
      toast.success("Range added");
      setNewSlab({ minKm: "", maxKm: "", fee: "" });
      refresh();
    } else {
      toast.error("Couldn't add — please try again.");
    }
  };

  const draftInputClass =
    "w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-primary outline-none focus:border-accent";

  return (
    <div className="max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-2xl text-primary">Delivery Fees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          At checkout, the customer's delivery pincode is checked against our
          dispatch pincode (560029) to work out the distance, which is
          matched against the ranges below. Customers only ever see the
          final fee, never these ranges. Ranges should not overlap.
        </p>

        <div className="mt-5 divide-y divide-border">
          {slabs.map((s) => {
            const editing = edits[s.id];
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                {editing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editing.minKm}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, minKm: e.target.value } }))}
                      placeholder="Min km"
                      className={draftInputClass}
                    />
                    <span className="text-sm text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      value={editing.maxKm}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, maxKm: e.target.value } }))}
                      placeholder="Max (blank = +)"
                      className={draftInputClass}
                    />
                    <span className="text-sm text-muted-foreground">km · ₹</span>
                    <input
                      type="number"
                      min={0}
                      value={editing.fee}
                      onChange={(e) => setEdits((d) => ({ ...d, [s.id]: { ...editing, fee: e.target.value } }))}
                      placeholder="Fee"
                      className={draftInputClass}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-primary/90">
                    {rangeLabel(s)} — ₹{s.fee}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => save(s.id)}
                        disabled={savingId === s.id}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-cocoa-dark disabled:opacity-50"
                      >
                        {savingId === s.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => cancelEdit(s.id)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(s)}
                        disabled={deletingId === s.id}
                        className="rounded-full border border-destructive/40 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === s.id ? "Removing…" : "Remove"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {slabs.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No delivery fee ranges found.
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Add a new range</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              value={newSlab.minKm}
              onChange={(e) => setNewSlab((d) => ({ ...d, minKm: e.target.value }))}
              placeholder="Min km"
              className={draftInputClass}
            />
            <span className="text-sm text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              value={newSlab.maxKm}
              onChange={(e) => setNewSlab((d) => ({ ...d, maxKm: e.target.value }))}
              placeholder="Max (blank = +)"
              className={draftInputClass}
            />
            <span className="text-sm text-muted-foreground">km · ₹</span>
            <input
              type="number"
              min={0}
              value={newSlab.fee}
              onChange={(e) => setNewSlab((d) => ({ ...d, fee: e.target.value }))}
              placeholder="Fee"
              className={draftInputClass}
            />
            <button
              onClick={addSlab}
              disabled={adding}
              className="rounded-full bg-primary px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-cocoa-dark disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add range"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsAdmin({
  reviews,
  setStatus,
  setHomepage,
}: {
  reviews: Review[];
  setStatus: (id: string, status: Review["status"]) => void | Promise<void>;
  setHomepage: (id: string, showOnHomepage: boolean) => void | Promise<void>;
}) {
  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </div>
  );

  const Card = ({ r }: { r: Review }) => {
    const shown = r.status === "approved";
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-primary">
              {r.name}
              {r.location ? ` · ${r.location}` : ""}
            </div>
            <RatingStars rating={r.rating} />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {shown ? "On site" : "Hidden"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={shown}
              onClick={() => setStatus(r.id, shown ? "rejected" : "approved")}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                shown ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  shown ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-primary/80">"{r.text}"</p>
        {shown && (
          <div className="mt-4">
            <button
              onClick={() => setHomepage(r.id, !r.showOnHomepage)}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
                r.showOnHomepage
                  ? "border-accent bg-accent/25 text-cocoa"
                  : "border-border text-primary hover:bg-secondary"
              }`}
            >
              {r.showOnHomepage ? "On homepage ✓" : "Show on homepage"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="font-serif text-2xl text-primary">Reviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Flip a review "On site" to show it on the public Reviews page, or "Hidden" to keep it
        off. Once a review is on site, use "Show on homepage" to also feature it there
        separately.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
        {reviews.map((r) => (
          <Card key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

type Draft = Partial<Product> & { price?: number };

function emptyVariant(): Variant {
  return { id: `v-${Math.random().toString(36).slice(2, 9)}`, label: "", price: 0 };
}

function ProductsAdmin({
  products,
  refresh,
}: {
  products: Product[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (draft: Draft) => {
    if (!draft.name || !draft.price) {
      toast.error("Name and price are required");
      return;
    }
    const cleanVariants = (draft.variants || [])
      .filter((v) => v.label.trim() && v.price > 0)
      .map((v) => ({ id: v.id, label: v.label.trim(), price: Number(v.price) }));
    const cleanGallery = (draft.gallery || []).filter(Boolean);
    const cleanGalleryPositions = cleanGallery.map((_, i) => (draft.galleryPositions || [])[i] || "center");
    const cleanFlavours = (draft.flavours || []).map((f) => f.trim()).filter(Boolean);
    const cleanIngredients = (draft.ingredients || []).map((i) => i.trim()).filter(Boolean);

    setSaving(true);
    if (draft.id) {
      const result = await updateProductRow(draft.id, {
        name: draft.name,
        tagline: draft.tagline,
        category: draft.category as Product["category"],
        description: draft.description,
        image: draft.image,
        imagePosition: draft.imagePosition,
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : draft.image ? [draft.image] : undefined,
        galleryPositions: cleanGallery.length ? cleanGalleryPositions : undefined,
        flavours: cleanFlavours,
        ingredients: cleanIngredients,
      });
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Product updated");
    } else {
      const result = await createProductRow({
        name: draft.name as string,
        tagline: draft.tagline,
        category: (draft.category as Product["category"]) || "Signature",
        description: draft.description,
        image: draft.image || IMG.littleBox,
        imagePosition: draft.imagePosition,
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : undefined,
        galleryPositions: cleanGallery.length ? cleanGalleryPositions : undefined,
        flavours: cleanFlavours,
        ingredients: cleanIngredients,
      });
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Product added");
    }
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteProductRow(id);
    toast.success("Product removed");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>
      {/* MOBILE: card list */}
      <div className="space-y-3 md:hidden">
        {products.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No products yet — add your first one above.
          </div>
        )}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <img
              src={p.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-primary">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">{p.tagline}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{p.category}</span>
                <span>·</span>
                <span className="font-serif text-sm text-primary">₹{fromPrice(p)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button
                onClick={() => setEditing({ ...p, price: fromPrice(p) })}
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(p.id)}
                className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                      <div>
                        <div className="font-medium text-primary">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{p.category}</td>
                  <td className="px-6 py-4 text-right font-serif text-base text-primary">
                    ₹{fromPrice(p)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing({ ...p, price: fromPrice(p) })}
                        className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductModal draft={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function ProductModal({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(!draft.image);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const previousImage = d.image;
    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Clean up the previous uploaded image so storage doesn't fill up with orphans.
    if (previousImage) void deleteProductImage(previousImage);
    setD((prev) => ({ ...prev, image: result.url }));
    toast.success("Image uploaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-lg sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-2xl text-primary sm:text-3xl">
          {d.id ? "Edit product" : "New product"}
        </h2>
        <div className="mt-6 space-y-3">
          <Field label="Name">
            <input
              value={d.name || ""}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Tagline">
            <input
              value={d.tagline || ""}
              onChange={(e) => setD({ ...d, tagline: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                value={d.price || ""}
                onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Category">
              <select
                value={d.category || "Mini Bites"}
                onChange={(e) => setD({ ...d, category: e.target.value as Product["category"] })}
                className="input"
              >
                {["Mini Bites", "Cakes", "Hampers", "Add-ons", "Limited Editions"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Product image">
            <div className="mt-1 flex items-start gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : d.image ? (
                  <img
                    src={d.image}
                    alt=""
                    style={{ objectPosition: d.imagePosition || "center" }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : d.image ? "Replace photo" : "Upload photo"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlField((s) => !s)}
                  className="block text-[11px] text-muted-foreground underline underline-offset-2 hover:text-accent"
                >
                  {showUrlField ? "Hide" : "Or paste an image URL instead"}
                </button>
                {showUrlField && (
                  <input
                    value={d.image || ""}
                    onChange={(e) => setD({ ...d, image: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                )}
              </div>
            </div>
          </Field>

          {d.image && (
            <Field label="Image alignment">
              <p className="mb-2 text-[11px] text-muted-foreground">
                Choose which part of the photo stays in frame when it's cropped into the square/portrait
                card on the site.
              </p>
              <div className="grid w-24 grid-cols-3 gap-1 rounded-lg border border-dashed border-border bg-secondary/40 p-1.5">
                {(
                  [
                    "left top",
                    "center top",
                    "right top",
                    "left center",
                    "center",
                    "right center",
                    "left bottom",
                    "center bottom",
                    "right bottom",
                  ] as const
                ).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setD({ ...d, imagePosition: pos })}
                    aria-label={pos}
                    className={`h-6 w-6 rounded-sm border transition-colors ${
                      (d.imagePosition || "center") === pos
                        ? "border-accent bg-accent"
                        : "border-border bg-card hover:border-accent"
                    }`}
                  />
                ))}
              </div>
            </Field>
          )}

          <Field label="Description">
            <textarea
              rows={3}
              value={d.description || ""}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              className="input"
            />
          </Field>

          <Field label="Flavours (comma separated)">
            <input
              value={(d.flavours || []).join(", ")}
              onChange={(e) =>
                setD({ ...d, flavours: e.target.value.split(",").map((s) => s.trim()) })
              }
              className="input"
              placeholder="Dark Chocolate, Walnut, Nutella"
            />
          </Field>

          <Field label="Ingredients (comma separated)">
            <input
              value={(d.ingredients || []).join(", ")}
              onChange={(e) =>
                setD({ ...d, ingredients: e.target.value.split(",").map((s) => s.trim()) })
              }
              className="input"
              placeholder="Belgian dark chocolate, Butter, Eggs"
            />
          </Field>

          {/* Variants: every size/flavour + price option shown as a button on the
              product page. Full CRUD here, not just a single price field. */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sizes / Options — each row below is one button shown on the product page
            </span>
            <div className="mt-2 space-y-3">
              {(d.variants || []).map((v, i) => (
                <div key={v.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                        Size / Quantity (e.g. 500g, 1kg, 6 pcs)
                      </label>
                      <input
                        value={v.label ?? ""}
                        onChange={(e) => {
                          const next = [...(d.variants || [])];
                          next[i] = { ...next[i], label: e.target.value };
                          setD({ ...d, variants: next });
                        }}
                        placeholder="e.g. 1kg"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="input w-full"
                      />
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={v.price ?? ""}
                        onChange={(e) => {
                          const next = [...(d.variants || [])];
                          next[i] = { ...next[i], price: Number(e.target.value) };
                          setD({ ...d, variants: next });
                        }}
                        placeholder="₹"
                        autoComplete="off"
                        className="input w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (d.variants || []).filter((_, idx) => idx !== i);
                        setD({ ...d, variants: next });
                      }}
                      className="mb-0.5 shrink-0 rounded-full border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setD({ ...d, variants: [...(d.variants || []), emptyVariant()] })}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-primary hover:border-accent hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add another size
              </button>
              <p className="text-[11px] text-muted-foreground">
                Customers will see one button per row above (e.g. "500g", "1kg"). If you leave
                all rows empty, the single Price field near the top of this form is used instead.
              </p>
            </div>
          </div>

          {/* Gallery: extra photos shown in the product page image strip. */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Gallery photos
            </span>
            <p className="mb-2 mt-1 text-[11px] text-muted-foreground">
              Use the arrows to reorder photos. Tap the dots under a photo to choose which part
              of it stays in frame.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {(d.gallery || []).map((g, i) => {
                const galleryLen = (d.gallery || []).length;
                const moveTo = (from: number, to: number) => {
                  if (to < 0 || to >= galleryLen) return;
                  const nextGallery = [...(d.gallery || [])];
                  const nextPositions = [...(d.galleryPositions || [])];
                  while (nextPositions.length < galleryLen) nextPositions.push("center");
                  const [movedImg] = nextGallery.splice(from, 1);
                  nextGallery.splice(to, 0, movedImg);
                  const [movedPos] = nextPositions.splice(from, 1);
                  nextPositions.splice(to, 0, movedPos);
                  setD({ ...d, gallery: nextGallery, galleryPositions: nextPositions });
                };
                return (
                <div key={g + i} className="w-20 shrink-0">
                  <div className="relative h-20 w-20">
                    <img
                      src={g}
                      alt=""
                      style={{ objectPosition: (d.galleryPositions || [])[i] || "center" }}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextGallery = (d.gallery || []).filter((_, idx) => idx !== i);
                        const nextPositions = (d.galleryPositions || []).filter((_, idx) => idx !== i);
                        setD({ ...d, gallery: nextGallery, galleryPositions: nextPositions });
                      }}
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => moveTo(i, i - 1)}
                      disabled={i === 0}
                      aria-label="Move photo left"
                      className="grid h-6 w-6 place-items-center rounded-md border border-border text-primary hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => moveTo(i, i + 1)}
                      disabled={i === galleryLen - 1}
                      aria-label="Move photo right"
                      className="grid h-6 w-6 place-items-center rounded-md border border-border text-primary hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 grid w-20 grid-cols-3 gap-0.5 rounded-md border border-dashed border-border bg-secondary/40 p-1">
                    {(
                      [
                        "left top",
                        "center top",
                        "right top",
                        "left center",
                        "center",
                        "right center",
                        "left bottom",
                        "center bottom",
                        "right bottom",
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          const next = [...(d.galleryPositions || [])];
                          while (next.length <= i) next.push("center");
                          next[i] = pos;
                          setD({ ...d, galleryPositions: next });
                        }}
                        aria-label={pos}
                        className={`h-4 w-full rounded-sm border transition-colors ${
                          ((d.galleryPositions || [])[i] || "center") === pos
                            ? "border-accent bg-accent"
                            : "border-border bg-card hover:border-accent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                );
              })}
              <label className="grid h-20 w-20 shrink-0 cursor-pointer place-items-center rounded-md border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
                {galleryUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={galleryUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setGalleryUploading(true);
                    const result = await uploadProductImage(file);
                    setGalleryUploading(false);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    setD((prev) => ({
                      ...prev,
                      gallery: [...(prev.gallery || []), result.url],
                      galleryPositions: [...(prev.galleryPositions || []), "center"],
                    }));
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              If left empty, the main product photo above is used as the only gallery image.
            </p>
          </div>
        </div>
        <div className="sticky -bottom-5 -mx-5 mt-6 flex justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(d)}
            disabled={saving || uploading}
            className="rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--border);background:var(--background);padding:0.5rem 0.75rem;border-radius:0.375rem;font-size:0.875rem;color:var(--foreground)}`}</style>
    </div>
  );
}
function Analytics({ orders, products }: { orders: Order[]; products: Product[] }) {
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
    const confirmedOrders = orders.filter((o) => o.orderStatus === "order_confirmed");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    // Calculate average order value
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    // Get top products by quantity sold
    const productSales: Record<string, number> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        productSales[item.productName] = (productSales[item.productName] || 0) + item.qty;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Calculate daily revenue for last 7 days
    const today = new Date();
    const dailyRevenue: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyRevenue[dateStr] = 0;
    }

    paidOrders.forEach((o) => {
      const dateStr = o.createdAt.split("T")[0];
      if (dateStr in dailyRevenue) {
        dailyRevenue[dateStr] += o.total;
      }
    });

    return {
      totalRevenue,
      avgOrderValue,
      paidOrders: paidOrders.length,
      confirmedOrders: confirmedOrders.length,
      topProducts,
      dailyRevenue,
    };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Revenue (Paid)
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Average Order Value
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">₹{stats.avgOrderValue}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Paid Orders
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">{stats.paidOrders}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Confirmed Orders
          </div>
          <div className="mt-3 font-serif text-4xl text-primary">{stats.confirmedOrders}</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl text-primary">Top 5 Products by Quantity</h2>
          <div className="mt-6 space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="text-sm text-primary/80">
                    {i + 1}. {p.name}
                  </span>
                  <span className="font-semibold text-primary">{p.qty} sold</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl text-primary">Last 7 Days Revenue</h2>
          <div className="mt-6 space-y-3">
            {Object.entries(stats.dailyRevenue)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, revenue]) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm text-primary/80">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold text-primary">₹{revenue.toLocaleString("en-IN")}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersAdmin({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary sm:max-w-sm"
        />
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {filtered.length} customer{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No customers found.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3 text-center">Orders</th>
                  <th className="px-6 py-3 text-right">Total spent</th>
                  <th className="px-6 py-3">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr
                    key={c.key}
                    className="cursor-pointer hover:bg-secondary/30"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-6 py-4 font-medium text-primary">{c.customerName}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-xs">{c.email}</div>}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-muted-foreground">
                      {c.address}
                    </td>
                    <td className="px-6 py-4 text-center">{c.orderCount}</td>
                    <td className="px-6 py-4 text-right font-serif text-base text-primary">
                      ₹{c.totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatPlacedAt(c.lastOrderAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelected(c)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-primary">{c.customerName}</div>
                  <div className="font-serif text-base text-primary">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.phone}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                  </span>
                  <span>{formatPlacedAt(c.lastOrderAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-card p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl text-primary">{selected.customerName}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Customer details
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-primary/90">
                <Phone className="h-4 w-4 text-toffee" /> {selected.phone}
              </div>
              {selected.email && (
                <div className="flex items-center gap-2.5 text-primary/90">
                  <Mail className="h-4 w-4 text-toffee" /> {selected.email}
                </div>
              )}
              <div className="flex items-start gap-2.5 text-primary/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-toffee" /> {selected.address}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total orders
                </div>
                <div className="mt-1 font-serif text-lg text-primary">{selected.orderCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total spent
                </div>
                <div className="mt-1 font-serif text-lg text-primary">
                  ₹{selected.totalSpent.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
