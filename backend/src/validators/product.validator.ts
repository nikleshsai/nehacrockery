// =============================================================================
// Zod validators for product endpoints
// Updated: includes new catalogue fields
// =============================================================================
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  productCode: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  brandId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  // Physical
  material: z.string().max(255).optional().nullable(),
  capacity: z.string().max(100).optional().nullable(),
  dimensions: z.string().max(255).optional().nullable(),
  colourFinish: z.string().max(255).optional().nullable(),
  setContents: z.string().optional().nullable(),
  piecesPerSet: z.number().int().positive().optional().nullable(),
  caseQty: z.number().int().positive().optional().nullable(),
  packagingInformation: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  // Classification
  collection: z.string().max(255).optional().nullable(),
  subcategory: z.string().max(255).optional().nullable(),
  // Pricing
  mrp: z.number().positive().optional().nullable(),
  catalogueMrp: z.number().positive().optional().nullable(),
  wholesalePrice: z.number().positive().optional().nullable(),
  websitePrice: z.number().positive().optional().nullable(),
  priceUnit: z.string().max(100).optional().nullable(),
  // Catalogue traceability
  cataloguePage: z.string().max(50).optional().nullable(),
  sourceFile: z.string().max(500).optional().nullable(),
  // Status flags
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // SEO
  seoTitle: z.string().max(160).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  // Optional primary image URL (supports https://, /assets/..., or data:image/... URI)
  imageUrl: z.string().max(8_000_000, "Image URL or data is too large").optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  collection: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  newArrival: z.enum(["true", "false"]).optional(),
  active: z.enum(["true", "false", "all"]).optional().default("true"),
  sortBy: z
    .enum(["name", "createdAt", "mrp", "catalogueMrp", "productCode", "collection", "category"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;