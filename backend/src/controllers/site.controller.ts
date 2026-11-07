// ─────────────────────────────────────────────────────────────────────────────
// Site controller — banners, reviews, site settings, catalogues, shop gallery
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import * as siteService from '../services/site.service';
import * as storageService from '../services/storage.service';
import { auditFromRequest } from '../services/audit.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

// ── BANNERS ───────────────────────────────────────────────────────────────────

export async function listBanners(_req: Request, res: Response): Promise<void> {
  const banners = await siteService.listBanners();
  sendSuccess(res, banners);
}

export async function adminListBanners(_req: Request, res: Response): Promise<void> {
  const banners = await siteService.listBanners(true);
  sendSuccess(res, banners);
}

export async function adminCreateBanner(req: Request, res: Response): Promise<void> {
  const banner = await siteService.createBanner(req.body);
  await auditFromRequest(req, AuditAction.CREATE, 'Banner', banner.id, `Created banner: ${banner.title}`);
  sendCreated(res, banner, 'Banner created');
}

export async function adminUpdateBanner(req: Request, res: Response): Promise<void> {
  const banner = await siteService.updateBanner(req.params.id, req.body);
  await auditFromRequest(req, AuditAction.UPDATE, 'Banner', banner.id, `Updated banner: ${banner.title}`);
  sendSuccess(res, banner, 'Banner updated');
}

export async function adminDeleteBanner(req: Request, res: Response): Promise<void> {
  await siteService.deleteBanner(req.params.id);
  await auditFromRequest(req, AuditAction.DELETE, 'Banner', req.params.id, 'Deleted banner');
  sendNoContent(res);
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

export async function listReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await siteService.listReviews(true);
  sendSuccess(res, reviews);
}

export async function adminListReviews(_req: Request, res: Response): Promise<void> {
  const reviews = await siteService.listReviews(false);
  sendSuccess(res, reviews);
}

export async function adminCreateReview(req: Request, res: Response): Promise<void> {
  const review = await siteService.createReview(req.body);
  await auditFromRequest(req, AuditAction.CREATE, 'Review', review.id, `Created review by ${review.customerName}`);
  sendCreated(res, review, 'Review created');
}

export async function adminUpdateReview(req: Request, res: Response): Promise<void> {
  const review = await siteService.updateReview(req.params.id, req.body);
  await auditFromRequest(req, AuditAction.UPDATE, 'Review', review.id, `Updated review ${review.id}`);
  sendSuccess(res, review, 'Review updated');
}

