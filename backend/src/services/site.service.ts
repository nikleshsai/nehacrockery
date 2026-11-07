// ─────────────────────────────────────────────────────────────────────────────
// Remaining services: Banner, SiteSettings, Review, Catalogue
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ── BANNERS ───────────────────────────────────────────────────────────────────

const bannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  image: true,
  buttonText: true,
  buttonUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listBanners(adminMode = false) {
  return prisma.banner.findMany({
    where: adminMode ? undefined : { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: bannerSelect,
  });
}

export async function createBanner(data: {
  title: string;
  subtitle?: string | null;
  image: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return prisma.banner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      image: data.image,
      buttonText: data.buttonText ?? null,
      buttonUrl: data.buttonUrl ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
    select: bannerSelect,
  });
}

export async function updateBanner(id: string, data: Partial<Parameters<typeof createBanner>[0]>) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Banner');
  return prisma.banner.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.buttonText !== undefined && { buttonText: data.buttonText }),
      ...(data.buttonUrl !== undefined && { buttonUrl: data.buttonUrl }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: bannerSelect,
  });
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Banner');
  await prisma.banner.delete({ where: { id } });
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

const reviewSelect = {
  id: true,
  customerName: true,
  businessName: true,
  customerType: true,
  rating: true,
  reviewText: true,
  source: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
};

export async function listReviews(publishedOnly = true) {
  return prisma.review.findMany({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: { createdAt: 'desc' },
    select: reviewSelect,
  });
}

export async function createReview(data: {
  customerName: string;
  businessName?: string | null;
  customerType?: string;
  rating: number;
  reviewText: string;
  source?: string | null;
  isPublished?: boolean;
}) {
  return prisma.review.create({ data: data as Parameters<typeof prisma.review.create>[0]['data'], select: reviewSelect });
}

export async function updateReview(id: string, data: Partial<Parameters<typeof createReview>[0]>) {
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Review');
  return prisma.review.update({ where: { id }, data: data as Parameters<typeof prisma.review.update>[0]['data'], select: reviewSelect });
}

export async function deleteReview(id: string) {
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Review');
  await prisma.review.delete({ where: { id } });
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  return settings;
}

export async function upsertSiteSettings(data: Partial<{
  businessName: string;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  warehouseAddress: string | null;
  businessHours: string | null;
  googleMapsUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  gstNumber: string | null;
  panNumber: string | null;
}>) {
  // M3: Whitelist allowed settings columns to prevent mass assignment
  const cleanData = {
    ...(data.businessName !== undefined && { businessName: data.businessName }),
    ...(data.tagline !== undefined && { tagline: data.tagline }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.warehouseAddress !== undefined && { warehouseAddress: data.warehouseAddress }),
    ...(data.businessHours !== undefined && { businessHours: data.businessHours }),
    ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
    ...(data.facebook !== undefined && { facebook: data.facebook }),
    ...(data.instagram !== undefined && { instagram: data.instagram }),
    ...(data.twitter !== undefined && { twitter: data.twitter }),
    ...(data.youtube !== undefined && { youtube: data.youtube }),
    ...(data.linkedin !== undefined && { linkedin: data.linkedin }),
    ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
    ...(data.panNumber !== undefined && { panNumber: data.panNumber }),
  };

  const existing = await prisma.siteSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) {
    return prisma.siteSettings.update({ where: { id: existing.id }, data: cleanData });
  }
  return prisma.siteSettings.create({
    data: { ...cleanData, businessName: cleanData.businessName ?? 'Neha Crockery House' },
  });
}

// ── CATALOGUES ────────────────────────────────────────────────────────────────

const catalogueSelect = {
  id: true,
  title: true,
  fileUrl: true,
  version: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listCatalogues(adminMode = false) {
  return prisma.catalogue.findMany({
    where: adminMode ? undefined : { isActive: true },
    orderBy: { createdAt: 'desc' },
    select: catalogueSelect,
  });
}

export async function createCatalogue(data: {
  title: string;
  fileUrl: string;
  version?: string | null;
  isActive?: boolean;
}) {
  return prisma.catalogue.create({ data, select: catalogueSelect });
}

export async function updateCatalogue(id: string, data: Partial<Parameters<typeof createCatalogue>[0]>) {
  const existing = await prisma.catalogue.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Catalogue');
  return prisma.catalogue.update({ where: { id }, data, select: catalogueSelect });
}

export async function getCatalogueById(id: string) {
  return prisma.catalogue.findUnique({
    where: { id },
    select: { id: true, fileUrl: true },
  });
}

export async function deleteCatalogue(id: string) {
  const existing = await prisma.catalogue.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Catalogue');
  await prisma.catalogue.delete({ where: { id } });
}

// ── SHOP GALLERY (ShopMedia) ──────────────────────────────────────────────────

const shopMediaSelect = {
  id: true,
  title: true,
  description: true,
  mediaUrl: true,
  mediaType: true,
  thumbnailUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listShopMedia(adminMode = false) {
  return prisma.shopMedia.findMany({
    where: adminMode ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: shopMediaSelect,
  });
}

export async function createShopMedia(data: {
  title?: string | null;
  description?: string | null;
  mediaUrl: string;
  mediaType?: string;
  thumbnailUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return prisma.shopMedia.create({
    data: {
      ...data,
      mediaType: data.mediaType ?? 'image',
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
    select: shopMediaSelect,
  });
}

export async function updateShopMedia(
  id: string,
  data: Partial<Parameters<typeof createShopMedia>[0]>,
) {
  const existing = await prisma.shopMedia.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('ShopMedia');
  return prisma.shopMedia.update({ where: { id }, data, select: shopMediaSelect });
}

export async function getShopMediaById(id: string) {
  return prisma.shopMedia.findUnique({
    where: { id },
    select: { id: true, mediaUrl: true },
  });
}

export async function deleteShopMedia(id: string) {
  const existing = await prisma.shopMedia.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('ShopMedia');
  await prisma.shopMedia.delete({ where: { id } });
}

