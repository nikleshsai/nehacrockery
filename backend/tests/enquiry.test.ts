// ─────────────────────────────────────────────────────────────────────────────
// Enquiry tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

afterAll(async () => {
  await prisma.enquiry.deleteMany({ where: { name: 'Test Enquiry Person' } });
  await prisma.$disconnect();
});

describe('POST /api/v1/enquiries', () => {
  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ message: 'No name or phone' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({ name: 'Test Person', phone: 'abc', customerType: 'RETAILER' });
    expect(res.status).toBe(400);
  });

  it('should create enquiry successfully', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({
        name: 'Test Enquiry Person',
        phone: '+91 97102 54681',
        email: 'test@example.com',
        customerType: 'WHOLESALER',
        message: 'Please send me your latest catalogue',
        companyName: 'Test Company Pvt Ltd',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Enquiry Person');
    expect(res.body.data.status).toBe('NEW');
  });
});

describe('POST /api/v1/catalogue-requests', () => {
  it('should create catalogue request', async () => {
    const res = await request(app)
      .post('/api/v1/catalogue-requests')
      .send({
        name: 'Test Enquiry Person',
        phone: '9876543210',
        customerType: 'HOTEL',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
