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
import apiRoutes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
    // Relax CSP for dev so admin panel inline styles/scripts work
    contentSecurityPolicy: config.nodeEnv === 'production',
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);
      // Browsers send "null" as the origin for file:// pages — allow it in dev
      if (origin === 'null' && config.nodeEnv !== 'production') return callback(null, true);
      if (config.cors.origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' },
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── HTTP request logging ─────────────────────────────────────────────────────
app.use(
  morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  }),
);

// ── Legacy static file serving (pre-Supabase-Storage uploads, if any remain) ──
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// The React frontend + /admin panel are deployed separately (Vercel) and talk
// to this API over HTTPS; this server only exposes the REST API.

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

export default app;
