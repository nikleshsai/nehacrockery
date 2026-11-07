-- =============================================================================
-- Migration: 20261107000000_security_and_indexes
-- Fixes:
-- - M7: Moves runtime `users.auth_id` DDL out of server startup into Prisma migrations
-- - L4: Adds composite indexes for public product filtering, enquiries, and sales
-- =============================================================================

-- Ensure `users.auth_id` column and unique index exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_id_key" ON "users"("auth_id");

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
  END IF;
END $$;

-- Composite indexes for high-concurrency product listing & filtering (L4)
CREATE INDEX IF NOT EXISTS "products_is_active_category_id_idx" ON "products"("is_active", "category_id");
CREATE INDEX IF NOT EXISTS "products_is_active_brand_id_idx" ON "products"("is_active", "brand_id");
CREATE INDEX IF NOT EXISTS "products_is_active_is_featured_idx" ON "products"("is_active", "is_featured");
CREATE INDEX IF NOT EXISTS "products_is_active_is_new_arrival_idx" ON "products"("is_active", "is_new_arrival");
CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx" ON "products"("is_active", "created_at");

-- Composite indexes for admin enquiries & sales dashboards (L4)
CREATE INDEX IF NOT EXISTS "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");
CREATE INDEX IF NOT EXISTS "sales_status_created_at_idx" ON "sales"("status", "created_at");

