// ─────────────────────────────────────────────────────────────────────────────
// Public product routes: /api/v1/products
// Fixes: L3 (validate productQuerySchema) & L5 (Cache-Control headers)
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import * as productController from '../controllers/product.controller';
import { validate } from '../middleware/validate';
import { productQuerySchema } from '../validators/product.validator';

const router = Router();

function publicProductCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
}

// GET /api/v1/products?page=1&pageSize=20&search=...&category=...&brand=...
router.get('/', publicProductCache, validate(productQuerySchema, 'query'), productController.listProducts);

// GET /api/v1/products/:slug
router.get('/:slug', publicProductCache, productController.getProduct);

export default router;
