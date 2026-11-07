// ─────────────────────────────────────────────────────────────────────────────
// Category + Brand controller
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

// ── CATEGORIES (Public) ───────────────────────────────────────────────────────

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories();
  sendSuccess(res, categories);
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, category);
}

// ── CATEGORIES (Admin) ────────────────────────────────────────────────────────

export async function adminListCategories(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories(true);
  sendSuccess(res, categories);
}

export async function adminCreateCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.createCategory(req.body);
  res.locals.entityId = category.id;
  sendCreated(res, category, 'Category created successfully');
}

export async function adminUpdateCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.locals.entityId = category.id;
  sendSuccess(res, category, 'Category updated successfully');
}

export async function adminDeleteCategory(req: Request, res: Response): Promise<void> {
  await categoryService.deleteCategory(req.params.id);
  sendNoContent(res);
}

// ── BRANDS (Public) ───────────────────────────────────────────────────────────

export async function listBrands(_req: Request, res: Response): Promise<void> {
  const brands = await categoryService.listBrands();
  sendSuccess(res, brands);
}

export async function getBrand(req: Request, res: Response): Promise<void> {
  const brand = await categoryService.getBrandBySlug(req.params.slug);
  sendSuccess(res, brand);
}

// ── BRANDS (Admin) ────────────────────────────────────────────────────────────

export async function adminListBrands(_req: Request, res: Response): Promise<void> {
  const brands = await categoryService.listBrands(true);
  sendSuccess(res, brands);
}

export async function adminCreateBrand(req: Request, res: Response): Promise<void> {
  const brand = await categoryService.createBrand(req.body);
  res.locals.entityId = brand.id;
  sendCreated(res, brand, 'Brand created successfully');
}

export async function adminUpdateBrand(req: Request, res: Response): Promise<void> {
  const brand = await categoryService.updateBrand(req.params.id, req.body);
  res.locals.entityId = brand.id;
  sendSuccess(res, brand, 'Brand updated successfully');
}

export async function adminDeleteBrand(req: Request, res: Response): Promise<void> {
  await categoryService.deleteBrand(req.params.id);
  sendNoContent(res);
}
