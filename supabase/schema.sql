-- VendorBeacon complete schema
-- Run this fresh in Supabase SQL editor

-- ============================================================
-- VENDORS
-- ============================================================
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  description text,
  contact_email text,
  contact_phone text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  logo_url text,
  -- subscription cache (source of truth is subscriptions table)
  -- kept here for fast reads without joins on every request
  is_pro boolean not null default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors
  add constraint slug_format check (slug ~ '^[a-z0-9-]+$');

create index vendors_user_id_idx on public.vendors(user_id);
create index vendors_slug_idx on public.vendors(slug);
create index vendors_stripe_customer_idx on public.vendors(stripe_customer_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  plan text not null check (plan in ('pro_monthly', 'pro_annual')),
  status text not null check (status in (
    'active', 'trialing', 'past_due', 'canceled',
    'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  )),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_vendor_id_idx on public.subscriptions(vendor_id);
create index subscriptions_stripe_sub_idx on public.subscriptions(stripe_subscription_id);
create index subscriptions_status_idx on public.subscriptions(status);

-- ============================================================
-- LOCATIONS
-- ============================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  address text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'booking')),
  booking_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_vendor_id_idx on public.locations(vendor_id);
create index locations_start_time_idx on public.locations(start_time);

-- ============================================================
-- BOOKINGS (Pro only)
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  venue_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  venue_address text not null,
  event_type text not null check (event_type in (
    'brewery', 'apartment', 'office', 'festival', 'school', 'private', 'other'
  )),
  expected_attendance text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_vendor_id_idx on public.bookings(vendor_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_event_date_idx on public.bookings(event_date);

alter table public.locations
  add constraint locations_booking_id_fkey
  foreign key (booking_id) references public.bookings(id) on delete set null;

-- ============================================================
-- VENUE LISTINGS
-- ============================================================
create table public.venue_listings (
  id uuid primary key default gen_random_uuid(),
  venue_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  address text not null,
  city text not null,
  days_available text not null,
  hours_available text not null,
  venue_type text not null check (venue_type in (
    'brewery', 'apartment', 'office', 'shopping', 'park', 'event_space', 'other'
  )),
  description text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index venue_listings_city_idx on public.venue_listings(city);
create index venue_listings_type_idx on public.venue_listings(venue_type);

-- ============================================================
-- SAVED VENUES (Pro only)
-- ============================================================
create table public.saved_venues (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  venue_listing_id uuid not null references public.venue_listings(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique(vendor_id, venue_listing_id)
);

create index saved_venues_vendor_id_idx on public.saved_venues(vendor_id);

-- ============================================================
-- ANALYTICS EVENTS (Pro only)
-- ============================================================
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  event_type text not null check (event_type in (
    'profile_view', 'schedule_view', 'booking_request', 'venue_contact_reveal'
  )),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_vendor_id_idx on public.analytics_events(vendor_id);
create index analytics_events_type_idx on public.analytics_events(event_type);
create index analytics_events_created_idx on public.analytics_events(created_at);

-- ============================================================
-- FEATURE FLAGS (future features)
-- ============================================================
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_name text not null unique,
  is_enabled boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

-- seed future feature flags
insert into public.feature_flags (flag_name, is_enabled, description) values
  ('customer_followers', false, 'Let customers follow a truck and get notified'),
  ('sms_notifications', false, 'SMS alerts for booking requests and schedule updates'),
  ('email_notifications', false, 'Email digest for vendor analytics'),
  ('social_posting_automation', false, 'Auto-post schedule to Instagram/Facebook/TikTok'),
  ('featured_vendor_placement', false, 'Promoted vendor placement in search results'),
  ('advanced_analytics', false, 'Detailed analytics with trends and comparisons');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.vendors enable row level security;
alter table public.subscriptions enable row level security;
alter table public.locations enable row level security;
alter table public.bookings enable row level security;
alter table public.venue_listings enable row level security;
alter table public.saved_venues enable row level security;
alter table public.analytics_events enable row level security;
alter table public.feature_flags enable row level security;

-- vendors
create policy "Vendors can view own record"
  on public.vendors for select using (auth.uid() = user_id);
create policy "Vendors can update own record"
  on public.vendors for update using (auth.uid() = user_id);
create policy "Vendors can insert own record"
  on public.vendors for insert with check (auth.uid() = user_id);

-- subscriptions
create policy "Vendors can view own subscription"
  on public.subscriptions for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- locations
create policy "Vendors can view own locations"
  on public.locations for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "Vendors can insert own locations"
  on public.locations for insert
  with check (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "Vendors can update own locations"
  on public.locations for update
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "Vendors can delete own locations"
  on public.locations for delete
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- bookings
create policy "Vendors can view own bookings"
  on public.bookings for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
create policy "Vendors can update own bookings"
  on public.bookings for update
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- saved venues
create policy "Vendors can manage own saved venues"
  on public.saved_venues for all
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- analytics
create policy "Vendors can view own analytics"
  on public.analytics_events for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));

-- feature flags - read only for all authenticated users
create policy "Anyone authenticated can read feature flags"
  on public.feature_flags for select using (auth.role() = 'authenticated');

-- ============================================================
-- HELPER FUNCTION: check if vendor is pro
-- Used at DB layer to enforce access
-- ============================================================
create or replace function public.vendor_is_pro(p_vendor_id uuid)
returns boolean as $$
  select coalesce(
    (select is_pro from public.vendors where id = p_vendor_id),
    false
  );
$$ language sql security definer stable;

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ============================================================
-- VENUE LISTINGS v2 ADDITIONS
-- Run this in Supabase SQL Editor if you already ran the original schema
-- ============================================================
alter table public.venue_listings
  add column if not exists slug text unique,
  add column if not exists max_trucks integer not null default 1,
  add column if not exists edit_token uuid default gen_random_uuid() unique;

create index if not exists venue_listings_slug_idx on public.venue_listings(slug);
create index if not exists venue_listings_edit_token_idx on public.venue_listings(edit_token);

-- Vendor profile v2 additions
alter table public.vendors
  add column if not exists owner_name text,
  add column if not exists food_type text,
  add column if not exists service_areas text,
  add column if not exists website_url text,
  add column if not exists power_needs text,
  add column if not exists water_needs boolean not null default false,
  add column if not exists insurance_info text;

-- Venue listings v3 additions
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

-- Venue listings v4 additions — verification & token security
alter table public.venue_listings
  add column if not exists email_verified boolean not null default false,
  add column if not exists verification_token uuid default gen_random_uuid(),
  add column if not exists verification_sent_at timestamptz,
  add column if not exists edit_token_expires_at timestamptz;

create index if not exists venue_listings_verification_token_idx on public.venue_listings(verification_token);

-- Vendor disable flag (admin moderation)
alter table public.vendors
  add column if not exists disabled boolean not null default false;

-- Referral program (v5)
alter table public.vendors
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.vendors(id) on delete set null,
  add column if not exists referral_reward_months integer not null default 0,
  add column if not exists referral_reward_applied_until timestamptz;

create index if not exists vendors_referral_code_idx on public.vendors(referral_code);
create index if not exists vendors_referred_by_idx on public.vendors(referred_by);

-- Feedback / suggestions (v5)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  vendor_name text,
  vendor_email text,
  category text not null default 'general' check (category in ('bug', 'feature_request', 'general')),
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'done', 'wont_fix')),
  created_at timestamptz not null default now()
);

create index if not exists feedback_status_idx on public.feedback(status);
create index if not exists feedback_vendor_id_idx on public.feedback(vendor_id);

alter table public.feedback enable row level security;

create policy "Vendors can submit feedback"
  on public.feedback for insert
  with check (true);

create policy "Vendors can view own feedback"
  on public.feedback for select
  using (vendor_id in (select id from public.vendors where user_id = auth.uid()));
