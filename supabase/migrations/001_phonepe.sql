-- Run ONCE in the Supabase SQL Editor if you already ran the original schema.sql (PayPal version).
-- (Fresh installs using the new schema.sql do not need this.)
alter table bookings rename column paypal_order_id to gateway_order_id;
alter table bookings rename column paypal_capture_id to gateway_txn_id;
alter table bookings drop column if exists amount_charged;
alter table bookings drop column if exists currency;
