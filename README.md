# VendorBeacon

A scheduling and booking tool for mobile food vendors. Operators publish their
weekly "where we'll be" schedule to one shareable link, and venues/event
organizers can request bookings directly.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- Supabase (Postgres + Auth)
- Resend (optional - booking notification emails)
- Deploy target: Vercel

## Setup

### 1. Create a Supabase project

Go to supabase.com, create a new project (free tier is plenty to start).

### 2. Run the database schema

In the Supabase dashboard, go to **SQL Editor** and run the contents of
`supabase/schema.sql`. This creates the `vendors`, `locations`, and `bookings`
tables along with row-level security policies.

### 3. Get your API keys

In **Project Settings -> API**, copy:
- Project URL
- `anon` public key
- `service_role` key (keep this secret - server-side only)

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. (Optional) Set up booking notification emails

Sign up at resend.com, verify a sending domain, and add:

```
RESEND_API_KEY=your-resend-key
BOOKING_NOTIFICATION_FROM_EMAIL=VendorBeacon <notifications@yourdomain.com>
```

If you skip this, booking requests still save to the database and show up in
the dashboard - vendors just won't get an email alert.

### 6. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in Vercel.
3. Add the same environment variables from `.env.local` in the Vercel project
   settings (Settings -> Environment Variables).
4. Deploy.

### Supabase auth redirect URL

In your Supabase project, go to **Authentication -> URL Configuration** and
add your Vercel deployment URL (e.g. https://your-app.vercel.app) to the
allowed redirect URLs / site URL.

## How it works

- **Sign up** (`/signup`) creates a Supabase auth user and a `vendors` row with
  a unique slug (auto-generated from the business name).
- **Dashboard** (`/dashboard`) is where vendors manage their schedule
  (`locations` table), view booking requests (`bookings` table), and edit
  settings.
- **Public page** (`/t/[slug]`) is the shareable schedule page. It shows
  today's location prominently, upcoming stops, and a booking request form.
  This page is server-rendered using the Supabase service role client (no
  login required to view).
- **Booking requests** submitted on the public page go through
  `/api/bookings`, which validates input, saves to the `bookings` table, and
  optionally emails the vendor via Resend. Approving a booking in the
  dashboard automatically adds it to the vendor's schedule.

## Free trial / subscription billing

Not yet wired up. To add Stripe billing later:

1. Add a `subscription_status` and `trial_ends_at` column to `vendors`.
2. On signup, set `trial_ends_at` to 14 days out.
3. Use Stripe Checkout with `trial_period_days` for the subscription itself,
   or gate dashboard access based on `trial_ends_at` / subscription status.
4. Add a Stripe webhook route to keep `subscription_status` in sync.

## Custom domains (future)

The schema and routing are slug-based (`/t/vendor-slug`) so custom domains can
be added later without restructuring - e.g. by adding a `custom_domain` column
to `vendors` and a proxy rule that maps incoming custom domains to the right
slug.
