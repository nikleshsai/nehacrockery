// ─────────────────────────────────────────────────────────────────────────────
// Zod validators for public checkout orders and admin sales endpoints
// Fixes: H2, M1, M2, B5
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';
import { SaleStatus } from '@prisma/client';

export const publicOrderItemSchema = z.object({
  productId: z.string().max(100).optional().nullable(),
  slug: z.string().max(255).optional().nullable(),
  productName: z.string().trim().min(1, 'Product name is required').max(255),
  productCode: z.string().trim().max(100).optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10_000, 'Quantity exceeds limit'),
  unitPrice: z.number().nonnegative().max(10_000_000).optional(),
});

export const initiateOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  phone: z
    .string()
    .trim()
    .min(7, 'Valid phone number is required')
    .max(20)
    .regex(/^[+\d][\d\s\-()]{6,19}$/, 'Invalid phone number format'),
  companyName: z.string().trim().max(150).optional().nullable(),
  email: z.string().trim().email('Invalid email address').max(150).optional().or(z.literal('')).nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(publicOrderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(100, 'Order cannot exceed 100 line items'),
});

export const completeOrderSchema = initiateOrderSchema.extend({
  orderToken: z.string().max(2048).optional().nullable(),
  paymentMethod: z.string().trim().max(60).optional().nullable(),
  razorpayOrderId: z.string().trim().max(120).optional().nullable(),
  razorpayPaymentId: z.string().trim().max(120).optional().nullable(),
  razorpaySignature: z.string().trim().max(256).optional().nullable(),
});

export const billLookupQuerySchema = z.object({
  token: z.string().trim().max(256).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const adminSaleItemSchema = z.object({
  productName: z.string().trim().min(1, 'Product name is required').max(255),
  productCode: z.string().trim().max(100).optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100_000),
  unitPrice: z.number().nonnegative('Unit price cannot be negative').max(10_000_000),
  discount: z.number().nonnegative('Discount cannot be negative').max(10_000_000).optional().default(0),
});

export const createAdminSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  customerName: z.string().trim().min(1, 'Customer name is required').max(150),
  companyName: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().min(5, 'Phone is required').max(25),
  email: z.string().trim().email().max(150).optional().or(z.literal('')).nullable(),
  items: z.array(adminSaleItemSchema).min(1, 'At least one item is required').max(200),
  discountAmount: z.number().nonnegative().max(10_000_000).optional().default(0),
  taxAmount: z.number().nonnegative().max(10_000_000).optional().default(0),
  status: z.nativeEnum(SaleStatus).optional().default(SaleStatus.QUOTE),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateAdminSaleSchema = createAdminSaleSchema.partial();

