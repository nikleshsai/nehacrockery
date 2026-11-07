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

// Always reuse the singleton across hot reloads, tests, and production modules
globalForPrisma.prisma = prisma;

export default prisma;
