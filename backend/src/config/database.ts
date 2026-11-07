// ─────────────────────────────────────────────────────────────────────────────
// Prisma client singleton — shared across the application
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import { isDev } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}

let schemaEnsured = false;

/**
 * Idempotently ensures the `users.auth_id` column and unique index exist.
 * Protects deployments where the database was created prior to the Supabase Auth migration.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_id" TEXT;`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_id_key" ON "users"("auth_id");`,
    );
    await prisma.$executeRawUnsafe(
      `DO $$ BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
         ) THEN
           ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
         END IF;
       END $$;`,
    );
    schemaEnsured = true;
  } catch (err) {
    // Do not crash if the runtime DB user lacks DDL privileges
    console.warn('Database schema check warning:', err instanceof Error ? err.message : err);
  }
}

export default prisma;
