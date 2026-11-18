-- ============================================================================
-- Sri Nidhi Store: database table structure.
-- Every table with its complete set of columns, keys, constraints and indexes.
-- Creates only what is missing, so it is safe to re-run.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/table/table.sql
-- or paste the whole file into the Neon SQL editor.
--
-- Note: an existing table is not changed by this file. New columns on a table
-- that already exists must be added there with ALTER TABLE.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email       varchar NOT NULL,
  password    varchar NOT NULL,
  name        varchar NOT NULL,
  phone       varchar,
  role        varchar NOT NULL
);

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

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name        varchar NOT NULL,
  slug        varchar NOT NULL,
  sort_order  integer NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category_id         uuid REFERENCES categories(id) ON DELETE SET NULL,
  name                varchar NOT NULL,
  brand               varchar NOT NULL,
  image_url           text NOT NULL,
  pack_label          varchar NOT NULL,
  weight_value        numeric,
  weight_unit         varchar,
  selling_price       numeric NOT NULL,
  mrp                 numeric,
  wholesale_cost      numeric NOT NULL,
  stock_quantity      integer NOT NULL,
  low_stock_threshold integer NOT NULL,
  is_visible          boolean NOT NULL,
  badge_text          varchar NOT NULL,
  description         text NOT NULL DEFAULT '',
  featured            boolean NOT NULL DEFAULT false,
  is_offer            boolean NOT NULL DEFAULT false,
  mfg                 varchar NOT NULL DEFAULT '',
  origin              varchar NOT NULL DEFAULT 'India',
  expiry              varchar NOT NULL DEFAULT '',
  fssai_number        varchar NOT NULL DEFAULT '',
  CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0)
);

-- Uploaded product photos (served by the API at /api/product-images/:id).
CREATE TABLE IF NOT EXISTS product_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_type varchar NOT NULL,
  data         bytea NOT NULL,
  CONSTRAINT product_images_type_valid CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS stock_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_amount  integer NOT NULL,
  reason         varchar NOT NULL,
  note           text NOT NULL,
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    integer NOT NULL
);

-- ---------------------------------------------------------------------------
-- Khata (customer credit ledger)
-- ---------------------------------------------------------------------------

-- Credits: what the customer took on khata (items, amount, date).
CREATE TABLE IF NOT EXISTS users_balance_details (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grocery_item  varchar NOT NULL,
  amount        numeric NOT NULL,
  date          timestamptz NOT NULL,
  note          text,
  payment_mode  varchar
);
CREATE INDEX IF NOT EXISTS idx_users_balance_details_user_date ON users_balance_details(user_id, date);

-- Payments received from the customer (items they cover, amount, date).
CREATE TABLE IF NOT EXISTS user_paid_details (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        numeric NOT NULL,
  date          timestamptz NOT NULL,
  note          text,
  payment_mode  varchar,
  items         text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_user_paid_details_user_date ON user_paid_details(user_id, date);

-- Store-wide images, keyed by name (the payment QR uses key 'payment_qr').
CREATE TABLE IF NOT EXISTS store_images (
  key           varchar PRIMARY KEY,
  content_type  varchar NOT NULL,
  data          bytea NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT store_images_type_valid CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- ---------------------------------------------------------------------------
-- Orders and pre-order scheduling
-- ---------------------------------------------------------------------------

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
  notes               text NOT NULL DEFAULT '',
  delivery_date       date,
  delivery_slot       varchar,
  is_preorder         boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);

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

-- Delivery windows offered at checkout (store-local time, IST).
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

-- Key/value store settings (advance booking hours, same-day switch, fees).
CREATE TABLE IF NOT EXISTS store_settings (
  key         varchar PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Counter bills
-- ---------------------------------------------------------------------------

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

COMMIT;
