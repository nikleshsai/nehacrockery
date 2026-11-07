// ─────────────────────────────────────────────────────────────────────────────
// Authentication tests (Supabase Auth token verification + RBAC mapping)
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

const ADMIN_EMAIL = 'test-admin@nehacrockery.com';
const INACTIVE_EMAIL = 'test-inactive@nehacrockery.com';
const adminToken = `test-token:${ADMIN_EMAIL}`;

beforeAll(async () => {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { isActive: true, authId: null },
    create: { name: 'Test Admin', email: ADMIN_EMAIL, role: 'SUPER_ADMIN', isActive: true },
  });
  await prisma.user.upsert({
    where: { email: INACTIVE_EMAIL },
    update: { isActive: false },
    create: { name: 'Inactive', email: INACTIVE_EMAIL, role: 'STAFF', isActive: false },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, INACTIVE_EMAIL] } } });
  await prisma.$disconnect();
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token Supabase rejects', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a valid Supabase user without a local admin record', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer test-token:stranger@example.com');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an inactive user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer test-token:${INACTIVE_EMAIL}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unverified Supabase email (H1)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer unverified-token:${ADMIN_EMAIL}`);
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid verified token and links auth_id', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN_EMAIL);
    expect(res.body.data).not.toHaveProperty('passwordHash');

    const linked = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    expect(linked?.authId).toBe(`auth-${ADMIN_EMAIL}`);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('succeeds for an authenticated admin', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/v1/auth/login (B7 / H4)', () => {
  it('validates email and password format with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns generic 401 Invalid email or password on failed login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
