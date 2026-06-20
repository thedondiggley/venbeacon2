-- VendorBeacon v4 migration — venue listing verification & token security
-- Run this in Supabase SQL Editor

alter table public.venue_listings
  add column if not exists email_verified boolean not null default false,
  add column if not exists verification_token uuid default gen_random_uuid(),
  add column if not exists verification_sent_at timestamptz,
  add column if not exists edit_token_expires_at timestamptz;

-- Backfill existing listings as verified (they were already manually trusted)
-- and give existing edit tokens a 90-day expiration from now
update public.venue_listings
set email_verified = true,
    edit_token_expires_at = now() + interval '90 days'
where email_verified = false;

create index if not exists venue_listings_verification_token_idx on public.venue_listings(verification_token);

-- Add real disabled flag for admin vendor management
alter table public.vendors
  add column if not exists disabled boolean not null default false;
