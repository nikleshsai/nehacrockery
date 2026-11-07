// ─────────────────────────────────────────────────────────────────────────────
// Authentication service — profile lookup & server-side Supabase Auth sign-in.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
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
 * admin user record.
 *
 * Security hardening:
 * - H1: Only links an unlinked admin record by email when `emailVerified === true`.
 * - M5: Uses an atomic conditional `updateMany({ where: { id, authId: null } })`
 *       to prevent concurrent email-linking race conditions.
 * - M7: Does not run DDL at request time; schema changes live in Prisma migrations.
 */
export async function resolveOrLinkAdminUser(
  authUserId: string,
  authEmail: string,
  emailVerified = false,
): Promise<ResolvedAdminUser | null> {
  const existingLinked = await prisma.user.findUnique({
    where: { authId: authUserId },
    select: baseUserSelect,
  });

  if (existingLinked) {
    return existingLinked;
  }

  // H1: Never link an unlinked admin account unless the Supabase email is verified
  if (!emailVerified) {
    return null;
  }

  const byEmail = await prisma.user.findFirst({
    where: {
      email: { equals: authEmail, mode: 'insensitive' },
      authId: null,
    },
    select: baseUserSelect,
  });

  if (!byEmail) {
    return null;
  }

  // M5: Atomic conditional link — only succeeds if authId is still null
  try {
    const linked = await prisma.user.updateMany({
      where: { id: byEmail.id, authId: null },
      data: { authId: authUserId, lastLogin: new Date() },
    });

    if (linked.count === 1) {
      return byEmail;
    }

    // Another concurrent request linked this record; check if it was linked to this same authUserId
    return await prisma.user.findUnique({
      where: { authId: authUserId },
      select: baseUserSelect,
    });
  } catch {
    return await prisma.user.findUnique({
      where: { authId: authUserId },
      select: baseUserSelect,
    });
  }
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

  // H4: Always return a generic error message to prevent account enumeration
  if (error || !data.session?.access_token || !data.user?.email) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // H1: Require verified email before linking or granting admin access
  const emailVerified = Boolean(
    data.user.email_confirmed_at ||
      (data.user.user_metadata && data.user.user_metadata.email_verified === true),
  );
  if (!emailVerified) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const user = await resolveOrLinkAdminUser(data.user.id, data.user.email, emailVerified);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid email or password');
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
