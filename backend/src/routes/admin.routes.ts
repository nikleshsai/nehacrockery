// =============================================================================
// Admin routes: /api/v1/admin
// All routes protected by authentication + role authorization
// Includes: Products, Categories, Brands, Enquiries, Banners, Reviews,
//           Catalogues, Settings, Sales, Dashboard, Audit Logs
// Fixes: M3, M4, M6, B5, L3, L7
// =============================================================================
import { Router } from 'express';
import { UserRole, AuditAction } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  uploadImages,
  uploadCatalogue,
  uploadImport,
  uploadShopMedia,
  validateUploadedFileSignatures,
} from '../middleware/upload';
import * as productController from '../controllers/product.controller';
import * as categoryController from '../controllers/category.controller';
import * as enquiryController from '../controllers/enquiry.controller';
import * as siteController from '../controllers/site.controller';
import * as salesController from '../controllers/sales.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import { auditFromRequest } from '../services/audit.service';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator';
import {
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
} from '../validators/catalogue.validator';
import { updateEnquiryStatusSchema } from '../validators/enquiry.validator';
import {
  createAdminSaleSchema,
  updateAdminSaleSchema,
} from '../validators/sales.validator';
import {
  createBannerSchema,
  updateBannerSchema,
  createReviewSchema,
  updateReviewSchema,
  createCatalogueSchema,
  updateCatalogueSchema,
  createShopMediaSchema,
  updateShopMediaSchema,
  updateSettingsSchema,
} from '../validators/site.validator';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get(
  '/dashboard',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
  dashboardController.adminGetDashboard,
);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get(
  '/audit-logs',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  dashboardController.adminListAuditLogs,
);

// ── Product management ────────────────────────────────────────────────────────
router
  .route('/products')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    validate(productQuerySchema, 'query'),
    productController.adminListProducts,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createProductSchema),
    async (req, res, next) => {
      try {
        await productController.adminCreateProduct(req, res);
        await auditFromRequest(
          req,
          AuditAction.CREATE,
          'Product',
          res.locals.entityId,
          `Created product: ${req.body?.name}`,
        );
      } catch (e) {
        next(e);
      }
    },
  );

// CSV/Excel import — must come before /:id routes
router.post(
  '/products/import',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadImport.single('file'),
  validateUploadedFileSignatures,
  async (req, res, next) => {
    try {
      await productController.adminImportProducts(req, res);
      await auditFromRequest(
        req,
        AuditAction.IMPORT,
        'Product',
        undefined,
        `Imported products from file: ${req.file?.originalname}`,
      );
    } catch (e) {
      next(e);
    }
  },
);

router
  .route('/products/:id')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    productController.adminGetProduct,
  )
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateProductSchema),
    async (req, res, next) => {
      try {
        const hadPriceChange =
          req.body?.mrp !== undefined ||
          req.body?.catalogueMrp !== undefined ||
          req.body?.wholesalePrice !== undefined ||
          req.body?.websitePrice !== undefined;
        await productController.adminUpdateProduct(req, res);
        const action = hadPriceChange ? AuditAction.PRICE_CHANGE : AuditAction.UPDATE;
        await auditFromRequest(
          req,
          action,
          'Product',
          req.params.id,
          `Updated product${hadPriceChange ? ' (price change)' : ''}`,
        );
      } catch (e) {
        next(e);
      }
    },
  )
  .delete(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    async (req, res, next) => {
      try {
        // M6: Only write audit log after the deletion succeeds
        await productController.adminDeleteProduct(req, res);
        await auditFromRequest(req, AuditAction.DELETE, 'Product', req.params.id, 'Deleted product');
      } catch (e) {
        next(e);
      }
    },
  );

// Product images (L7: max 5 files, M4: verify file signatures)
router.post(
  '/products/:productId/images',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadImages.array('images', 5),
  validateUploadedFileSignatures,
  productController.adminUploadProductImages,
);

router.delete(
  '/products/:productId/images/:imageId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  productController.adminDeleteProductImage,
);

// ── Category management ───────────────────────────────────────────────────────
router
  .route('/categories')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    categoryController.adminListCategories,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createCategorySchema),
    async (req, res, next) => {
      try {
        await categoryController.adminCreateCategory(req, res);
        await auditFromRequest(
          req,
          AuditAction.CREATE,
          'Category',
          res.locals.entityId,
          `Created category: ${req.body?.name}`,
        );
      } catch (e) {
        next(e);
      }
    },
  );

