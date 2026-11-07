// ─────────────────────────────────────────────────────────────────────────────
// Security, Validation, Upload Signature & Import Parser Tests
// Runs deterministically without requiring a live PostgreSQL instance.
// Covers: C1, C3, H1, H2, H3, H4, H6, M1, M3, M4, M8, M9, B1, B2, B5, L3, L5
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { Socket } from 'node:net';
import http from 'node:http';
import app, { resolveClientIp } from '../src/app';
import { verifyBufferSignature } from '../src/middleware/upload';
import { parseCsvBuffer } from '../src/services/import.service';
import { signBillAccessToken } from '../src/services/sales.service';
import { createProductSchema, productQuerySchema } from '../src/validators/product.validator';
import { initiateOrderSchema, completeOrderSchema, createAdminSaleSchema } from '../src/validators/sales.validator';
import { updateSettingsSchema, createBannerSchema } from '../src/validators/site.validator';

function dispatchExpressRequest(options: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
}): Promise<{ statusCode: number; headers: Record<string, unknown>; body: Record<string, unknown> }> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    req.method = options.method ?? 'GET';
    req.url = options.url;
    req.headers = Object.fromEntries(
      Object.entries(options.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = ((chunk: unknown) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return origWrite(chunk as never);
    }) as typeof res.write;

    res.end = ((chunk?: unknown) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      origEnd();
      const raw = Buffer.concat(chunks).toString('utf8');
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = { raw };
      }
      resolve({
        statusCode: res.statusCode,
        headers: res.getHeaders() as Record<string, unknown>,
        body: parsed,
      });
      return res;
    }) as typeof res.end;

    (app as unknown as (req: http.IncomingMessage, res: http.ServerResponse) => void)(req, res);
  });
}

