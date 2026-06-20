-- Run this in Supabase SQL Editor to add venue v2 columns to existing table
alter table public.venue_listings
  add column if not exists slug text unique,
  add column if not exists max_trucks integer not null default 1,
  add column if not exists edit_token uuid default gen_random_uuid() unique;

create index if not exists venue_listings_slug_idx on public.venue_listings(slug);
create index if not exists venue_listings_edit_token_idx on public.venue_listings(edit_token);

-- Backfill slugs for any existing listings
update public.venue_listings
set slug = lower(regexp_replace(venue_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
where slug is null;
