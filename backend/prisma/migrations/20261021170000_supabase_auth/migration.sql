-- Move authentication to Supabase Auth.
-- Credentials now live in auth.users; this table keeps role/profile data and
-- links to the Supabase user via auth_id (set automatically on first login by email).

-- AlterTable
ALTER TABLE "users" ADD COLUMN "auth_id" TEXT;
ALTER TABLE "users" DROP COLUMN "password_hash";

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");
