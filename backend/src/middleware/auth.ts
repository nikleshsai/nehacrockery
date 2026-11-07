// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization middleware
// Authentication: Supabase Auth access tokens (verified through the Supabase SDK
//                 or local HMAC-SHA256 JWT secret when configured, with short-lived
//                 in-memory verification caching to avoid network round-trips on
//                 every admin request — L6).
// Authorization : role-based access control (RBAC) via the local `users` table
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { getSupabaseClient } from '../config/supabase';
import { resolveOrLinkAdminUser } from '../services/auth.service';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

interface VerifiedTokenClaims {
  authUserId: string;
  authEmail: string;
  emailVerified: boolean;
  expiresAtMs: number;
}

const TOKEN_CACHE_TTL_MS = 60_000; // 60 seconds max cache TTL (L6)
const MAX_CACHE_ENTRIES = 500;
const verifiedTokenCache = new Map<string, VerifiedTokenClaims>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Evicts a token from the short-lived verification cache on logout (L6).
 */
export function evictCachedToken(token?: string): void {
  if (!token) return;
  verifiedTokenCache.delete(hashToken(token));
}

export function clearVerifiedTokenCache(): void {
  verifiedTokenCache.clear();
}

/**
 * Optional local HMAC-SHA256 JWT verification when SUPABASE_JWT_SECRET is set (L6).
 */
function verifySupabaseJwtLocally(token: string, secret: string): VerifiedTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  try {
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') return null;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest();
    const actualSig = Buffer.from(signatureB64, 'base64url');
    if (
      expectedSig.length !== actualSig.length ||
      !crypto.timingSafeEqual(expectedSig, actualSig)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp <= nowSec) {
      return null;
    }
    if (!payload.sub || !payload.email) {
      return null;
    }

    const emailVerified = Boolean(
      payload.email_verified === true ||
        payload.user_metadata?.email_verified === true ||
        payload.amr?.length,
    );
    const jwtExpMs =
      typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now() + TOKEN_CACHE_TTL_MS;

    return {
      authUserId: String(payload.sub),
      authEmail: String(payload.email),
      emailVerified,
      expiresAtMs: Math.min(jwtExpMs, Date.now() + TOKEN_CACHE_TTL_MS),
    };
  } catch {
    return null;
  }
}

/**
 * Verifies the Supabase access token from the Authorization header
 * (`Authorization: Bearer <access_token>`) and attaches the matching
 * local user (with role) to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

    if (!token) {
      throw AppError.unauthorized('Authentication token is required');
    }

    const cacheKey = hashToken(token);
    const now = Date.now();
    let claims = verifiedTokenCache.get(cacheKey);
    if (claims && claims.expiresAtMs <= now) {
      verifiedTokenCache.delete(cacheKey);
      claims = undefined;
    }

    if (!claims && config.supabase.jwtSecret) {
      claims = verifySupabaseJwtLocally(token, config.supabase.jwtSecret) ?? undefined;
    }

    // ── Verify token with Supabase Auth if not in short-lived cache ─────────
    if (!claims) {
      try {
        const { data, error } = await getSupabaseClient().auth.getUser(token);
        if (error || !data.user || !data.user.email) {
          throw AppError.unauthorized('Invalid or expired token');
        }

        // H1: Require verified email before allowing admin authentication
        const emailVerified = Boolean(
          data.user.email_confirmed_at ||
            (data.user.user_metadata && data.user.user_metadata.email_verified === true),
        );
        if (!emailVerified) {
          throw AppError.unauthorized('Email address has not been verified');
        }

        claims = {
          authUserId: data.user.id,
          authEmail: data.user.email,
          emailVerified,
          expiresAtMs: now + TOKEN_CACHE_TTL_MS,
        };

        if (verifiedTokenCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = verifiedTokenCache.keys().next().value;
          if (oldestKey) verifiedTokenCache.delete(oldestKey);
        }
        verifiedTokenCache.set(cacheKey, claims);
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.unauthorized('Invalid or expired token');
      }
    }

    if (!claims.emailVerified) {
      throw AppError.unauthorized('Email address has not been verified');
    }

    // ── Map Supabase user → local user (role, active flag) ─────────────────
    const user = await resolveOrLinkAdminUser(
      claims.authUserId,
      claims.authEmail,
      claims.emailVerified,
    );

    // A valid Supabase account without a local admin record has no access.
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is not active or not found');
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restricts access to specified roles.
 * Must be used AFTER authenticate.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
