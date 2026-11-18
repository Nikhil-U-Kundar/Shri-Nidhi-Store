-- Reconciles the live schema with what src/routes/* already reads and writes.
-- The live database currently lacks these five tables, so order and bill
-- creation and saved addresses fail there. Written idempotently; NOT yet applied.
-- Apply only after review:  psql "$DATABASE_URL" -f migrations/001_reconcile_missing_tables.sql

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
