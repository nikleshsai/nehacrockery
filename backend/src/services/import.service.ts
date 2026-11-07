// ─────────────────────────────────────────────────────────────────────────────
// Safe CSV & OpenXML (.xlsx) product import service
// Fixes:
// - H3: Replaces vulnerable `xlsx` dependency with a zero-dependency,
//       prototype-pollution-safe RFC-4180 CSV + bounded OpenXML (.xlsx) parser.
// - B1: Tracks `reservedSlugs` across the import batch so duplicate product
//       names within the same file receive unique slugs (-1, -2, ...).
// - B2: Supports all product catalogue fields (`collection`, `subcategory`,
//       `colourFinish`, `caseQty`, `catalogueMrp`, `wholesalePrice`,
//       `websitePrice`, `priceUnit`, `cataloguePage`, `sourceFile`).
// ─────────────────────────────────────────────────────────────────────────────
import zlib from 'node:zlib';
import prisma from '../config/database';
import { generateUniqueSlug } from '../utils/slugify';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

const MAX_DECOMPRESSED_BYTES = 10 * 1024 * 1024; // 10 MB zip-bomb ceiling
const MAX_IMPORT_ROWS = 5000;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export interface ImportRow {
  productName?: unknown;
  productCode?: unknown;
  brand?: unknown;
  category?: unknown;
  collection?: unknown;
  subcategory?: unknown;
  description?: unknown;
  material?: unknown;
  capacity?: unknown;
  dimensions?: unknown;
  colourFinish?: unknown;
  setContents?: unknown;
  piecesPerSet?: unknown;
  caseQty?: unknown;
  packagingInformation?: unknown;
  features?: unknown;
  mrp?: unknown;
  catalogueMrp?: unknown;
  wholesalePrice?: unknown;
  websitePrice?: unknown;
  priceUnit?: unknown;
  cataloguePage?: unknown;
  sourceFile?: unknown;
  isFeatured?: unknown;
  isNewArrival?: unknown;
}

export interface RowResult {
  row: number;
  productName: string;
  status: 'success' | 'error' | 'skipped';
  errors?: string[];
}

export interface ImportReport {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  rows: RowResult[];
}

function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true', '1', 'yes', 'y'].includes(v.toLowerCase().trim());
  if (typeof v === 'number') return v === 1;
  return false;
}

function coercePositiveNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const cleaned = String(v).replace(/[₹,\s]/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function coercePositiveInt(v: unknown): number | null {
  const n = coercePositiveNumber(v);
  return n !== null ? Math.round(n) : null;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&');
}

/**
 * Normalizes flexible header labels (e.g. "Product Name", "product_name", "Catalogue MRP")
 * to canonical ImportRow field names.
 */
function normalizeHeaderKey(rawHeader: string): string {
  const trimmed = rawHeader.replace(/^\uFEFF/, '').trim();
  if (FORBIDDEN_KEYS.has(trimmed)) return '';

  const compact = trimmed.toLowerCase().replace(/[\s_-]+/g, '');
  const map: Record<string, keyof ImportRow> = {
    productname: 'productName',
    name: 'productName',
    itemname: 'productName',
    productcode: 'productCode',
    code: 'productCode',
    itemcode: 'productCode',
    sku: 'productCode',
    brand: 'brand',
    brandname: 'brand',
    category: 'category',
    categoryname: 'category',
    collection: 'collection',
    series: 'collection',
    subcategory: 'subcategory',
    description: 'description',
    material: 'material',
    capacity: 'capacity',
    dimensions: 'dimensions',
    size: 'dimensions',
    colourfinish: 'colourFinish',
    colorfinish: 'colourFinish',
    colour: 'colourFinish',
    color: 'colourFinish',
    setcontents: 'setContents',
    piecesperset: 'piecesPerSet',
    pieces: 'piecesPerSet',
    caseqty: 'caseQty',
    mastercartonqty: 'caseQty',
    packaginginformation: 'packagingInformation',
    packaging: 'packagingInformation',
    features: 'features',
    mrp: 'mrp',
    cataloguemrp: 'catalogueMrp',
    mrpasprinted: 'catalogueMrp',
    wholesaleprice: 'wholesalePrice',
    websiteprice: 'websitePrice',
    priceunit: 'priceUnit',
    unit: 'priceUnit',
    cataloguepage: 'cataloguePage',
    page: 'cataloguePage',
    sourcefile: 'sourceFile',
    isfeatured: 'isFeatured',
    featured: 'isFeatured',
    isnewarrival: 'isNewArrival',
    newarrival: 'isNewArrival',
  };

  return map[compact] ?? trimmed;
}

/**
 * RFC-4180 compliant CSV parser producing prototype-safe row objects.
 */
export function parseCsvBuffer(buffer: Buffer): ImportRow[] {
  const content = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const matrix: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && content[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((cell) => cell.trim() !== '')) {
        matrix.push(currentRow);
      }
      currentRow = [];
      if (matrix.length > MAX_IMPORT_ROWS + 1) {
        throw AppError.badRequest(`Import file exceeds maximum of ${MAX_IMPORT_ROWS} rows`);
      }
    } else {
      currentField += ch;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.trim() !== '')) {
      matrix.push(currentRow);
    }
  }

  if (matrix.length < 2) return [];

  const headers = matrix[0].map(normalizeHeaderKey);
  const rows: ImportRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const values = matrix[r];
    const obj: Record<string, string> = Object.create(null);
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key || FORBIDDEN_KEYS.has(key)) continue;
      obj[key] = values[c] ?? '';
    }
    rows.push(obj as unknown as ImportRow);
  }

  return rows;
}

