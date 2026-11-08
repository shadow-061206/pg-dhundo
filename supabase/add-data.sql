-- Templates for adding your own data. Copy a block, edit the values, run it in Supabase -> SQL Editor.
-- Tip: get lat/lng from Google Maps (right-click the place, click the coordinates to copy).

-- 1) ADD A COLLEGE (this also adds its city to the city dropdown on the home page)
insert into colleges (name, city, lat, lng)
values ('Your College Name', 'Your City', 26.8630, 75.8100);

-- 2) ADD A PG / HOSTEL near that college (the college name must match exactly)
--    category: 'pg' or 'hostel'      gender: 'boys', 'girls' or 'unisex'
--    amenities allowed: wifi, food, ac, cctv, power_backup, laundry, wardens, purified_water, gym
insert into pgs (name, category, gender, city, college_id, distance_km, address, description,
                 amenities, landmarks, rules, owner_phone, visit_fee_inr, lat, lng, images)
select 'Your PG Name', 'pg', 'boys', c.city, c.id, 0.8,
       '12, Street name, Area, City',
       'Short description of the PG.',
       array['wifi','food','ac','cctv']::text[],
       '[{"name":"Your College Name","km":0.8},{"name":"Bus Stand","km":1.5}]'::jsonb,
       array['No loud music after 10 PM','Visitors allowed until 8 PM']::text[],
       '+919876543210',
       500,                 -- visit booking fee in rupees
       26.8575, 75.8050,
       array['https://YOUR-PROJECT.supabase.co/storage/v1/object/public/pg-images/photo1.jpg']::text[]
from colleges c
where c.name = 'Your College Name';

-- 3) ADD ROOM TYPES + PRICES (per month, in rupees) to that PG (the PG name must be unique)
insert into room_types (pg_id, label, occupancy, price)
select p.id, v.label, v.occupancy, v.price
from pgs p,
     (values ('Single Occupancy', 'single', 12000),
             ('Double Sharing',   'double',  8500)) as v(label, occupancy, price)
where p.name = 'Your PG Name';
