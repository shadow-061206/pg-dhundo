# PGdekho: full-stack PG & hostel finder

Next.js 15 (frontend + API routes) · Supabase (Postgres + auth) · PhonePe (visit booking fee) · Vercel (hosting)

## Features

| Feature | Where |
|---|---|
| Home with city / college / gender search | `app/page.tsx`, `components/SearchForm.tsx` |
| Listings with filters, sorting, map | `app/pgs/page.tsx`, `components/Filters.tsx` |
| Detail page | `app/pgs/[id]/page.tsx` |
| Login / sign up / Google | `app/login/*`, `app/auth/callback/route.ts` |
| Book a visit + PhonePe payment | `components/BookingPanel.tsx`, `lib/phonepe.ts`, `app/api/phonepe/*`, `app/payment/status/page.tsx` |
| My bookings | `app/bookings/page.tsx` |
| REST API | `app/api/pgs`, `app/api/pgs/[id]`, `app/api/reviews` |
| Database | `supabase/schema.sql`, `supabase/seed.sql`, `supabase/add-data.sql` |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Adding cities, colleges and PGs

There is no separate "city" table: a city appears in the home-page dropdown as soon as a college exists in it.

**Option A: SQL (fastest for many rows).** Open `supabase/add-data.sql`, edit the values and run each block in
Supabase -> SQL Editor, in order: college, then PG, then room types.

**Option B: Table Editor (no SQL).** Supabase -> Table Editor:
1. `colleges` -> Insert row: name, city, lat, lng.
2. `pgs` -> Insert row: fill every field. `college_id` = the college's id, `city` = same city spelling as the college.
   `amenities` and `rules` are arrays, `landmarks` is JSON like `[{"name":"Bus Stand","km":1.5}]`.
3. `room_types` -> Insert rows with `pg_id` = the PG's id, `label`, `occupancy` (single/double/triple), `price` (rupees/month).

**Photos:** Supabase -> Storage -> New bucket `pg-images` (tick Public) -> upload photos -> copy each public URL
into the PG's `images` array (first image is the cover).

## PhonePe setup

1. Create a PhonePe Payment Gateway merchant account at business.phonepe.com and complete onboarding.
2. In the dashboard open **Developer Settings** and copy the **Client ID** and **Client Secret** (the Client Version is
   normally `1`). Put them in `.env.local` / Vercel as `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`,
   `PHONEPE_CLIENT_VERSION`. Keep `PHONEPE_ENV=sandbox` while testing.
3. **Database:** if you already ran the old (PayPal) `schema.sql`, run `supabase/migrations/001_phonepe.sql` once.
   Fresh installs just use the new `schema.sql`.
4. Test a booking. You are redirected to PhonePe's hosted checkout, then back to `/payment/status`, which asks PhonePe
   for the real status and shows paid/failed. Paid bookings appear on `/bookings`.
5. **Webhook (recommended backup for buyers who close the tab):** in the dashboard create a webhook with
   URL `https://YOUR-APP.vercel.app/api/phonepe/webhook`, authentication type **SHA**, a username and password
   (use the same values for `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`), and events
   `checkout.order.completed` and `checkout.order.failed`. In sandbox, PhonePe's integration team sets the webhook up for you.
6. **Go live:** set `PHONEPE_ENV=live` with your production credentials, redeploy, and make one small real payment.

How payment stays safe: the browser never sends a price (the fee comes from the database), and a booking only becomes
`paid` after the server asks PhonePe's Order Status API and the amount matches. The webhook body is never trusted on its own.

## Deploy

1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.example` in Vercel -> Settings -> Environment Variables, then redeploy.
3. Supabase -> Authentication -> URL Configuration: Site URL = your Vercel URL, add `https://YOUR-APP.vercel.app/**` as a redirect URL.

## Admin panel

Open `/admin` on your site (an **Admin** link also appears in the navbar for admins).

| Page | What you can do |
|---|---|
| Dashboard | Users, PGs, colleges, payments received, pending/failed payments, residents |
| PGs & hostels | Add, edit, hide/show, delete; photos, rooms and prices, amenities, rules, landmarks |
| Colleges | Add/delete colleges and cities |
| Bookings & payments | Every booking: person, phone, PG, room, visit date, amount, status, PhonePe order/txn id; mark "moved in" |
| Users | All users with bookings, amount paid and the PG they are staying in; click a user for full history |

**Set up (once):**
1. Sign up on your website with the email you want as admin.
2. Supabase -> SQL Editor -> run `supabase/migrations/002_admin.sql`.
3. In the same editor run (with your email):
   `insert into admins (user_id) select id from auth.users where email = 'you@example.com';`
4. Log out and in again, then open `/admin`.

Add more admins by running step 3 with another email. Admin pages use the server-side service key and check the `admins` table on every page and action.
