// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization middleware
// Authentication: Supabase Auth access tokens (verified through the Supabase SDK)
// Authorization : role-based access control (RBAC) via the local `users` table
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError';
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

    // ── Verify token with Supabase Auth ─────────────────────────────────────
    let authUserId: string;
    let authEmail: string;
    try {
      const { data, error } = await getSupabaseClient().auth.getUser(token);
      if (error || !data.user || !data.user.email) {
        throw AppError.unauthorized('Invalid or expired token');
      }
      authUserId = data.user.id;
      authEmail = data.user.email;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized('Invalid or expired token');
    }

    // ── Map Supabase user → local user (role, active flag) ─────────────────
    const user = await resolveOrLinkAdminUser(authUserId, authEmail);

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
