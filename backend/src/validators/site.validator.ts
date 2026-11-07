// ─────────────────────────────────────────────────────────────────────────────
// Zod validators for site content endpoints (Banners, Reviews, Catalogues,
// Settings, Shop Media) — prevents mass assignment (M3)
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';
import { CustomerType } from '@prisma/client';

const safeUrlOrPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((val) => !val.toLowerCase().startsWith('data:'), {
    message: 'Base64 data URIs are not permitted; upload files via the media endpoint',
  });

export const createBannerSchema = z.object({
  title: z.string().trim().min(1, 'Banner title is required').max(200),
  subtitle: z.string().trim().max(300).optional().nullable(),
  image: safeUrlOrPathSchema,
  buttonText: z.string().trim().max(80).optional().nullable(),
  buttonUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateBannerSchema = createBannerSchema.partial();

export const createReviewSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  businessName: z.string().trim().max(150).optional().nullable(),
  customerType: z.nativeEnum(CustomerType).optional().default(CustomerType.RESTAURANT),
  rating: z.number().int().min(1).max(5).optional().default(5),
  reviewText: z.string().trim().min(1, 'Review text is required').max(2000),
  source: z.string().trim().max(120).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
});

export const updateReviewSchema = createReviewSchema.partial();

export const createCatalogueSchema = z.object({
  title: z.string().trim().min(1, 'Catalogue title is required').max(200),
  fileUrl: safeUrlOrPathSchema.optional(),
  version: z.string().trim().max(100).optional().nullable(),
  isActive: z
    .preprocess(
      (v) => (v === 'false' ? false : v === 'true' ? true : v),
      z.boolean().optional().default(true),
    ),
});

export const updateCatalogueSchema = createCatalogueSchema.partial();

export const createShopMediaSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  mediaUrl: safeUrlOrPathSchema.optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  thumbnailUrl: safeUrlOrPathSchema.optional().nullable(),
  sortOrder: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
      z.number().int().min(0).max(10_000).default(0),
    ),
  isActive: z
    .preprocess(
      (v) => (v === 'false' ? false : v === 'true' ? true : v),
      z.boolean().optional().default(true),
    ),
});

export const updateShopMediaSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  thumbnailUrl: safeUrlOrPathSchema.optional().nullable(),
  sortOrder: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().int().min(0).max(10_000).optional(),
    ),
  isActive: z
    .preprocess(
      (v) => (v === 'false' ? false : v === 'true' ? true : v),
      z.boolean().optional(),
    ),
});

export const updateSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  tagline: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  whatsapp: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(150).optional().or(z.literal('')).nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  warehouseAddress: z.string().trim().max(500).optional().nullable(),
  businessHours: z.string().trim().max(500).optional().nullable(),
  googleMapsUrl: z.string().trim().max(1000).optional().nullable(),
  facebook: z.string().trim().max(500).optional().nullable(),
  instagram: z.string().trim().max(500).optional().nullable(),
  twitter: z.string().trim().max(500).optional().nullable(),
  youtube: z.string().trim().max(500).optional().nullable(),
  linkedin: z.string().trim().max(500).optional().nullable(),
  gstNumber: z.string().trim().max(50).optional().nullable(),
  panNumber: z.string().trim().max(50).optional().nullable(),
});
