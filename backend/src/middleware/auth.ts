// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization middleware
// Supports: own JWT (HS256) + Supabase JWT (ES256, verified via Supabase SDK)
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import prisma from '../config/database';
import { getSupabaseClient } from '../config/supabase';

interface JwtPayload {
  userId?: string;      // Own JWT
  sub?: string;         // Supabase JWT (user UUID)
  email?: string;
  role?: UserRole;
  iss?: string;         // Supabase JWT issuer
}

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

/**
 * Returns true if the token looks like a Supabase JWT.
 * Supabase tokens have "iss" containing "supabase" in their payload.
 * We check this WITHOUT verifying the signature (safe — we verify via SDK next).
 */
function looksLikeSupabaseToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded) return false;
    // Supabase tokens have iss like "https://<ref>.supabase.co/auth/v1"
    return !!(decoded.sub && decoded.iss && decoded.iss.includes('supabase'));
  } catch {
    return false;
  }
}

/**
 * Verifies the JWT from the Authorization header or cookie.
 * Accepts both our own HS256 JWT and Supabase ES256 JWT tokens.
 * Attaches decoded user to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      (req.cookies as Record<string, string>)?.['nch_token'] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      throw AppError.unauthorized('Authentication token is required');
    }

    let userEmail: string | undefined;
    let userId: string | undefined;

    // ── Check if this is a Supabase token ──────────────────────────────────
    if (looksLikeSupabaseToken(token)) {
      // Verify via Supabase SDK (handles ES256 automatically)
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          throw AppError.unauthorized('Invalid or expired Supabase token');
        }
        userEmail = data.user.email;
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.unauthorized('Invalid or expired token');
      }
    } else {
      // ── Fall back to our own HS256 JWT ────────────────────────────────────
      try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        userId = payload.userId;
        userEmail = payload.email;
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          throw AppError.unauthorized('Invalid or expired token');
        }
        throw err;
      }
    }

    // ── Look up user in DB ──────────────────────────────────────────────────
    let user: { id: string; email: string; role: UserRole; name: string; isActive: boolean } | null = null;

    if (userEmail) {
      user = await prisma.user.findFirst({
        where: { email: { equals: userEmail, mode: 'insensitive' } },
        select: { id: true, email: true, role: true, name: true, isActive: true },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, name: true, isActive: true },
      });
    }

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is not active or not found');
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid or expired token'));
    } else {
      next(err);
    }
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
