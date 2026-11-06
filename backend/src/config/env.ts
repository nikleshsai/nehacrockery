// ─────────────────────────────────────────────────────────────────────────────
// Environment configuration — validated at startup
// ─────────────────────────────────────────────────────────────────────────────
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),

  database: {
    url: requireEnv('DATABASE_URL'),
    // DIRECT_URL is used by Prisma migrations only (bypasses PgBouncer pooler).
    // It does not need to be validated at runtime — Prisma reads it directly.
    directUrl: process.env.DIRECT_URL,
  },

  // Supabase powers Auth (token verification) and Storage.
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    anonKey: process.env.SUPABASE_ANON_KEY,
    // NEVER expose service role key to the frontend
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },

  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  },

  upload: {
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '10', 10),
    strategy: (process.env.STORAGE_STRATEGY ?? 'local') as 'local' | 'cloudinary' | 's3',
  },
} as const;

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
