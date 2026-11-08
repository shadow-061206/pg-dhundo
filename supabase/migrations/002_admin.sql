-- Run ONCE in Supabase -> SQL Editor. Adds the admin panel features.

-- 1) Who is an admin
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;
create policy "admin reads own row" on admins for select to authenticated
  using (auth.uid() = user_id);
-- (No insert/update policies: admins can only be added here in the SQL Editor.)

-- 2) Track who actually moved into a PG
alter table bookings add column if not exists moved_in boolean not null default false;

-- 3) Photo storage: public bucket, only admins can upload or delete
insert into storage.buckets (id, name, public)
values ('pg-images', 'pg-images', true)
on conflict (id) do nothing;

create policy "admins upload pg images" on storage.objects for insert to authenticated
  with check (bucket_id = 'pg-images' and exists (select 1 from public.admins a where a.user_id = auth.uid()));
create policy "admins delete pg images" on storage.objects for delete to authenticated
  using (bucket_id = 'pg-images' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 4) MAKE YOURSELF AN ADMIN: put the email you signed up with, then run this line.
--    (Sign up on the website first so the account exists.)
-- insert into admins (user_id) select id from auth.users where email = 'you@example.com';
