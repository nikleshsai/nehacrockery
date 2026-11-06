// ─────────────────────────────────────────────────────────────────────────────
// Product tests — CRUD, search, filtering, authorization
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

let createdProductId: string;
let categoryId: string;
let brandId: string;

const ADMIN_EMAIL = 'product-test-admin@nehacrockery.com';
// Mocked Supabase access token (see tests/setup.ts)
const adminToken = `test-token:${ADMIN_EMAIL}`;

beforeAll(async () => {
  // Create test admin (role record; credentials live in Supabase Auth)
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { isActive: true },
    create: {
      name: 'Product Test Admin',
      email: ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Create test category
  const category = await prisma.category.upsert({
    where: { slug: 'test-crockery' },
    update: {},
    create: { name: 'Test Crockery', slug: 'test-crockery', isActive: true },
  });
  categoryId = category.id;

  // Create test brand
  const brand = await prisma.brand.upsert({
    where: { slug: 'test-brand' },
    update: {},
    create: { name: 'Test Brand', slug: 'test-brand', isActive: true },
  });
  brandId = brand.id;
});

afterAll(async () => {
  // Clean up test data
  await prisma.product.deleteMany({ where: { name: { startsWith: 'Test Product' } } });
  await prisma.category.deleteMany({ where: { slug: 'test-crockery' } });
  await prisma.brand.deleteMany({ where: { slug: 'test-brand' } });
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

// ── Admin authorization ────────────────────────────────────────────────────────
describe('Admin product routes — Authorization', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/v1/admin/products');
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });
});

// ── Product creation ───────────────────────────────────────────────────────────
describe('POST /api/v1/admin/products', () => {
  it('should return 400 for missing product name', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No name provided' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should create a product successfully', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product Dinner Set',
        productCode: 'TP-001',
        description: 'A test dinner set',
        categoryId,
        brandId,
        material: 'Bone China',
        mrp: 1499,
        isFeatured: true,
        isNewArrival: false,
        isActive: true,
        features: ['Dishwasher safe', 'Microwave safe'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Product Dinner Set');
    expect(res.body.data.slug).toBe('test-product-dinner-set');
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.brand).toBeDefined();
    expect(res.body.data.images).toBeDefined();
    expect(Array.isArray(res.body.data.features)).toBe(true);

    createdProductId = res.body.data.id;
  });

  it('should return 409 for duplicate product code', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product Duplicate', productCode: 'TP-001' });
    expect(res.status).toBe(409);
  });
});

// ── Product retrieval ─────────────────────────────────────────────────────────
describe('GET /api/v1/products — Public listing', () => {
  it('should list products without authentication', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });

  it('should support pagination params', async () => {
    const res = await request(app).get('/api/v1/products?page=1&pageSize=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(5);
  });

  it('should filter by category slug', async () => {
    const res = await request(app).get('/api/v1/products?category=test-crockery');
    expect(res.status).toBe(200);
    // Products returned should belong to test category
    if (res.body.data.length > 0) {
      expect(res.body.data[0].category.slug).toBe('test-crockery');
    }
  });

  it('should filter by featured flag', async () => {
    const res = await request(app).get('/api/v1/products?featured=true');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((p: { isFeatured: boolean }) => {
        expect(p.isFeatured).toBe(true);
      });
    }
  });

  it('should search by product name', async () => {
    const res = await request(app).get('/api/v1/products?search=Dinner+Set');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── Product by slug ───────────────────────────────────────────────────────────
describe('GET /api/v1/products/:slug — Public slug retrieval', () => {
  it('should retrieve product by slug', async () => {
    const res = await request(app).get('/api/v1/products/test-product-dinner-set');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('test-product-dinner-set');
  });

  it('should return 404 for non-existent slug', async () => {
    const res = await request(app).get('/api/v1/products/does-not-exist-at-all');
    expect(res.status).toBe(404);
  });
});

// ── Product update ────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/products/:id', () => {
  it('should update product fields', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mrp: 1999, isFeatured: false });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.mrp)).toBe(1999);
    expect(res.body.data.isFeatured).toBe(false);
  });

  it('should return 404 for non-existent product', async () => {
    const res = await request(app)
      .put('/api/v1/admin/products/nonexistentid000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mrp: 100 });
    expect(res.status).toBe(404);
  });
});

// ── Product delete ────────────────────────────────────────────────────────────
describe('DELETE /api/v1/admin/products/:id', () => {
  it('should delete the product', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('should return 404 for already deleted product', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
