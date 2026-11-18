-- Patch 002: pre-order scheduling, delivery slots, store settings, stock guard.
-- Depends on 001. Idempotent. Review, then run:
--   psql "$DATABASE_URL" -f migrations/002_preorder_scheduling.sql
-- Does not rewrite or delete any existing rows.

BEGIN;

-- 1. Scheduling columns on orders (nullable so existing rows stay valid).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_preorder boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);

-- 2. Configurable delivery windows (times are store-local, IST).
CREATE TABLE IF NOT EXISTS delivery_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label       varchar NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  CONSTRAINT delivery_slots_window_valid CHECK (end_time > start_time),
  CONSTRAINT delivery_slots_unique_window UNIQUE (start_time, end_time)
);

INSERT INTO delivery_slots (label, start_time, end_time, sort_order) VALUES
  ('Morning (8:00 AM – 11:00 AM)',   '08:00', '11:00', 1),
  ('Afternoon (12:00 PM – 3:00 PM)', '12:00', '15:00', 2),
  ('Evening (6:00 PM – 8:30 PM)',    '18:00', '20:30', 3)
ON CONFLICT (start_time, end_time) DO NOTHING;

-- 3. Key/value store settings (advance booking hours, same-day switch, fees).
CREATE TABLE IF NOT EXISTS store_settings (
  key         varchar PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO store_settings (key, value) VALUES
  ('advance_booking_hours',    '24'::jsonb),
  ('same_day_delivery',        'false'::jsonb),
  ('delivery_fee',             '40'::jsonb),
  ('free_delivery_threshold',  '499'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Stock guard: stock can never go negative. NOT VALID means existing rows
--    are not scanned, so this cannot fail on legacy data. Run VALIDATE later
--    once you have checked: ALTER TABLE products VALIDATE CONSTRAINT products_stock_non_negative;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_non_negative;
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0) NOT VALID;

COMMIT;
