-- Little Brownie Co. — initial schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run top-to-bottom on a fresh project; it will error harmlessly
-- on objects that already exist if you re-run it partway through.

-- ============================================================
-- 1. ADMIN USERS
-- ============================================================
-- Real admin auth = Supabase Auth (email/password) + this allowlist table.
-- Signing up for an account does NOT make someone an admin — only a row
-- in this table does. Add your own admin account manually after creating
-- it in Authentication → Users (see instructions at the bottom of this file).

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Only admins can see who else is an admin.
create policy "admins can view admin list"
  on admin_users for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- Helper used by every other policy below.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ============================================================
-- 2. PRODUCTS & VARIANTS
-- ============================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  category text not null,
  description text,
  image_url text,
  square_image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0
);

alter table products enable row level security;
alter table product_variants enable row level security;

create policy "public can view active products"
  on products for select
  using (is_active = true or is_admin());

create policy "admins can manage products"
  on products for all
  using (is_admin())
  with check (is_admin());

create policy "public can view active variants"
  on product_variants for select
  using (is_active = true or is_admin());

create policy "admins can manage variants"
  on product_variants for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- 3. DELIVERY SLABS (distance-tiered pricing, admin-editable)
-- ============================================================
create table if not exists delivery_slabs (
  id uuid primary key default gen_random_uuid(),
  min_km numeric(6, 2) not null,
  max_km numeric(6, 2), -- null = "and above"
  fee numeric(10, 2) not null check (fee >= 0),
  sort_order int not null default 0
);

alter table delivery_slabs enable row level security;

create policy "public can view delivery slabs"
  on delivery_slabs for select
  using (true);

create policy "admins can manage delivery slabs"
  on delivery_slabs for all
  using (is_admin())
  with check (is_admin());

insert into delivery_slabs (min_km, max_km, fee, sort_order) values
  (0, 5, 40, 1),
  (5, 10, 60, 2),
  (10, 15, 80, 3),
  (15, 20, 100, 4),
  (20, null, 120, 5)
on conflict do nothing;

-- ============================================================
-- 4. ORDERS
-- ============================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,             -- human-facing, e.g. LBC-2041
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  distance_km numeric(6, 2),
  delivery_fee numeric(10, 2) not null default 0,
  subtotal numeric(10, 2) not null,
  total numeric(10, 2) not null,
  delivery_date date not null,
  delivery_slot text not null,
  notes text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  order_status text not null default 'order_placed'
    check (order_status in ('order_placed', 'order_confirmed', 'rejected')),
  cashfree_order_id text,
  cashfree_payment_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  variant_label text not null,
  unit_price numeric(10, 2) not null,
  qty int not null check (qty > 0),
  line_total numeric(10, 2) not null
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone can create an order (checkout is public) — but only the
-- server-side Edge Function should ever write payment_status/order_status,
-- via the service-role key, which bypasses RLS entirely. This insert policy
-- is only for the initial "pending" order row created before payment.
create policy "public can create orders"
  on orders for insert
  with check (payment_status = 'pending' and order_status = 'order_placed');

create policy "admins can view all orders"
  on orders for select
  using (is_admin());

create policy "admins can update orders"
  on orders for update
  using (is_admin())
  with check (is_admin());

create policy "public can create order items for their order"
  on order_items for insert
  with check (true);

create policy "admins can view order items"
  on order_items for select
  using (is_admin());

-- ============================================================
-- 5. REVIEWS
-- ============================================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  location text,
  rating int not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "public can view approved reviews"
  on reviews for select
  using (status = 'approved' or is_admin());

create policy "public can submit reviews"
  on reviews for insert
  with check (status = 'pending');

create policy "admins can moderate reviews"
  on reviews for update
  using (is_admin())
  with check (is_admin());

create policy "admins can delete reviews"
  on reviews for delete
  using (is_admin());

-- ============================================================
-- Done. Next steps (do these in the Supabase dashboard, not SQL):
--
-- 1. Authentication → Providers → make sure "Email" is enabled.
-- 2. Authentication → Users → Add user → create your admin login
--    (email + password).
-- 3. Copy that user's UUID (click into the user), then run:
--      insert into admin_users (user_id) values ('paste-uuid-here');
--    That row is what makes them an admin — nothing else does.
-- ============================================================
