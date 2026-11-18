-- Patch 005: record which items a payment covers, alongside its amount and date.
-- Depends on 001-004. Idempotent. Non-destructive (adds one column with a default).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/005_payment_items.sql

BEGIN;

ALTER TABLE user_paid_details ADD COLUMN IF NOT EXISTS items text NOT NULL DEFAULT '';

COMMIT;
