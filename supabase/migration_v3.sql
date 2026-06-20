-- VendorBeacon v3 migration
-- Run this in Supabase SQL Editor

-- Vendor profile additions
alter table public.vendors
  add column if not exists owner_name text,
  add column if not exists food_type text,
  add column if not exists service_areas text,
  add column if not exists website_url text,
  add column if not exists power_needs text,
  add column if not exists water_needs boolean not null default false,
  add column if not exists insurance_info text;

-- Venue listings additions
alter table public.venue_listings
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists zip_code text,
  add column if not exists expected_traffic text,
  add column if not exists parking_details text,
  add column if not exists has_electrical boolean not null default false,
  add column if not exists has_water boolean not null default false,
  add column if not exists has_restrooms boolean not null default false,
  add column if not exists vendor_fee text,
  add column if not exists requires_permit boolean not null default false,
  add column if not exists requires_insurance boolean not null default false,
  add column if not exists is_published boolean not null default true,
  add column if not exists photo_urls text[] default array[]::text[];

-- Admin logs table
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Reports table (for flagging bad listings)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('venue_listing', 'vendor', 'booking')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_vendor_id_idx on public.notifications(vendor_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);

-- RLS for new tables
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "Vendors can view own notifications"
  on public.notifications for all
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
