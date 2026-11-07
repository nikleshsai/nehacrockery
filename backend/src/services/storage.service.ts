// ─────────────────────────────────────────────────────────────────────────────
// Supabase Storage service
//
// Bucket layout (create these in Supabase Dashboard → Storage):
//   product-images   — product photos (public)
//   catalogues       — PDF catalogues  (public)
//   shop-gallery     — shop photos & videos (public)
//
// All buckets should be set to PUBLIC so the returned URLs work without a
// signed token. If you want private buckets, use createSignedUrl() instead.
// ─────────────────────────────────────────────────────────────────────────────
import path from 'path';
import { getSupabaseClient } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export type StorageBucket = 'product-images' | 'catalogues' | 'shop-gallery';

export interface UploadResult {
  /** Permanent public URL of the uploaded file */
  publicUrl: string;
  /** Storage path used (bucket-relative), useful for deletes */
  storagePath: string;
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to a Supabase Storage bucket.
 *
 * @param bucket   Target bucket name
 * @param file     Multer file object (uses memoryStorage — buffer is populated)
 * @param folder   Sub-folder inside the bucket (e.g. 'products', 'shop')
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: Express.Multer.File,
  folder = '',
): Promise<UploadResult> {
  const supabase = getSupabaseClient();

  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const storagePath = folder ? `${folder}/${uniqueName}` : uniqueName;

  let { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  // Auto-create bucket if it does not exist yet in Supabase Storage
  if (error && /not found|bucket/i.test(error.message || '')) {
    try {
      await supabase.storage.createBucket(bucket, { public: true });
      const retry = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      error = retry.error;
    } catch (bucketErr) {
      logger.warn(`Auto-create bucket [${bucket}] warning:`, bucketErr);
    }
  }

  if (error) {
    // Fallback for image uploads so Admin product image upload works even if Supabase Storage bucket policies block it
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      logger.warn(`Supabase Storage upload failed [${bucket}/${storagePath}] (${error.message}); using inline data URL fallback.`);
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return {
        publicUrl: dataUrl,
        storagePath: `inline/${uniqueName}`,
      };
    }
    logger.error(`Supabase Storage upload failed [${bucket}/${storagePath}]:`, error);
    throw AppError.internal(`File upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    publicUrl: data.publicUrl,
    storagePath,
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a file from a Supabase Storage bucket by its storage path.
 * Silently ignores "not found" errors so delete endpoints stay idempotent.
 */
export async function deleteFile(bucket: StorageBucket, storagePath: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(bucket).remove([storagePath]);

  if (error) {
    // Log but don't throw — the DB record delete should still succeed
    logger.warn(`Supabase Storage delete warning [${bucket}/${storagePath}]:`, error.message);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the storage path from a full Supabase public URL.
 * Useful when you only stored the URL in the DB and need to delete the file.
 *
 * Example URL:
 *   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
export function storagePathFromUrl(publicUrl: string, bucket: StorageBucket): string {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    logger.warn(`storagePathFromUrl: could not parse path from URL: ${publicUrl}`);
    return publicUrl; // fallback — Supabase will just 404 on the delete
  }
  return publicUrl.slice(idx + marker.length);
}
