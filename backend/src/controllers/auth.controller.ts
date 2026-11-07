// ─────────────────────────────────────────────────────────────────────────────
// Authentication controller — thin, delegates to auth service.
// Sign-in/out of the Supabase session happens in the admin client (supabase-js);
// these endpoints expose the app profile and write audit-log entries.
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { auditFromRequest } from '../services/audit.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuditAction } from '@prisma/client';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    req.user = result.user;
    await auditFromRequest(
      req,
      AuditAction.LOGIN,
      'User',
      result.user.id,
      `Admin login: ${result.user.email}`,
    );
    sendSuccess(res, result, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

export function authConfig(_req: Request, res: Response): void {
  sendSuccess(res, authService.getPublicAuthConfig());
}

export async function logout(req: Request, res: Response): Promise<void> {
  await auditFromRequest(req, AuditAction.LOGOUT, 'User', req.user?.id, `Admin logout: ${req.user?.email}`);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, user);
}