/**
 * Extracts entries from an OpenXML `.xlsx` ZIP archive using Central Directory headers
 * with strict decompression bounds (H3).
 */
function extractXlsxXmlEntries(buffer: Buffer): Map<string, string> {
  const entries = new Map<string, string>();
  let totalDecompressed = 0;

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minEocdSearch; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw AppError.badRequest('Invalid .xlsx archive structure');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  let ptr = cdOffset;

  for (let i = 0; i < totalEntries && ptr + 46 <= buffer.length; i++) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(ptr + 10);
    const compressedSize = buffer.readUInt32LE(ptr + 20);
    const uncompressedSize = buffer.readUInt32LE(ptr + 24);
    const fileNameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);

    const fileName = buffer.subarray(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');
    ptr += 46 + fileNameLen + extraLen + commentLen;

    if (
      fileName !== 'xl/sharedStrings.xml' &&
      !fileName.startsWith('xl/worksheets/sheet')
    ) {
      continue;
    }

    if (uncompressedSize > MAX_DECOMPRESSED_BYTES) {
      throw AppError.badRequest('Spreadsheet XML exceeds maximum safe size');
    }

    if (localHeaderOffset + 30 > buffer.length) continue;
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) continue;

    const slice = buffer.subarray(dataStart, dataEnd);
    let outBuf: Buffer;
    if (compressionMethod === 0) {
      outBuf = slice;
    } else if (compressionMethod === 8) {
      outBuf = zlib.inflateRawSync(slice, { maxOutputLength: MAX_DECOMPRESSED_BYTES });
    } else {
      continue;
    }

    totalDecompressed += outBuf.length;
    if (totalDecompressed > MAX_DECOMPRESSED_BYTES) {
      throw AppError.badRequest('Decompressed .xlsx content exceeds safety limit');
    }

    entries.set(fileName, outBuf.toString('utf8'));
  }

  return entries;
}

function colLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

/**
 * Parses an OpenXML `.xlsx` buffer into prototype-safe `ImportRow[]` without `xlsx`.
 */
