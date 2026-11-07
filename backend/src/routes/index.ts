// ─────────────────────────────────────────────────────────────────────────────
// Public API routes index: /api/v1
// Fixes: H2, M1, L5 (Zod validation, dedicated write rate limiters, Cache-Control)
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import productRoutes from './product.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import * as categoryController from '../controllers/category.controller';
import * as enquiryController from '../controllers/enquiry.controller';
import * as siteController from '../controllers/site.controller';
import * as salesController from '../controllers/sales.controller';
import { validate } from '../middleware/validate';
import { createEnquirySchema, createCatalogueRequestSchema } from '../validators/enquiry.validator';
import {
  initiateOrderSchema,
  completeOrderSchema,
  billLookupQuerySchema,
} from '../validators/sales.validator';

const router = Router();

function clientIpKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

const publicWriteLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.publicWriteMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIpKey,
  message: {
    success: false,
    message: 'Too many submissions from this IP. Please try again after a few minutes.',
  },
});

const billLookupLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIpKey,
  message: {
    success: false,
    message: 'Too many bill lookup attempts. Please wait before trying again.',
  },
});

function cachePublicGet(maxAgeSeconds = 60) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`,
    );
    next();
  };
}

// ── Health check ───────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Products ──────────────────────────────────────────────────────────────────
router.use('/products', productRoutes);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories', cachePublicGet(120), categoryController.listCategories);
router.get('/categories/:slug', cachePublicGet(120), categoryController.getCategory);

// ── Brands ────────────────────────────────────────────────────────────────────
router.get('/brands', cachePublicGet(120), categoryController.listBrands);
router.get('/brands/:slug', cachePublicGet(120), categoryController.getBrand);

// ── Banners ───────────────────────────────────────────────────────────────────
router.get('/banners', cachePublicGet(120), siteController.listBanners);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/reviews', cachePublicGet(120), siteController.listReviews);

// ── Site settings ─────────────────────────────────────────────────────────────
router.get('/site-settings', cachePublicGet(60), siteController.getSiteSettings);

// ── Catalogues (public — list active) ─────────────────────────────────────────
router.get('/catalogues', cachePublicGet(120), siteController.listCatalogues);

// ── Shop Gallery (public — list active) ───────────────────────────────────────
router.get('/shop-media', cachePublicGet(120), siteController.listShopMedia);

// ── Enquiries (public POST) ───────────────────────────────────────────────────
router.post(
  '/enquiries',
  publicWriteLimiter,
  validate(createEnquirySchema),
  enquiryController.createEnquiry,
);

// ── Online Orders & Unique Bill Generation (Store Pickup Only) ───────────────
router.get('/orders/payment-config', cachePublicGet(30), salesController.getPaymentConfig);
router.post(
  '/orders/initiate',
  publicWriteLimiter,
  validate(initiateOrderSchema),
  salesController.initiateOnlineOrder,
);
router.post(
  '/orders/complete',
  publicWriteLimiter,
  validate(completeOrderSchema),
  salesController.completeOnlineOrder,
);
router.get(
  '/orders/bill/:billNumber',
  billLookupLimiter,
  validate(billLookupQuerySchema, 'query'),
  salesController.getBillByNumber,
);

// ── Catalogue requests (public POST) ─────────────────────────────────────────
router.post(
  '/catalogue-requests',
  publicWriteLimiter,
  validate(createCatalogueRequestSchema),
  enquiryController.createCatalogueRequest,
);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.use('/admin', adminRoutes);

export default router;
