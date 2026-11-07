// ─────────────────────────────────────────────────────────────────────────────
// Slug utilities
// ─────────────────────────────────────────────────────────────────────────────
import slugify from 'slugify';
import prisma from '../config/database';

export function createSlug(text: string): string {
  const slug = slugify(text, { lower: true, strict: true, trim: true });
  return slug || 'item';
}

/**
 * Generate a unique slug for a given model.
 * Appends -1, -2, … if the base slug already exists in the DB or in `reservedSlugs` (B1).
 */
export async function generateUniqueSlug(
  text: string,
  model: 'product' | 'category' | 'brand',
  excludeId?: string,
  reservedSlugs?: Set<string>,
): Promise<string> {
  const base = createSlug(text);
  let candidate = base;
  let counter = 1;

  while (true) {
    if (reservedSlugs && reservedSlugs.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter++;
      continue;
    }

    let existing: { id: string } | null = null;

    if (model === 'product') {
      existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    } else if (model === 'category') {
      existing = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    } else {
      existing = await prisma.brand.findUnique({ where: { slug: candidate }, select: { id: true } });
    }

    if (!existing || existing.id === excludeId) break;

    candidate = `${base}-${counter}`;
    counter++;
  }

  if (reservedSlugs) {
    reservedSlugs.add(candidate);
  }

  return candidate;
}
