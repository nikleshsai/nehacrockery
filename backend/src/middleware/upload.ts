// ─────────────────────────────────────────────────────────────────────────────
// Multer upload configuration — all storage is Supabase Storage.
//
// All multer instances use memoryStorage so files are held in-memory as
// Buffer objects and never written to local disk. The actual upload to
// Supabase happens in the controllers / storage.service after validation.
// ─────────────────────────────────────────────────────────────────────────────
import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const ALLOWED_DOC_TYPES = ['application/pdf'];
const ALLOWED_DOC_EXTS = ['.pdf'];

const ALLOWED_IMPORT_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_IMPORT_EXTS = ['.csv', '.xlsx'];

const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const ALLOWED_MEDIA_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'];

function getLowerExt(filename: string): string {
  return path.extname(filename || '').toLowerCase();
}

/**
 * Validates magic-byte file signatures against expected category (M4).
 */
export function verifyBufferSignature(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): boolean {
  if (!buffer || buffer.length < 4) return false;
  const ext = getLowerExt(originalname);

  // JPEG: FF D8 FF
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg' || ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimetype === 'image/png' || ext === '.png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF....WEBP
  if (mimetype === 'image/webp' || ext === '.webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  // PDF: %PDF-
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  // XLSX (OpenXML ZIP): PK\x03\x04
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    ext === '.xlsx'
  ) {
    return (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  // CSV: plain text without binary NUL bytes
  if (mimetype === 'text/csv' || mimetype === 'application/csv' || ext === '.csv') {
    const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
    return !sample.includes(0x00);
  }

  // MP4 / QuickTime MOV: ....ftyp
  if (mimetype === 'video/mp4' || mimetype === 'video/quicktime' || ext === '.mp4' || ext === '.mov') {
    return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }

  // WebM (EBML): 1A 45 DF A3
  if (mimetype === 'video/webm' || ext === '.webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return false;
}

/**
 * Express middleware to verify magic-byte signatures of uploaded files (M4).
 */
export function validateUploadedFileSignatures(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const list of Object.values(req.files)) {
      if (Array.isArray(list)) files.push(...list);
    }
  }

  for (const file of files) {
    if (!verifyBufferSignature(file.buffer, file.mimetype, file.originalname)) {
      next(
        AppError.badRequest(
          `Uploaded file "${file.originalname}" failed file signature verification`,
          'INVALID_FILE_SIGNATURE',
        ),
      );
      return;
    }
  }

  next();
}

// ── Filter helpers ─────────────────────────────────────────────────────────────

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = getLowerExt(file.originalname);
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Only JPEG, PNG, and WebP images are allowed'));
  }
}

function docFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = getLowerExt(file.originalname);
  if (ALLOWED_DOC_TYPES.includes(file.mimetype) && ALLOWED_DOC_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Only PDF files are allowed for catalogues'));
  }
}

function csvFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = getLowerExt(file.originalname);
  if (ALLOWED_IMPORT_TYPES.includes(file.mimetype) && ALLOWED_IMPORT_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Only CSV (.csv) or Excel (.xlsx) files are allowed for import'));
  }
}

function shopMediaFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = getLowerExt(file.originalname);
  if (ALLOWED_MEDIA_TYPES.includes(file.mimetype) && ALLOWED_MEDIA_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Only images (JPEG/PNG/WebP) and videos (MP4/WebM/MOV) are allowed'));
  }
}

// ── Multer instances (all use memoryStorage with bounded limits — L7) ─────────

const maxImageSizeBytes = Math.min(config.upload.maxSizeMb * 1024 * 1024, 5 * 1024 * 1024);

/** Product images — up to 5 files, max 5 MB per file (L7) */
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: maxImageSizeBytes, files: 5 },
});

/** Catalogue PDFs — single file, up to 20 MB (L7) */
export const uploadCatalogue = multer({
  storage: multer.memoryStorage(),
  fileFilter: docFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

/** CSV/Excel product import — single file, up to 5 MB */
export const uploadImport = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

/** Shop gallery images & videos — single file, up to 25 MB (L7: prevents 2GB RAM spikes) */
export const uploadShopMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter: shopMediaFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});
