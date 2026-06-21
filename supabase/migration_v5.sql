-- VendorBeacon v5 migration — referral program + feedback board

-- Referral fields on vendors
alter table public.vendors
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.vendors(id) on delete set null,
  add column if not exists referral_reward_months integer not null default 0,
  add column if not exists referral_reward_applied_until timestamptz;

-- Backfill referral codes for existing vendors using their slug
update public.vendors
set referral_code = slug || '-' || substr(id::text, 1, 6)
where referral_code is null;

create index if not exists vendors_referral_code_idx on public.vendors(referral_code);
create index if not exists vendors_referred_by_idx on public.vendors(referred_by);

-- Feedback / suggestions table
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

-- Onboarding funnel analytics events use the existing analytics_events table
-- No new table needed — just new event_type values: 'onboarding_step_reached', 'onboarding_step_skipped', 'onboarding_completed'

-- Fix analytics_events to support onboarding funnel tracking
-- 1. Expand the check constraint to allow new event types
alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in (
    'profile_view', 'schedule_view', 'booking_request', 'venue_contact_reveal',
    'onboarding_step_reached', 'onboarding_step_skipped', 'onboarding_completed'
  ));

-- 2. Add missing INSERT policy — vendors can log their own analytics events
create policy "Vendors can insert own analytics events"
  on public.analytics_events for insert
  with check (vendor_id in (select id from public.vendors where user_id = auth.uid()));
