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
  getAllReviews,
  setReviewStatus,
  subscribeReviews,
  type Review,
} from "@/lib/reviews";
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
    "overview" | "orders" | "products" | "reviews" | "analytics"
  >("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const refreshProducts = () => getAllProductsAdmin().then(setProducts);

  useEffect(() => {
    refreshProducts();
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

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-center" theme="light" />
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
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "products", label: "Products", icon: Package },
            { id: "reviews", label: "Reviews", icon: MessageSquare, badge: pendingReviewCount },
            { id: "analytics", label: "Analytics", icon: LayoutDashboard },
          ].map(({ id, label, icon: Icon, badge }) => (
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
          <div className="flex items-center justify-between px-4 py-4 md:px-10 md:py-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-toffee">Dashboard</div>
              <h1 className="mt-1 font-serif text-2xl text-primary capitalize md:text-3xl">{tab}</h1>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
            {["overview", "orders", "products", "reviews", "analytics"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as typeof tab)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs capitalize ${tab === t ? "bg-primary text-primary-foreground" : "border border-border text-primary"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 md:p-10">
          {tab === "overview" && <Overview stats={stats} orders={orders} />}
          {tab === "orders" && <Orders orders={orders} setStatus={setStatus} />}
          {tab === "products" && <ProductsAdmin products={products} refresh={refreshProducts} />}
          {tab === "reviews" && <ReviewsAdmin reviews={reviews} setStatus={reviewStatus} />}
          {tab === "analytics" && <Analytics orders={orders} products={products} />}
        </div>
      </main>
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

function Orders({
  orders,
  setStatus,
}: {
  orders: Order[];
  setStatus: (id: string, status: OrderStatus) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
      {/* MOBILE: card list */}
      <div className="space-y-3 md:hidden">
        {orders.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No orders yet — orders placed at checkout will show up here in real time.
          </div>
        )}
        {orders.map((o) => (
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
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No orders yet — orders placed at checkout will show up here in real time.
                </td>
              </tr>
            )}
            {orders.map((o) => (
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
                    <td colSpan={8} className="px-6 py-5">
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

/* Delivery is now "Calculated at dispatch" — the old distance-based
   delivery-fee-slab admin screen has been removed. Delivery fees are no
   longer managed here. */

function ReviewsAdmin({
  reviews,
  setStatus,
}: {
  reviews: Review[];
  setStatus: (id: string, status: Review["status"]) => void | Promise<void>;
}) {
  const pending = reviews.filter((r) => r.status === "pending");
  const decided = reviews.filter((r) => r.status !== "pending");

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

  const Card = ({ r }: { r: Review }) => (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-primary">
            {r.name}
            {r.location ? ` · ${r.location}` : ""}
          </div>
          <RatingStars rating={r.rating} />
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
            r.status === "approved"
              ? "bg-secondary text-primary"
              : r.status === "rejected"
                ? "bg-destructive/15 text-destructive"
                : "bg-accent/25 text-cocoa"
          }`}
        >
          {r.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-primary/80">"{r.text}"</p>
      <div className="mt-4 flex gap-2">
        {r.status !== "approved" && (
          <button
            onClick={() => setStatus(r.id, "approved")}
            className="rounded-full bg-primary px-4 py-1.5 text-xs uppercase tracking-wider text-primary-foreground hover:bg-cocoa-dark active:bg-cocoa-dark"
          >
            Approve
          </button>
        )}
        {r.status !== "rejected" && (
          <button
            onClick={() => setStatus(r.id, "rejected")}
            className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-wider text-primary hover:bg-destructive/10 hover:text-destructive"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-primary">Pending approval</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New customer reviews wait here until approved — only approved reviews show on the
          public Reviews page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews waiting for approval.</p>
          )}
          {pending.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-primary">Approved &amp; rejected</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decided.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </div>
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
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : draft.image ? [draft.image] : undefined,
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
        price: Number(draft.price),
        variants: cleanVariants.length ? cleanVariants : undefined,
        gallery: cleanGallery.length ? cleanGallery : undefined,
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

// function ProductModal({
//   draft,
//   saving,
//   onClose,
//   onSave,
// }: {
//   draft: Draft;
//   saving: boolean;
//   onClose: () => void;
//   onSave: (d: Draft) => void;
// }) {
//   const [d, setD] = useState<Draft>(draft);
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
//       <div className="relative w-full max-w-lg rounded-lg bg-card p-8">
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 text-muted-foreground hover:text-primary"
//           aria-label="Close"
//         >
//           <X className="h-5 w-5" />
//         </button>
//         <h2 className="font-serif text-3xl text-primary">
//           {d.id ? "Edit product" : "New product"}
//         </h2>
//         <div className="mt-6 space-y-3">
//           <Field label="Name">
//             <input
//               value={d.name || ""}
//               onChange={(e) => setD({ ...d, name: e.target.value })}
//               className="input"
//             />
//           </Field>
//           <Field label="Tagline">
//             <input
//               value={d.tagline || ""}
//               onChange={(e) => setD({ ...d, tagline: e.target.value })}
//               className="input"
//             />
//           </Field>
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="Price (₹)">
//               <input
//                 type="number"
//                 value={d.price || ""}
//                 onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
//                 className="input"
//               />
//             </Field>
//             <Field label="Category">
//               <select
//                 value={d.category || "Signature"}
//                 onChange={(e) => setD({ ...d, category: e.target.value as Product["category"] })}
//                 className="input"
//               >
//                 {["Signature", "Bites", "Loaves", "Cakes", "Hampers"].map((c) => (
//                   <option key={c}>{c}</option>
//                 ))}
//               </select>
//             </Field>
//           </div>
//           <Field label="Image URL">
//             <input
//               value={d.image || ""}
//               onChange={(e) => setD({ ...d, image: e.target.value })}
//               className="input"
//               placeholder="https://..."
//             />
//           </Field>
//           <Field label="Description">
//             <textarea
//               rows={3}
//               value={d.description || ""}
//               onChange={(e) => setD({ ...d, description: e.target.value })}
//               className="input"
//             />
//           </Field>
//         </div>
//         <div className="mt-6 flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary hover:bg-secondary"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => onSave(d)}
//             disabled={saving}
//             className="rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-cocoa-dark active:bg-cocoa-dark disabled:opacity-50"
//           >
//             {saving ? "Saving…" : "Save"}
//           </button>
//         </div>
//       </div>
//       <style>{`.input{width:100%;border:1px solid var(--border);background:var(--background);padding:0.5rem 0.75rem;border-radius:0.375rem;font-size:0.875rem;color:var(--foreground)}`}</style>
//     </div>
//   );
// }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-card p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-primary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-3xl text-primary">
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
                value={d.category || "Signature"}
                onChange={(e) => setD({ ...d, category: e.target.value as Product["category"] })}
                className="input"
              >
                {["Signature", "Bites", "Loaves", "Cakes", "Hampers"].map((c) => (
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
                  <img src={d.image} alt="" className="h-full w-full object-cover" />
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
              Options (label · price) — shown as choices on the product page
            </span>
            <div className="mt-2 space-y-2">
              {(d.variants || []).map((v, i) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    value={v.label}
                    onChange={(e) => {
                      const next = [...(d.variants || [])];
                      next[i] = { ...next[i], label: e.target.value };
                      setD({ ...d, variants: next });
                    }}
                    placeholder="e.g. 6 pcs · Dark Chocolate"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={v.price || ""}
                    onChange={(e) => {
                      const next = [...(d.variants || [])];
                      next[i] = { ...next[i], price: Number(e.target.value) };
                      setD({ ...d, variants: next });
                    }}
                    placeholder="₹"
                    className="input w-24"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.variants || []).filter((_, idx) => idx !== i);
                      setD({ ...d, variants: next });
                    }}
                    className="shrink-0 rounded-full border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setD({ ...d, variants: [...(d.variants || []), emptyVariant()] })}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-primary hover:border-accent hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
              <p className="text-[11px] text-muted-foreground">
                Leave empty (or all options blank) to keep the single Price field above as the
                only option.
              </p>
            </div>
          </div>

          {/* Gallery: extra photos shown in the product page image strip. */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Gallery photos
            </span>
            <div className="mt-2 flex flex-wrap gap-3">
              {(d.gallery || []).map((g, i) => (
                <div key={i} className="relative h-20 w-20 shrink-0">
                  <img src={g} alt="" className="h-full w-full rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.gallery || []).filter((_, idx) => idx !== i);
                      setD({ ...d, gallery: next });
                    }}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
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
                    setD((prev) => ({ ...prev, gallery: [...(prev.gallery || []), result.url] }));
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              If left empty, the main product photo above is used as the only gallery image.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
