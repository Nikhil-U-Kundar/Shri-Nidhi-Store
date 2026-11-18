-- APPLY ALL PATCHES (001 + 002) IN ONE TRANSACTION
-- Run against the target database. If anything fails, the whole run rolls back.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/apply_all.sql
-- Or paste the whole file into the Neon SQL editor and run it.

BEGIN;

-- Pre-check: abort if any product already has negative stock (the new constraint would reject it).
DO $$
DECLARE bad integer;
BEGIN
  SELECT COUNT(*) INTO bad FROM products WHERE stock_quantity < 0;
  IF bad > 0 THEN
    RAISE EXCEPTION 'Pre-check failed: % product(s) have negative stock. Fix them, then re-run.', bad;
  END IF;
END $$;

-- ===== 001 =====

CREATE TABLE IF NOT EXISTS user_addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       varchar NOT NULL DEFAULT 'Home',
  text        text NOT NULL,
  landmark    text NOT NULL DEFAULT '',
  pincode     varchar NOT NULL DEFAULT '',
  is_default  boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_number        varchar NOT NULL UNIQUE,
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name       varchar NOT NULL,
  customer_phone      varchar NOT NULL,
  delivery_address    text NOT NULL,
  delivery_mode       varchar NOT NULL,
  payment_method      varchar NOT NULL,
  payment_status      varchar NOT NULL,
  status              varchar NOT NULL DEFAULT 'Order Placed',
  subtotal            numeric NOT NULL,
  delivery_fee        numeric NOT NULL DEFAULT 0,
  total               numeric NOT NULL,
  estimated_delivery  varchar NOT NULL DEFAULT 'Within 25-35 minutes',
  notes               text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  name        varchar NOT NULL,
  qty         integer NOT NULL CHECK (qty > 0),
  price       numeric NOT NULL,
  unit        varchar NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bill_number     varchar NOT NULL UNIQUE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name   varchar NOT NULL,
  customer_phone  varchar NOT NULL,
  customer_type   varchar NOT NULL,
  subtotal        numeric NOT NULL,
  discount        numeric NOT NULL DEFAULT 0,
  tax             numeric NOT NULL DEFAULT 0,
  total           numeric NOT NULL,
  payment_method  varchar NOT NULL,
  payment_status  varchar NOT NULL,
  cashier_name    varchar NOT NULL DEFAULT '',
  notes           text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at DESC);

CREATE TABLE IF NOT EXISTS bill_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bill_id     uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  name        varchar NOT NULL,
  unit        varchar NOT NULL DEFAULT '',
  price       numeric NOT NULL,
  qty         integer NOT NULL CHECK (qty > 0),
  total       numeric NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);

-- ===== 002 =====
-- Patch 002: pre-order scheduling, delivery slots, store settings, stock guard.
-- Depends on 001. Idempotent. Review, then run:
--   psql "$DATABASE_URL" -f migrations/002_preorder_scheduling.sql
-- Does not rewrite or delete any existing rows.


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


-- Post-check: both settings and slots must be present.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM store_settings) < 4 OR (SELECT COUNT(*) FROM delivery_slots) < 3 THEN
    RAISE EXCEPTION 'Post-check failed: seed rows missing';
  END IF;
END $$;

COMMIT;
