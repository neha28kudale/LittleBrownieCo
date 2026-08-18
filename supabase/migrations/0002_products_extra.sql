-- Little Brownie Co. — extend products for full storefront catalog data.
-- Run in Supabase SQL Editor after 0001_init.sql.

alter table products
  add column if not exists gallery text[] not null default '{}',
  add column if not exists flavours text[] not null default '{}',
  add column if not exists ingredients text[] not null default '{}',
  add column if not exists best_seller boolean not null default false,
  add column if not exists is_signature boolean not null default false;