export async function adminDeleteReview(req: Request, res: Response): Promise<void> {
  await siteService.deleteReview(req.params.id);
  await auditFromRequest(req, AuditAction.DELETE, 'Review', req.params.id, 'Deleted review');
  sendNoContent(res);
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────────────

export async function getSiteSettings(_req: Request, res: Response): Promise<void> {
  const settings = await siteService.getSiteSettings();
  sendSuccess(res, settings);
}

export async function adminUpdateSettings(req: Request, res: Response): Promise<void> {
  const settings = await siteService.upsertSiteSettings(req.body);
  await auditFromRequest(req, AuditAction.SETTINGS_CHANGE, 'SiteSettings', settings.id, 'Updated site settings');
  sendSuccess(res, settings, 'Settings updated');
}

// ── CATALOGUES ────────────────────────────────────────────────────────────────

export async function listCatalogues(_req: Request, res: Response): Promise<void> {
  const catalogues = await siteService.listCatalogues();
  sendSuccess(res, catalogues);
}

export async function adminListCatalogues(_req: Request, res: Response): Promise<void> {
  const catalogues = await siteService.listCatalogues(true);
  sendSuccess(res, catalogues);
}

export async function adminCreateCatalogue(req: Request, res: Response): Promise<void> {
  const uploadedFile = req.file as Express.Multer.File | undefined;

  let fileUrl: string;

  if (uploadedFile) {
    // Upload PDF buffer to Supabase Storage → catalogues bucket
    const { publicUrl } = await storageService.uploadFile('catalogues', uploadedFile, 'pdfs');
    fileUrl = publicUrl;
  } else if (req.body.fileUrl) {
    fileUrl = req.body.fileUrl as string;
  } else {
    res.status(400).json({ success: false, message: 'A PDF file or fileUrl is required' });
    return;
  }

  const catalogue = await siteService.createCatalogue({
    title: req.body.title,
    fileUrl,
    version: req.body.version || null,
    isActive:
      req.body.isActive === 'false'
        ? false
        : req.body.isActive === 'true'
          ? true
          : (req.body.isActive ?? true),
  });
  await auditFromRequest(req, AuditAction.CREATE, 'Catalogue', catalogue.id, `Created catalogue: ${catalogue.title}`);
  sendCreated(res, catalogue, 'Catalogue created');
}

export async function adminUpdateCatalogue(req: Request, res: Response): Promise<void> {
  const catalogue = await siteService.updateCatalogue(req.params.id, req.body);
  await auditFromRequest(req, AuditAction.UPDATE, 'Catalogue', catalogue.id, `Updated catalogue: ${catalogue.title}`);
  sendSuccess(res, catalogue, 'Catalogue updated');
}

export async function adminDeleteCatalogue(req: Request, res: Response): Promise<void> {
  // Fetch catalogue so we can delete the PDF from Supabase Storage too
  const catalogue = await siteService.getCatalogueById(req.params.id);
  await siteService.deleteCatalogue(req.params.id);
  if (catalogue?.fileUrl) {
    const storagePath = storageService.storagePathFromUrl(catalogue.fileUrl, 'catalogues');
    await storageService.deleteFile('catalogues', storagePath);
  }
  await auditFromRequest(req, AuditAction.DELETE, 'Catalogue', req.params.id, 'Deleted catalogue');
  sendNoContent(res);
}

// ── SHOP GALLERY ──────────────────────────────────────────────────────────────

export async function listShopMedia(_req: Request, res: Response): Promise<void> {
  const media = await siteService.listShopMedia(false);
  sendSuccess(res, media);
}

export async function adminListShopMedia(_req: Request, res: Response): Promise<void> {
  const media = await siteService.listShopMedia(true);
  sendSuccess(res, media);
}

export async function adminCreateShopMedia(req: Request, res: Response): Promise<void> {
  const uploadedFile = req.file as Express.Multer.File | undefined;

  if (!uploadedFile && !req.body.mediaUrl) {
    res.status(400).json({ success: false, message: 'A file or mediaUrl is required' });
    return;
  }

  const isVideo = uploadedFile
    ? uploadedFile.mimetype.startsWith('video/')
    : req.body.mediaType === 'video';

  let mediaUrl: string;

  if (uploadedFile) {
    // Upload to Supabase Storage → shop-gallery bucket
    const folder = isVideo ? 'videos' : 'photos';
    const { publicUrl } = await storageService.uploadFile('shop-gallery', uploadedFile, folder);
    mediaUrl = publicUrl;
  } else {
    mediaUrl = req.body.mediaUrl as string;
  }

  const media = await siteService.createShopMedia({
    title: req.body.title || null,
    description: req.body.description || null,
    mediaUrl,
    mediaType: isVideo ? 'video' : 'image',
    thumbnailUrl: req.body.thumbnailUrl || null,
    sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder, 10) : 0,
    isActive: req.body.isActive === 'false' ? false : true,
  });
  await auditFromRequest(req, AuditAction.CREATE, 'ShopMedia', media.id, `Uploaded shop media: ${media.title ?? media.id}`);
  sendCreated(res, media, 'Shop media uploaded');
}

export async function adminUpdateShopMedia(req: Request, res: Response): Promise<void> {
  const media = await siteService.updateShopMedia(req.params.id, {
    title: req.body.title,
    description: req.body.description,
    thumbnailUrl: req.body.thumbnailUrl,
    sortOrder: req.body.sortOrder !== undefined ? parseInt(String(req.body.sortOrder), 10) : undefined,
    isActive:
      req.body.isActive !== undefined
        ? req.body.isActive === 'false'
          ? false
          : Boolean(req.body.isActive)
        : undefined,
  });
  await auditFromRequest(req, AuditAction.UPDATE, 'ShopMedia', media.id, `Updated shop media: ${media.id}`);
  sendSuccess(res, media, 'Shop media updated');
}

export async function adminDeleteShopMedia(req: Request, res: Response): Promise<void> {
  // Fetch the record so we can delete the file from Supabase Storage after DB deletion succeeds
  const media = await siteService.getShopMediaById(req.params.id);
  await siteService.deleteShopMedia(req.params.id);
  if (media?.mediaUrl) {
    const storagePath = storageService.storagePathFromUrl(media.mediaUrl, 'shop-gallery');
    await storageService.deleteFile('shop-gallery', storagePath);
  }
  await auditFromRequest(req, AuditAction.DELETE, 'ShopMedia', req.params.id, 'Deleted shop media');
  sendNoContent(res);
}
