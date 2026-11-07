// =============================================================================
// Zod validators for product endpoints
// Updated: includes new catalogue fields and H6/L8 URL validation
// =============================================================================
import { z } from "zod";

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048, "Image URL must be at most 2048 characters")
  .refine(
    (val) =>
      val === "" ||
      (!val.toLowerCase().startsWith("data:") &&
        (val.startsWith("https://") ||
          val.startsWith("http://") ||
          val.startsWith("/assets/") ||
          val.startsWith("/uploads/"))),
    {
      message:
        "Image URL must be a valid HTTP(S) or /assets/ URL (base64 data URIs are not permitted; use the image upload endpoint instead)",
    },
  )
  .optional()
  .nullable();

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  productCode: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  brandId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  // Physical
  material: z.string().max(255).optional().nullable(),
  capacity: z.string().max(100).optional().nullable(),
  dimensions: z.string().max(255).optional().nullable(),
  colourFinish: z.string().max(255).optional().nullable(),
  setContents: z.string().max(2000).optional().nullable(),
  piecesPerSet: z.number().int().positive().optional().nullable(),
  caseQty: z.number().int().positive().optional().nullable(),
  packagingInformation: z.string().max(2000).optional().nullable(),
  features: z.array(z.string().max(500)).max(50).default([]),
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
  // Primary image URL (H6: only HTTP(S) or /assets/ URLs; base64 data URIs are rejected)
  imageUrl: imageUrlSchema,
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, "page must be a positive integer").optional(),
  pageSize: z.string().regex(/^\d+$/, "pageSize must be a positive integer").optional(),
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  collection: z.string().max(100).optional(),
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