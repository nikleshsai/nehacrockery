// ─────────────────────────────────────────────────────────────────────────────
// Express application setup — all middleware and routing
// ─────────────────────────────────────────────────────────────────────────────
import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { logger } from './utils/logger';
import { AppError } from './utils/AppError';
import apiRoutes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ── Trust proxy (Render / Cloudflare / Vercel reverse proxies) ───────────────
// Required so req.ip and express-rate-limit resolve per-client IPs instead of
// sharing one bucket across all users behind the load balancer (C3 / L1).
app.set('trust proxy', config.trustProxy);

/**
 * Normalizes client IP from Express req.ip / X-Forwarded-For for rate limiting.
 */
export function resolveClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// ── Security headers (M9) ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy:
      config.nodeEnv === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
              frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              connectSrc: ["'self'", 'https:'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
  }),
);

// Explicit Permissions-Policy header (not included in Helmet by default)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")',
  );
  next();
});

// ── CORS (M8: return 403 AppError instead of generic 500 Error) ──────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      // Browsers send "null" as the origin for file:// pages — allow it in dev
      if (origin === 'null' && config.nodeEnv !== 'production') return callback(null, true);
      if (config.cors.origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        AppError.forbidden(`CORS: origin ${origin} not allowed`, 'CORS_NOT_ALLOWED'),
      );
    },
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Global rate limiter (C3 / L1 / L8) ───────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: resolveClientIp,
    message: { success: false, message: 'Too many requests. Please slow down.' },
  }),
);

// ── Body parsing (H5: bounded global JSON limit) ─────────────────────────────
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));
app.use(compression());

// ── HTTP request logging ─────────────────────────────────────────────────────
app.use(
  morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  }),
);

// ── Legacy static file serving (pre-Supabase-Storage uploads, if any remain) ──
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
  }),
);

// The React frontend + /admin panel are deployed separately (Vercel) and talk
// to this API over HTTPS; this server only exposes the REST API.

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

export default app;
