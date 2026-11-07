// ─────────────────────────────────────────────────────────────────────────────
// Product controller — public + admin endpoints
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import * as productService from '../services/product.service';
import * as importService from '../services/import.service';
import * as storageService from '../services/storage.service';
import { auditFromRequest } from '../services/audit.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

// Fields that must never be exposed on the public API
function stripPrivate<T extends { wholesalePrice?: unknown }>(p: T): Omit<T, 'wholesalePrice'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { wholesalePrice, ...rest } = p;
  return rest;
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  // Public callers can only ever see active products, regardless of ?active=
  const query = { ...req.query, active: 'true' } as never;
  const { products, pagination } = await productService.listProducts(query, 200);
  sendPaginated(res, products.map(stripPrivate), pagination);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess(res, stripPrivate(product));
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function adminListProducts(req: Request, res: Response): Promise<void> {
  // Admin sees all products by default, or filtered by active=true/false when requested
  const activeParam =
    req.query.active === 'true' || req.query.active === 'false' ? req.query.active : 'all';
  const query = { ...req.query, active: activeParam } as never;
  const { products, pagination } = await productService.listProducts(query, 500);
  sendPaginated(res, products, pagination);
}

export async function adminGetProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductById(req.params.id);
  sendSuccess(res, product);
}

export async function adminCreateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body);
  res.locals.entityId = product.id;
  sendCreated(res, product, 'Product created successfully');
}

export async function adminUpdateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.locals.entityId = product.id;
  sendSuccess(res, product, 'Product updated successfully');
}

export async function adminDeleteProduct(req: Request, res: Response): Promise<void> {
  await productService.deleteProduct(req.params.id);
  sendNoContent(res);
}

// ── IMAGES ────────────────────────────────────────────────────────────────────

export async function adminUploadProductImages(req: Request, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw AppError.badRequest('At least one image file is required');
  }

  const { productId } = req.params;

  const images = await Promise.all(
    files.map(async (file, index) => {
      // Upload buffer to Supabase Storage → get permanent public URL
      const { publicUrl } = await storageService.uploadFile('product-images', file, 'products');
      const altText = req.body[`altText_${index}`] as string | undefined;
      return productService.addProductImage(productId, publicUrl, altText, index);
    }),
  );

  await auditFromRequest(
    req,
    AuditAction.CREATE,
    'ProductImage',
    productId,
    `Uploaded ${images.length} image(s) for product ${productId}`,
  );
  sendCreated(res, images, 'Images uploaded successfully');
}

export async function adminDeleteProductImage(req: Request, res: Response): Promise<void> {
  // Fetch the image record first so we can delete the file from storage after DB delete succeeds
  const image = await productService.getProductImageById(req.params.imageId);
  await productService.deleteProductImage(req.params.imageId);

  if (image?.imageUrl) {
    const storagePath = storageService.storagePathFromUrl(image.imageUrl, 'product-images');
    await storageService.deleteFile('product-images', storagePath);
  }

  await auditFromRequest(
    req,
    AuditAction.DELETE,
    'ProductImage',
    req.params.imageId,
    `Deleted image ${req.params.imageId} from product ${req.params.productId}`,
  );
  sendNoContent(res);
}

// ── CSV/EXCEL IMPORT ──────────────────────────────────────────────────────────

export async function adminImportProducts(req: Request, res: Response): Promise<void> {
  const file = req.file as Express.Multer.File | undefined;
  if (!file || !file.buffer) {
    throw AppError.badRequest('An import file (CSV or Excel) is required');
  }

  const report = await importService.importProductsFromBuffer(file.buffer, file.mimetype);

  const statusCode = report.failed > 0 && report.successful === 0 ? 422 : 200;
  res.status(statusCode).json({
    success: report.failed === 0 || report.successful > 0,
    message: `Import complete: ${report.successful} succeeded, ${report.failed} failed`,
    data: report,
  });
}
