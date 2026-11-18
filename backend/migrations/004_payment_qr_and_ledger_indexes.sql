-- Patch 004: store payment QR image and per-customer ledger indexes.
-- Depends on 001-003. Idempotent. Non-destructive (adds a table and indexes only).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/004_payment_qr_and_ledger_indexes.sql

BEGIN;

-- Store-wide images, keyed by name. 'payment_qr' holds the UPI QR customers scan to pay.
CREATE TABLE IF NOT EXISTS store_images (
  key           varchar PRIMARY KEY,
  content_type  varchar NOT NULL,
  data          bytea NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT store_images_type_valid CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- Ledger lookups are always per customer, ordered by date.
CREATE INDEX IF NOT EXISTS idx_users_balance_details_user_date ON users_balance_details(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_paid_details_user_date ON user_paid_details(user_id, date);

COMMIT;