router
  .route('/categories/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateCategorySchema),
    async (req, res, next) => {
      try {
        await categoryController.adminUpdateCategory(req, res);
        await auditFromRequest(
          req,
          AuditAction.UPDATE,
          'Category',
          req.params.id,
          'Updated category',
        );
      } catch (e) {
        next(e);
      }
    },
  )
  .delete(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    async (req, res, next) => {
      try {
        await categoryController.adminDeleteCategory(req, res);
        await auditFromRequest(
          req,
          AuditAction.DELETE,
          'Category',
          req.params.id,
          'Deleted category',
        );
      } catch (e) {
        next(e);
      }
    },
  );

// ── Brand management ──────────────────────────────────────────────────────────
router
  .route('/brands')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    categoryController.adminListBrands,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createBrandSchema),
    async (req, res, next) => {
      try {
        await categoryController.adminCreateBrand(req, res);
        await auditFromRequest(
          req,
          AuditAction.CREATE,
          'Brand',
          res.locals.entityId,
          `Created brand: ${req.body?.name}`,
        );
      } catch (e) {
        next(e);
      }
    },
  );

router
  .route('/brands/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateBrandSchema),
    async (req, res, next) => {
      try {
        await categoryController.adminUpdateBrand(req, res);
        await auditFromRequest(req, AuditAction.UPDATE, 'Brand', req.params.id, 'Updated brand');
      } catch (e) {
        next(e);
      }
    },
  )
  .delete(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    async (req, res, next) => {
      try {
        await categoryController.adminDeleteBrand(req, res);
        await auditFromRequest(req, AuditAction.DELETE, 'Brand', req.params.id, 'Deleted brand');
      } catch (e) {
        next(e);
      }
    },
  );

// ── Enquiry management ────────────────────────────────────────────────────────
router
  .route('/enquiries')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    enquiryController.adminListEnquiries,
  );

router
  .route('/enquiries/:id')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    enquiryController.adminGetEnquiry,
  )
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateEnquiryStatusSchema),
    async (req, res, next) => {
      try {
        await enquiryController.adminUpdateEnquiryStatus(req, res);
        await auditFromRequest(
          req,
          AuditAction.STATUS_CHANGE,
          'Enquiry',
          req.params.id,
          `Status changed to ${req.body?.status}`,
        );
      } catch (e) {
        next(e);
      }
    },
  );

// ── Banner management (M3: Zod schema validation, M6: audit in controller) ───
router
  .route('/banners')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    siteController.adminListBanners,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createBannerSchema),
    siteController.adminCreateBanner,
  );

router
  .route('/banners/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateBannerSchema),
    siteController.adminUpdateBanner,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteBanner);

// ── Review management (M3: Zod schema validation, M6: audit in controller) ───
router
  .route('/reviews')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    siteController.adminListReviews,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createReviewSchema),
    siteController.adminCreateReview,
  );

router
  .route('/reviews/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateReviewSchema),
    siteController.adminUpdateReview,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteReview);

// ── Catalogue management (M3, M4, M6) ────────────────────────────────────────
router
  .route('/catalogues')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    siteController.adminListCatalogues,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    uploadCatalogue.single('file'),
    validateUploadedFileSignatures,
    validate(createCatalogueSchema),
    siteController.adminCreateCatalogue,
  );

router
  .route('/catalogues/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateCatalogueSchema),
    siteController.adminUpdateCatalogue,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteCatalogue);

// ── Site settings (M3, M6) ───────────────────────────────────────────────────
router
  .route('/settings')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    siteController.getSiteSettings,
  )
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateSettingsSchema),
    siteController.adminUpdateSettings,
  );

// ── Sales management (B5: Zod validation on POST & PUT) ───────────────────────
router
  .route('/sales')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    salesController.adminListSales,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(createAdminSaleSchema),
    salesController.adminCreateSale,
  );

router.get(
  '/sales/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
  salesController.adminGetSaleStats,
);

router
  .route('/sales/:id')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    salesController.adminGetSale,
  )
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateAdminSaleSchema),
    salesController.adminUpdateSale,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), salesController.adminDeleteSale);

// ── Shop Gallery management (M3, M4, M6, L7) ─────────────────────────────────
router
  .route('/shop-media')
  .get(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF),
    siteController.adminListShopMedia,
  )
  .post(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    uploadShopMedia.single('file'),
    validateUploadedFileSignatures,
    validate(createShopMediaSchema),
    siteController.adminCreateShopMedia,
  );

router
  .route('/shop-media/:id')
  .put(
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validate(updateShopMediaSchema),
    siteController.adminUpdateShopMedia,
  )
  .delete(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), siteController.adminDeleteShopMedia);

export default router;

