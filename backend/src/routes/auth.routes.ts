// ─────────────────────────────────────────────────────────────────────────────
// Auth routes: /api/v1/auth
// Fixes: H4, B8 (Dedicated login rate limiter using AUTH_RATE_LIMIT_MAX)
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

function loginRateLimitKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' && forwarded.trim()
      ? (forwarded.split(',')[0]?.trim() || req.ip || 'unknown')
      : req.ip || req.socket?.remoteAddress || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ip}:${email}`;
}

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginRateLimitKey,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
});

router.get('/config', authController.authConfig);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
