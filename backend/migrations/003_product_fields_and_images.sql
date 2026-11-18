-- Patch 003: product columns the catalog API already writes, plus image storage.
-- Depends on 001 and 002. Idempotent. Non-destructive (adds columns and a table only).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/003_product_fields_and_images.sql

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS description  text    NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured     boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer     boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mfg          varchar NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin       varchar NOT NULL DEFAULT 'India';
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry       varchar NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fssai_number varchar NOT NULL DEFAULT '';

-- Uploaded product photos. Stored in the database so no external file service is needed.
CREATE TABLE IF NOT EXISTS product_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_type varchar NOT NULL,
  data         bytea NOT NULL,
  CONSTRAINT product_images_type_valid CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

COMMIT;
