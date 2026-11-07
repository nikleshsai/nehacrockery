// ─────────────────────────────────────────────────────────────────────────────
// Authentication service — profile lookup & server-side Supabase Auth sign-in.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';
import prisma, { ensureDatabaseSchema } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import type { LoginInput } from '../validators/auth.validator';

export interface ResolvedAdminUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
}

const baseUserSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  isActive: true,
} as const;

/**
 * Resolves a verified Supabase Auth user (`authUserId`, `authEmail`) to a local
 * admin user record, linking `auth_id` on first login and recovering gracefully
 * if the `users.auth_id` column has not yet been migrated.
 */
export async function resolveOrLinkAdminUser(
  authUserId: string,
  authEmail: string,
): Promise<ResolvedAdminUser | null> {
  let user: ResolvedAdminUser | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { authId: authUserId },
      select: baseUserSelect,
    });
  } catch (err) {
    // If `users.auth_id` column does not exist yet, attempt to add it and fall back to email lookup
    await ensureDatabaseSchema();
  }

  if (!user) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: authEmail, mode: 'insensitive' } },
      select: baseUserSelect,
    });

    if (byEmail) {
      try {
        await prisma.user.update({
          where: { id: byEmail.id },
          data: { authId: authUserId, lastLogin: new Date() },
        });
      } catch {
        try {
          await prisma.user.update({
            where: { id: byEmail.id },
            data: { lastLogin: new Date() },
          });
        } catch {
          // Ignore non-fatal timestamp update failure
        }
      }
      user = byEmail;
    }
  }

  return user;
}

export async function login(input: LoginInput) {
  const authKey = config.supabase.anonKey || config.supabase.serviceRoleKey;
  const authClient = createClient(config.supabase.url, authKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await authClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.session?.access_token || !data.user?.email) {
    throw AppError.unauthorized(error?.message || 'Invalid email or password');
  }

  const user = await resolveOrLinkAdminUser(data.user.id, data.user.email);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Account is not active or not found');
  }

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export function getPublicAuthConfig() {
  return {
    supabaseUrl: config.supabase.url,
    supabaseAnonKey: config.supabase.anonKey ?? null,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true },
  });

  if (!user) {
    throw AppError.notFound('User');
  }

  return user;
}