export function parseXlsxBuffer(buffer: Buffer): ImportRow[] {
  const entries = extractXlsxXmlEntries(buffer);
  const sharedStringsXml = entries.get('xl/sharedStrings.xml') ?? '';
  const sharedStrings: string[] = [];

  if (sharedStringsXml) {
    const siParts = sharedStringsXml.split('<si');
    for (let i = 1; i < siParts.length; i++) {
      const siBlock = siParts[i];
      const endSi = siBlock.indexOf('</si>');
      const content = endSi !== -1 ? siBlock.slice(0, endSi) : siBlock;
      const textChunks: string[] = [];
      let pos = 0;
      while (pos < content.length) {
        const tOpen = content.indexOf('<t', pos);
        if (tOpen === -1) break;
        const gt = content.indexOf('>', tOpen);
        if (gt === -1) break;
        const tClose = content.indexOf('</t>', gt);
        if (tClose === -1) break;
        textChunks.push(decodeXmlEntities(content.slice(gt + 1, tClose)));
        pos = tClose + 4;
      }
      sharedStrings.push(textChunks.join(''));
    }
  }

  const sheetKey =
    Array.from(entries.keys())
      .filter((k) => k.startsWith('xl/worksheets/sheet'))
      .sort()[0] ?? '';
  const sheetXml = entries.get(sheetKey);
  if (!sheetXml) return [];

  const matrix: string[][] = [];
  const rowBlocks = sheetXml.split('<row');

  for (let r = 1; r < rowBlocks.length; r++) {
    const block = rowBlocks[r];
    const rowEnd = block.indexOf('</row>');
    const rowContent = rowEnd !== -1 ? block.slice(0, rowEnd) : block;
    const rowCells: string[] = [];

    const cellBlocks = rowContent.split('<c');
    let nextColIdx = 0;

    for (let c = 1; c < cellBlocks.length; c++) {
      const cellStr = cellBlocks[c];
      const tagEnd = cellStr.indexOf('>');
      if (tagEnd === -1) continue;
      const attrs = cellStr.slice(0, tagEnd);
      const body = cellStr.slice(tagEnd + 1);

      const refMatch = /\br="([A-Z]+)\d+"/.exec(attrs);
      const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : nextColIdx;
      nextColIdx = colIdx + 1;

      const typeMatch = /\bt="([^"]+)"/.exec(attrs);
      const cellType = typeMatch ? typeMatch[1] : '';

      let value = '';
      if (cellType === 'inlineStr') {
        const tOpen = body.indexOf('<t');
        if (tOpen !== -1) {
          const gt = body.indexOf('>', tOpen);
          const tClose = body.indexOf('</t>', gt);
          if (gt !== -1 && tClose !== -1) {
            value = decodeXmlEntities(body.slice(gt + 1, tClose));
          }
        }
      } else {
        const vOpen = body.indexOf('<v>');
        const vClose = body.indexOf('</v>', vOpen);
        if (vOpen !== -1 && vClose !== -1) {
          const rawVal = decodeXmlEntities(body.slice(vOpen + 3, vClose));
          if (cellType === 's') {
            const sIdx = parseInt(rawVal, 10);
            value = sharedStrings[sIdx] ?? '';
          } else {
            value = rawVal;
          }
        }
      }

      while (rowCells.length <= colIdx) rowCells.push('');
      rowCells[colIdx] = value;
    }

    if (rowCells.some((cell) => cell.trim() !== '')) {
      matrix.push(rowCells);
      if (matrix.length > MAX_IMPORT_ROWS + 1) {
        throw AppError.badRequest(`Import file exceeds maximum of ${MAX_IMPORT_ROWS} rows`);
      }
    }
  }

  if (matrix.length < 2) return [];

  const headers = matrix[0].map(normalizeHeaderKey);
  const rows: ImportRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const values = matrix[r];
    const obj: Record<string, string> = Object.create(null);
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key || FORBIDDEN_KEYS.has(key)) continue;
      obj[key] = values[c] ?? '';
    }
    rows.push(obj as unknown as ImportRow);
  }

  return rows;
}

