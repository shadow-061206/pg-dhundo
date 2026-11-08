-- PGdekho schema. Run this whole file once in Supabase -> SQL Editor.

create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  lat double precision,
  lng double precision
);

create table pgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'pg' check (category in ('pg', 'hostel')),
  gender text not null check (gender in ('boys', 'girls', 'unisex')),
  city text not null,
  college_id uuid references colleges(id) on delete set null,
  distance_km numeric(4,1) not null default 1,
  address text not null,
  description text,
  amenities text[] not null default '{}',   -- wifi, food, ac, cctv, power_backup, laundry, wardens, purified_water, gym
  landmarks jsonb not null default '[]',    -- [{"name": "...", "km": 1.5}]
  images text[] not null default '{}',      -- public image URLs (Supabase Storage works well)
  rules text[] not null default '{}',
  owner_phone text,
  visit_fee_inr integer not null default 500 check (visit_fee_inr > 0),
  lat double precision,
  lng double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index pgs_city_idx on pgs (city);
create index pgs_college_idx on pgs (college_id);

create table room_types (
  id uuid primary key default gen_random_uuid(),
  pg_id uuid not null references pgs(id) on delete cascade,
  label text not null,
  occupancy text not null check (occupancy in ('single', 'double', 'triple')),
  price integer not null check (price > 0)   -- INR per month
);
create index room_types_pg_idx on room_types (pg_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  pg_id uuid not null references pgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (pg_id, user_id)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pg_id uuid not null references pgs(id) on delete cascade,
  room_type_id uuid references room_types(id) on delete set null,
  visit_date date not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount_inr integer not null,
  gateway_order_id text unique,   -- PhonePe orderId
  gateway_txn_id text,            -- PhonePe transactionId
  created_at timestamptz not null default now()
);
create index bookings_user_idx on bookings (user_id);

-- ---------- Row Level Security ----------
alter table colleges   enable row level security;
alter table pgs        enable row level security;
alter table room_types enable row level security;
alter table reviews    enable row level security;
alter table bookings   enable row level security;

-- Public catalogue: anyone can read
create policy "read colleges"   on colleges   for select using (true);
create policy "read pgs"        on pgs         for select using (is_active);
create policy "read room types" on room_types  for select using (true);
create policy "read reviews"    on reviews     for select using (true);

-- Reviews: logged-in users manage only their own
create policy "insert own review" on reviews for insert to authenticated
  with check (auth.uid() = user_id);
create policy "update own review" on reviews for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bookings: users see their own and can only create 'pending' ones.
-- Marking a booking 'paid' is done by the server (service role) after PhonePe confirms.
create policy "read own bookings" on bookings for select to authenticated
  using (auth.uid() = user_id);
create policy "create pending booking" on bookings for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');
