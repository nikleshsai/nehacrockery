// ─────────────────────────────────────────────────────────────────────────────
// Test setup — environment + Supabase mock (runs before every test file)
// Real Supabase is never called from tests: tokens of the form
//   "test-token:<email>"  are accepted as that user, anything else is rejected.
// ─────────────────────────────────────────────────────────────────────────────
import * as dotenv from 'dotenv';
import { vi } from 'vitest';

// Load test-specific environment or fall back to .env
dotenv.config({ path: '.env.test', override: false });
dotenv.config({ path: '.env', override: false });

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/neha_crockery_test?schema=public';
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
process.env.PORT = '4001';

vi.mock('../src/config/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) => {
        const unverifiedMatch = /^unverified-token:(.+)$/.exec(token ?? '');
        if (unverifiedMatch) {
          const email = unverifiedMatch[1];
          return {
            data: {
              user: {
                id: `auth-unverified-${email}`,
                email,
                email_confirmed_at: null,
              },
            },
            error: null,
          };
        }

        const match = /^test-token:(.+)$/.exec(token ?? '');
        if (!match) {
          return { data: { user: null }, error: { message: 'invalid JWT' } };
        }
        const email = match[1];
        return {
          data: {
            user: {
              id: `auth-${email}`,
              email,
              email_confirmed_at: '2026-01-01T00:00:00.000Z',
            },
          },
          error: null,
        };
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        remove: async () => ({ error: null }),
        getPublicUrl: (p: string) => ({ data: { publicUrl: `http://localhost/${p}` } }),
      }),
    },
  }),
}));
