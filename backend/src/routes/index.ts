// ─────────────────────────────────────────────────────────────────────────────
// Public API routes index: /api/v1
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import productRoutes from './product.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import * as categoryController from '../controllers/category.controller';
import * as enquiryController from '../controllers/enquiry.controller';
import * as siteController from '../controllers/site.controller';
import * as salesController from '../controllers/sales.controller';
import { validate } from '../middleware/validate';
import { createEnquirySchema, createCatalogueRequestSchema } from '../validators/enquiry.validator';

const router = Router();

// ── Health check ───────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Products ──────────────────────────────────────────────────────────────────
router.use('/products', productRoutes);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories', categoryController.listCategories);
router.get('/categories/:slug', categoryController.getCategory);

// ── Brands ────────────────────────────────────────────────────────────────────
router.get('/brands', categoryController.listBrands);
router.get('/brands/:slug', categoryController.getBrand);

// ── Banners ───────────────────────────────────────────────────────────────────
router.get('/banners', siteController.listBanners);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/reviews', siteController.listReviews);

// ── Site settings ─────────────────────────────────────────────────────────────
router.get('/site-settings', siteController.getSiteSettings);

// ── Catalogues (public — list active) ─────────────────────────────────────────
router.get('/catalogues', siteController.listCatalogues);

// ── Shop Gallery (public — list active) ───────────────────────────────────────
router.get('/shop-media', siteController.listShopMedia);

// ── Enquiries (public POST) ───────────────────────────────────────────────────
router.post('/enquiries', validate(createEnquirySchema), enquiryController.createEnquiry);

// ── Online Orders & Unique Bill Generation (Store Pickup Only) ───────────────
router.get('/orders/payment-config', salesController.getPaymentConfig);
router.post('/orders/initiate', salesController.initiateOnlineOrder);
router.post('/orders/complete', salesController.completeOnlineOrder);
router.get('/orders/bill/:billNumber', salesController.getBillByNumber);

// ── Catalogue requests (public POST) ─────────────────────────────────────────
router.post(
  '/catalogue-requests',
  validate(createCatalogueRequestSchema),
  enquiryController.createCatalogueRequest,
);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.use('/admin', adminRoutes);

export default router;