export async function importProductsFromBuffer(
  buffer: Buffer,
  mimetype: string,
): Promise<ImportReport> {
  const isZip =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  const rows: ImportRow[] =
    isZip || mimetype.includes('spreadsheetml')
      ? parseXlsxBuffer(buffer)
      : parseCsvBuffer(buffer);

  const report: ImportReport = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    rows: [],
  };

  if (rows.length === 0) {
    return report;
  }

  // Pre-load categories and brands for lookup (case-insensitive name/slug matching)
  const [allCategories, allBrands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  const categoryMap = new Map<string, string>();
  allCategories.forEach((c) => {
    categoryMap.set(c.name.toLowerCase(), c.id);
    categoryMap.set(c.slug.toLowerCase(), c.id);
  });

  const brandMap = new Map<string, string>();
  allBrands.forEach((b) => {
    brandMap.set(b.name.toLowerCase(), b.id);
    brandMap.set(b.slug.toLowerCase(), b.id);
  });

  const validRows: Array<{
    rowIndex: number;
    data: Parameters<typeof prisma.product.create>[0]['data'];
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row
    const errors: string[] = [];

    const productName = String(row.productName ?? '').trim();
    if (!productName) {
      errors.push('productName is required');
    }

    // Resolve category
    let categoryId: string | null = null;
    if (row.category && String(row.category).trim()) {
      const key = String(row.category).trim().toLowerCase();
      categoryId = categoryMap.get(key) ?? null;
      if (!categoryId) {
        errors.push(`Category "${row.category}" not found`);
      }
    }

    // Resolve brand
    let brandId: string | null = null;
    if (row.brand && String(row.brand).trim()) {
      const key = String(row.brand).trim().toLowerCase();
      brandId = brandMap.get(key) ?? null;
      if (!brandId) {
        errors.push(`Brand "${row.brand}" not found`);
      }
    }

    if (errors.length > 0) {
      report.rows.push({
        row: rowNum,
        productName: productName || '(empty)',
        status: 'error',
        errors,
      });
      report.failed++;
      continue;
    }

    const mrp = coercePositiveNumber(row.mrp);
    const catalogueMrp = coercePositiveNumber(row.catalogueMrp) ?? mrp;
    const wholesalePrice = coercePositiveNumber(row.wholesalePrice);
    const websitePrice = coercePositiveNumber(row.websitePrice);
    const piecesPerSet = coercePositiveInt(row.piecesPerSet);
    const caseQty = coercePositiveInt(row.caseQty);

    let features: string[] = [];
    if (row.features) {
      const raw = String(row.features).trim();
      features = raw
        .split(/[,;|]/)
        .map((f) => f.trim())
        .filter(Boolean);
    }

    // B2: Map all catalogue fields
    validRows.push({
      rowIndex: rowNum,
      data: {
        name: productName,
        slug: '', // resolved below with batch deduplication
        productCode: row.productCode ? String(row.productCode).trim() : null,
        description: row.description ? String(row.description).trim() : null,
        brandId,
        categoryId,
        collection: row.collection ? String(row.collection).trim() : null,
        subcategory: row.subcategory ? String(row.subcategory).trim() : null,
        material: row.material ? String(row.material).trim() : null,
        capacity: row.capacity ? String(row.capacity).trim() : null,
        dimensions: row.dimensions ? String(row.dimensions).trim() : null,
        colourFinish: row.colourFinish ? String(row.colourFinish).trim() : null,
        setContents: row.setContents ? String(row.setContents).trim() : null,
        piecesPerSet,
        caseQty,
        packagingInformation: row.packagingInformation
          ? String(row.packagingInformation).trim()
          : null,
        features,
        mrp,
        catalogueMrp,
        wholesalePrice,
        websitePrice,
        priceUnit: row.priceUnit ? String(row.priceUnit).trim() : null,
        cataloguePage: row.cataloguePage ? String(row.cataloguePage).trim() : null,
        sourceFile: row.sourceFile ? String(row.sourceFile).trim() : null,
        isFeatured: coerceBool(row.isFeatured),
        isNewArrival: coerceBool(row.isNewArrival),
        isActive: true,
      },
    });
  }

  // B1: Resolve unique slugs tracking `reservedSlugs` across the entire batch
  const reservedSlugs = new Set<string>();
  for (const vr of validRows) {
    vr.data.slug = await generateUniqueSlug(
      String(vr.data.name),
      'product',
      undefined,
      reservedSlugs,
    );
  }

  // Insert using a transaction — all or nothing
  if (validRows.length > 0) {
    try {
      await prisma.$transaction(
        validRows.map((vr) => prisma.product.create({ data: vr.data })),
      );

      for (const vr of validRows) {
        report.rows.push({
          row: vr.rowIndex,
          productName: String(vr.data.name),
          status: 'success',
        });
        report.successful++;
      }
    } catch (err) {
      logger.error('Product import transaction failed', { err });
      for (const vr of validRows) {
        report.rows.push({
          row: vr.rowIndex,
          productName: String(vr.data.name),
          status: 'error',
          errors: ['Database insert failed — transaction rolled back'],
        });
        report.failed++;
      }
    }
  }

  return report;
}
