-- Sample data. Run after schema.sql. Safe to edit freely.

insert into colleges (name, city, lat, lng) values
  ('MNIT Jaipur', 'Jaipur', 26.8630, 75.8100),
  ('Manipal University Jaipur', 'Jaipur', 26.8431, 75.5660),
  ('IIT Delhi', 'Delhi', 28.5450, 77.1926),
  ('Delhi University (North Campus)', 'Delhi', 28.6889, 77.2100);

insert into pgs (name, category, gender, city, college_id, distance_km, address, description,
                 amenities, landmarks, rules, owner_phone, visit_fee_inr, lat, lng)
select v.name, v.category, v.gender, c.city, c.id, v.distance_km, v.address, v.description,
       v.amenities, v.landmarks::jsonb, v.rules, v.owner_phone, v.visit_fee_inr, v.lat, v.lng
from (values
  ('Cozy Stay PG', 'pg', 'boys', 'MNIT Jaipur', 0.8, '26, Jawahar Nagar, Near MNIT, Jaipur',
   'Quiet, student-friendly PG with home-style meals and fast Wi-Fi. A 10 minute walk to the MNIT main gate.',
   array['wifi','food','ac','cctv','power_backup','laundry','wardens','purified_water']::text[],
   '[{"name":"MNIT Jaipur","km":0.8},{"name":"Malviya Nagar Bus Stand","km":1.5}]',
   array['No loud music after 10 PM','Visitors allowed in the common area until 8 PM','One month notice before vacating']::text[],
   '+919999900001', 500, 26.8575, 75.8050),
  ('Sunrise Girls PG', 'pg', 'girls', 'MNIT Jaipur', 0.8, '14, Gandhi Path, Near MNIT, Jaipur',
   'Safe, well-lit PG for women with 24/7 wardens and CCTV in all common areas.',
   array['wifi','food','ac','cctv','wardens','purified_water','laundry']::text[],
   '[{"name":"MNIT Jaipur","km":0.8},{"name":"Gandhi Nagar Metro","km":2.0}]',
   array['Entry closes at 10 PM','No male visitors beyond the lobby']::text[],
   '+919999900002', 500, 26.8600, 75.8090),
  ('Scholars Den', 'hostel', 'boys', 'MNIT Jaipur', 1.2, '9, Sector 3, Malviya Nagar, Jaipur',
   'Budget hostel with a study hall, power backup and mess facility.',
   array['wifi','food','power_backup','cctv','purified_water']::text[],
   '[{"name":"MNIT Jaipur","km":1.2},{"name":"Malviya Nagar Bus Stand","km":0.9}]',
   array['Mess timings are fixed','No smoking on premises']::text[],
   '+919999900003', 300, 26.8540, 75.8010),
  ('Green Nest Hostel', 'hostel', 'girls', 'MNIT Jaipur', 1.6, '77, Pratap Nagar, Jaipur',
   'Calm hostel with a garden, laundry and a small gym.',
   array['wifi','food','laundry','gym','wardens','cctv']::text[],
   '[{"name":"MNIT Jaipur","km":1.6},{"name":"Sanganer Railway Station","km":3.4}]',
   array['Entry closes at 9:30 PM']::text[],
   '+919999900004', 400, 26.8510, 75.8180),
  ('Urban Nest PG', 'pg', 'unisex', 'MNIT Jaipur', 2.4, '5, Tonk Road, Jaipur',
   'Modern co-living with AC rooms and a rooftop lounge.',
   array['wifi','ac','food','gym','power_backup','cctv','laundry']::text[],
   '[{"name":"MNIT Jaipur","km":2.4},{"name":"Jaipur Junction","km":6.0}]',
   array['Quiet hours 11 PM to 6 AM']::text[],
   '+919999900005', 600, 26.8420, 75.8210),
  ('North Campus Boys PG', 'pg', 'boys', 'Delhi University (North Campus)', 0.6, '31, Kamla Nagar, Delhi',
   'Five minutes from the North Campus colleges, with 3 meals a day.',
   array['wifi','food','cctv','power_backup','purified_water']::text[],
   '[{"name":"Vishwavidyalaya Metro","km":0.9}]',
   array['No guests after 9 PM']::text[],
   '+919999900006', 500, 28.6835, 77.2060),
  ('Hauz Khas Girls PG', 'pg', 'girls', 'IIT Delhi', 1.1, '12, Hauz Khas Village, Delhi',
   'Secure women-only PG near IIT Delhi with 24/7 wardens.',
   array['wifi','ac','wardens','cctv','laundry','food','purified_water']::text[],
   '[{"name":"Hauz Khas Metro","km":1.2}]',
   array['Entry closes at 10 PM']::text[],
   '+919999900007', 700, 28.5495, 77.2010)
) as v(name, category, gender, college, distance_km, address, description, amenities, landmarks, rules, owner_phone, visit_fee_inr, lat, lng)
join colleges c on c.name = v.college;

insert into room_types (pg_id, label, occupancy, price)
select p.id, v.label, v.occupancy, v.price
from (values
  ('Cozy Stay PG', 'Single Occupancy', 'single', 12000),
  ('Cozy Stay PG', 'Double Sharing', 'double', 8500),
  ('Sunrise Girls PG', 'Single Occupancy', 'single', 12500),
  ('Sunrise Girls PG', 'Double Sharing', 'double', 8500),
  ('Scholars Den', 'Double Sharing', 'double', 6000),
  ('Scholars Den', 'Triple Sharing', 'triple', 4800),
  ('Green Nest Hostel', 'Double Sharing', 'double', 6500),
  ('Green Nest Hostel', 'Triple Sharing', 'triple', 5200),
  ('Urban Nest PG', 'Single Occupancy', 'single', 15000),
  ('Urban Nest PG', 'Double Sharing', 'double', 10000),
  ('North Campus Boys PG', 'Single Occupancy', 'single', 11000),
  ('North Campus Boys PG', 'Double Sharing', 'double', 8000),
  ('Hauz Khas Girls PG', 'Single Occupancy', 'single', 16000),
  ('Hauz Khas Girls PG', 'Double Sharing', 'double', 11000)
) as v(pg, label, occupancy, price)
join pgs p on p.name = v.pg;