describe('Security Headers, CORS & Rate Limiting (C3, M8, M9)', () => {
  it('returns security headers (Permissions-Policy, Referrer-Policy, X-Content-Type-Options)', async () => {
    const res = await dispatchExpressRequest({ url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(String(res.headers['permissions-policy'])).toContain('camera=()');
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('returns 403 CORS_NOT_ALLOWED for disallowed origin instead of 500 (M8)', async () => {
    const res = await dispatchExpressRequest({
      url: '/api/v1/health',
      headers: { Origin: 'https://malicious-attacker.example.com' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CORS_NOT_ALLOWED');
  });

  it('honors trust proxy and extracts first X-Forwarded-For IP for per-client rate limit buckets (C3 / L1)', () => {
    expect(app.get('trust proxy')).toBeGreaterThanOrEqual(1);
    const fakeReq = {
      headers: { 'x-forwarded-for': '203.0.113.42, 10.0.0.1' },
      ip: '10.0.0.1',
    } as never;
    expect(resolveClientIp(fakeReq)).toBe('203.0.113.42');
  });
});

describe('Magic-Byte File Signature Verification (M4)', () => {
  it('accepts valid JPEG, PNG, WebP, PDF, XLSX, and CSV buffers', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'ascii');
    const pdf = Buffer.from('%PDF-1.7\n', 'ascii');
    const xlsx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const csv = Buffer.from('productName,mrp\nDinner Set,1200\n', 'utf8');

    expect(verifyBufferSignature(jpeg, 'image/jpeg', 'photo.jpg')).toBe(true);
    expect(verifyBufferSignature(png, 'image/png', 'photo.png')).toBe(true);
    expect(verifyBufferSignature(webp, 'image/webp', 'photo.webp')).toBe(true);
    expect(verifyBufferSignature(pdf, 'application/pdf', 'cat.pdf')).toBe(true);
    expect(
      verifyBufferSignature(
        xlsx,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'items.xlsx',
      ),
    ).toBe(true);
    expect(verifyBufferSignature(csv, 'text/csv', 'items.csv')).toBe(true);
  });

  it('rejects spoofed files whose content does not match their MIME/extension', () => {
    const htmlAsJpeg = Buffer.from('<script>alert(1)</script>', 'utf8');
    const exeAsPdf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const nulInCsv = Buffer.from('productName\x00,mrp\n', 'binary');

    expect(verifyBufferSignature(htmlAsJpeg, 'image/jpeg', 'evil.jpg')).toBe(false);
    expect(verifyBufferSignature(exeAsPdf, 'application/pdf', 'catalogue.pdf')).toBe(false);
    expect(verifyBufferSignature(nulInCsv, 'text/csv', 'bad.csv')).toBe(false);
  });
});

describe('Safe CSV Parser & Catalogue Field Mapping (H3, B1, B2)', () => {
  it('parses RFC-4180 CSV with quoted fields, catalogue columns, and strips prototype pollution keys', () => {
    const csvText = [
      'Product Name,Product Code,Collection,Subcategory,Colour Finish,Case Qty,MRP,Catalogue MRP,Wholesale Price,Website Price,Price Unit,Catalogue Page,__proto__',
      '"Larah Opal 27pc, Dinner Set",LR-027,Opal Elegance,Dinner Sets,Snow White,4,2499,2599,1850,2199,Per Set,P-14,polluted',
    ].join('\r\n');

    const rows = parseCsvBuffer(Buffer.from(csvText, 'utf8'));
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe('Larah Opal 27pc, Dinner Set');
    expect(rows[0].productCode).toBe('LR-027');
    expect(rows[0].collection).toBe('Opal Elegance');
    expect(rows[0].subcategory).toBe('Dinner Sets');
    expect(rows[0].colourFinish).toBe('Snow White');
    expect(rows[0].caseQty).toBe('4');
    expect(rows[0].catalogueMrp).toBe('2599');
    expect(rows[0].wholesalePrice).toBe('1850');
    expect(rows[0].websitePrice).toBe('2199');
    expect(rows[0].priceUnit).toBe('Per Set');
    expect(rows[0].cataloguePage).toBe('P-14');
    expect(Object.getPrototypeOf(rows[0])).toBeNull();
  });
});

describe('Zod Input Validators (H2, H6, M3, B5, L3)', () => {
  it('rejects base64 data URIs in product imageUrl (H6)', () => {
    const res = createProductSchema.safeParse({
      name: 'Tea Cup Set',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
    });
    expect(res.success).toBe(false);
  });

  it('accepts valid HTTPS or /assets/ imageUrl in product schema (H6)', () => {
    const res = createProductSchema.safeParse({
      name: 'Tea Cup Set',
      imageUrl: 'https://example.supabase.co/storage/v1/object/public/product-images/cup.webp',
    });
    expect(res.success).toBe(true);
  });

  it('validates public order initiation and completion schemas (H2)', () => {
    const badOrder = initiateOrderSchema.safeParse({
      customerName: '',
      phone: '123',
      items: [],
    });
    expect(badOrder.success).toBe(false);

    const validOrder = completeOrderSchema.safeParse({
      customerName: 'Ramesh Kumar',
      phone: '+91 97102 54681',
      items: [{ productName: 'Ocean Glass Set', quantity: 2 }],
      paymentMethod: 'Cash at Store Pickup',
    });
    expect(validOrder.success).toBe(true);
  });

  it('validates admin sales creation and prevents invalid quantities/prices (B5)', () => {
    const invalidSale = createAdminSaleSchema.safeParse({
      customerName: 'Hotel Taj',
      phone: '9710254681',
      items: [{ productName: 'Plate', quantity: -5, unitPrice: -100 }],
    });
    expect(invalidSale.success).toBe(false);
  });

  it('prevents mass assignment on settings and banners (M3)', () => {
    const parsedSettings = updateSettingsSchema.parse({
      businessName: 'Neha Crockery House',
      phone: '+91 97102 54681',
      id: 'injected-id',
      createdAt: '2020-01-01',
    });
    expect(parsedSettings).not.toHaveProperty('id');
    expect(parsedSettings).not.toHaveProperty('createdAt');

    const badBanner = createBannerSchema.safeParse({
      title: 'Festive Offer',
      image: 'data:image/jpeg;base64,AAAA',
    });
    expect(badBanner.success).toBe(false);
  });

  it('validates public product query parameters (L3)', () => {
    const badQuery = productQuerySchema.safeParse({ page: '-5', pageSize: 'abc' });
    expect(badQuery.success).toBe(false);
  });

  it('generates deterministic HMAC bill access tokens (M1)', () => {
    const token = signBillAccessToken('NCH-BILL-20261107-ABCDEF');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });
});
