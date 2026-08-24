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
  type DeliverySlab,
} from "@/lib/delivery";
import {
  getAllReviews,
  setReviewStatus,
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
          {tab === "reviews" && <ReviewsAdmin reviews={reviews} setStatus={reviewStatus} />}
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
  stats: { total: number; pending: number; completed: number; products: number; revenue: number };
  orders: Order[];
}) {
  const cards = [
    { label: "Total Orders", value: stats.total },
    { label: "Pending Orders", value: stats.pending },
    { label: "Completed Orders", value: stats.completed },
    { label: "Products Live", value: stats.products },
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
      <span className="rounded-full bg-[oklch(0.88_0.06_240)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[oklch(0.4_0
