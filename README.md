# 🍫 Little Brownie Co.

An online storefront for **Little Brownie Co.**, a bakery brand selling handcrafted brownies, gifting boxes, and treats. Built as a fast, modern e-commerce site with a customer-facing storefront, cart & checkout with online payments, order tracking, and a built-in admin dashboard for managing products, orders, delivery fees, and reviews.

**Live repo:** [neha28kudale/LittleBrownieCo](https://github.com/neha28kudale/LittleBrownieCo)
**Live demo:** https://www.littlebrownieco.in/

---

## ✨ Features

### Storefront
- **Home / Menu / Product pages** with categories, variants, and pricing
- **Cart & Checkout** flow with delivery fee calculation based on location
- **Online payments** via Cashfree (order creation + webhook confirmation)
- **Order tracking** by order ID, with an order confirmation page
- **Favorites / Wishlist** support
- **Gifting** page for gift boxes/hampers
- **Google Reviews** integration (fetched via a Supabase Edge Function)
- **Instagram feed** embed on the homepage
- **Location autocomplete** for delivery addresses (Google Places)
- **Allergy banner**, veg/non-veg badges, FAQs, policies, sustainability & "good to know" info pages
- Responsive UI with scroll progress bar, reveal/scroll animations, and a WhatsApp floating contact button

### Admin Dashboard (`/admin`)
- Secure admin login (Supabase Auth, with a legacy local password fallback)
- Full **product management**: create, update, delete products & variants, upload/delete product images
- **Order management**: view all orders, update order status in real time (live subscriptions)
- **Delivery fee slab** management
- **Review moderation**: approve/reject customer reviews in real time

### Backend
- **Supabase** as the backend (Postgres database, Auth, Storage, Realtime, Edge Functions)
- **Edge Functions** for:
  - `create-cashfree-order` — creates a payment order with Cashfree
  - `cashfree-webhook` — handles payment status webhooks
  - `calculate-delivery-fee` — computes delivery charges by location/slab
  - `google-reviews` — fetches Google Business reviews
  - `instagram-feed` — fetches Instagram post data
  - `places-autocomplete` — proxies Google Places Autocomplete
- SQL **migrations** for schema, extra product fields, and seed data

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + [TanStack Router](https://tanstack.com/router) (file-based routing) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Forms & validation | React Hook Form + Zod |
| Backend / DB | [Supabase](https://supabase.com/) (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Payments | [Cashfree](https://www.cashfree.com/) |
| Location services | Google Places API |
| Build tool | [Vite](https://vitejs.dev/) |
| Language | TypeScript |

---

## 📁 Project Structure

```
LittleBrownieCo/
├── public/                      # Static assets (favicon, robots.txt)
├── src/
│   ├── admin.tsx                # Admin dashboard entry/logic
│   ├── router.tsx                # App router setup
│   ├── server.ts / start.ts      # TanStack Start server entry
│   ├── styles.css                # Global styles (Tailwind)
│   ├── assets/                   # Images used across the site
│   ├── components/
│   │   ├── site/                 # Storefront UI (Header, Footer, CartDrawer,
│   │   │                           ProductCard, InstagramFeed, WhatsAppFab, etc.)
│   │   └── ui/                   # shadcn/ui component primitives
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core logic: products, cart, orders, favorites,
│   │                                delivery, reviews, admin-auth, supabase client, etc.
│   └── routes/                   # File-based routes (TanStack Router)
│       ├── __root.tsx            # App shell / root layout
│       ├── admin.tsx             # /admin route
│       └── _site/                # Customer-facing pages: home, menu, product,
│                                    cart, checkout, gifts, reviews, faqs, about,
│                                    contact, policies, track-order, and more
├── supabase/
│   ├── functions/                # Edge Functions (Cashfree, delivery fee,
│   │                                Google reviews, Instagram feed, Places autocomplete)
│   └── migrations/                # Database schema & seed SQL
├── .env.example                  # Environment variable template
├── components.json                # shadcn/ui config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

> Routing follows TanStack Start's file-based convention — see `src/routes/README.md` for details (e.g. `index.tsx` → `/`, `$id.tsx` → dynamic segment, `__root.tsx` → app shell). Don't hand-edit `routeTree.gen.ts`.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (or [Bun](https://bun.sh/), since `bunfig.toml` is included)
- A [Supabase](https://supabase.com/) project
- A [Cashfree](https://www.cashfree.com/) merchant account (for payments)
- A Google Cloud project with the **Places API** enabled (for address autocomplete)

### 1. Clone the repository
```bash
git clone https://github.com/neha28kudale/LittleBrownieCo.git
cd LittleBrownieCo
```

### 2. Install dependencies
```bash
npm install
# or
bun install
```

### 3. Configure environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```

```env
# Supabase (safe to expose client-side — anon key is public by design)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Legacy/local-only admin password fallback (unused once Supabase Auth is wired for admin login)
VITE_ADMIN_PASSWORD=change-me
```

The following are **server-side secrets** and must be set in your Supabase project (Edge Function secrets) — **not** in the `.env` file:
```bash
supabase secrets set CASHFREE_APP_ID=<your-cashfree-app-id>
supabase secrets set CASHFREE_SECRET_KEY=<your-cashfree-secret-key>
supabase secrets set CASHFREE_WEBHOOK_SECRET=<your-cashfree-webhook-secret>
supabase secrets set CASHFREE_ENV=sandbox   # sandbox | production

supabase secrets set GOOGLE_PLACES_API_KEY=<your-google-places-api-key>
supabase secrets set GOOGLE_PLACE_ID=<your-google-business-profile-place-id>
```

### 4. Set up the database
Run the migrations against your Supabase project (via the Supabase CLI or SQL editor), in order:
```
supabase/migrations/0001_init.sql
supabase/migrations/0002_products_extra.sql
supabase/migrations/0003_seed_products.sql
```

### 5. Deploy Supabase Edge Functions
```bash
supabase functions deploy create-cashfree-order
supabase functions deploy cashfree-webhook
supabase functions deploy calculate-delivery-fee
supabase functions deploy google-reviews
supabase functions deploy instagram-feed
supabase functions deploy places-autocomplete
```

### 6. Run the development server
```bash
npm run dev
```
The app will be available at `http://localhost:3000` (default Vite dev port may vary).

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the app for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## 🔐 Admin Access

The admin dashboard lives at `/admin` and is used to manage:
- Products & variants (including image uploads)
- Orders (with live status updates)
- Delivery fee slabs
- Customer reviews (approve/reject)

Admin login is handled through Supabase Auth (`src/lib/admin-auth.ts`), with `VITE_ADMIN_PASSWORD` retained only as a legacy local fallback.

---

## 🗄️ Database

Schema, extended product fields, and seed data live under `supabase/migrations/`. The app uses Supabase's Postgres database along with Realtime subscriptions (for live order and review updates in the admin panel) and Storage (for product images).

---

## 💳 Payments

Payments are processed through **Cashfree**:
1. `create-cashfree-order` (Edge Function) creates a payment order when a customer checks out.
2. `cashfree-webhook` (Edge Function) receives payment status updates from Cashfree and updates the order accordingly.

Set `CASHFREE_ENV=sandbox` while testing and switch to `production` when going live.

---

## 👩‍💻 Author

**Neha Kudale** — [@neha28kudale](https://github.com/neha28kudale)
