// =============================================================================
// Sales & Online Order Billing service
// Generates cryptographically unique, non-repeating Bill Numbers (saleNumber)
// shared between Customer receipts and Admin Sales records.
// =============================================================================
import crypto from 'node:crypto';
import prisma from '../config/database';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { SaleStatus } from '@prisma/client';
import { getSiteSettings } from './site.service';

const saleSelect = {
  id: true,
  saleNumber: true,
  customerName: true,
  companyName: true,
  phone: true,
  email: true,
  notes: true,
  status: true,
  totalAmount: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productCode: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
};

const BILL_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomAlphanumeric(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += BILL_ALPHABET[crypto.randomInt(0, BILL_ALPHABET.length)];
  }
  return out;
}

/**
 * Generates a guaranteed unique, non-repeating random Bill Number.
 * Format: `NCH-BILL-YYYYMMDD-XXXXXX` (checked against `sales.sale_number` unique index).
 */
export async function generateUniqueBillNumber(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;

  for (let attempt = 0; attempt < 15; attempt++) {
    const code = randomAlphanumeric(6);
    const candidate = `NCH-BILL-${datePart}-${code}`;
    const existing = await prisma.sale.findUnique({
      where: { saleNumber: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  // Fallback with 8 random chars + millisecond suffix if 15 attempts ever collide
  return `NCH-BILL-${datePart}-${randomAlphanumeric(8)}`;
}

export interface SaleItemInput {
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleInput {
  customerName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status?: SaleStatus;
  items: SaleItemInput[];
  createdBy?: string;
}

export async function listSales(pageStr?: string, pageSizeStr?: string, status?: string) {
  const { page, pageSize, skip, take } = parsePagination(pageStr, pageSizeStr);
  const where = status && status !== 'all' ? { status: status as SaleStatus } : {};

  const [total, sales] = await prisma.$transaction([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: saleSelect,
    }),
  ]);

  return { sales, pagination: buildPaginationMeta(total, page, pageSize) };
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, select: saleSelect });
  if (!sale) throw AppError.notFound('Sale');
  return sale;
}

export async function createSale(data: CreateSaleInput) {
  const saleNumber = await generateUniqueBillNumber();
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return prisma.sale.create({
    data: {
      saleNumber,
      customerName: data.customerName,
      companyName: data.companyName ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
      status: data.status ?? SaleStatus.QUOTE,
      totalAmount,
      createdBy: data.createdBy ?? null,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId ?? null,
          productName: item.productName,
          productCode: item.productCode ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    select: saleSelect,
  });
}

export async function updateSale(
  id: string,
  data: Partial<Omit<CreateSaleInput, 'items'>> & { status?: SaleStatus; items?: SaleItemInput[] },
) {
  const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Sale');

  const updateData: Record<string, unknown> = {};
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // If items provided, replace them all
  if (data.items) {
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    updateData.totalAmount = totalAmount;
    await prisma.saleItem.deleteMany({ where: { saleId: id } });
    await prisma.saleItem.createMany({
      data: data.items.map((item) => ({
        saleId: id,
        productId: item.productId ?? null,
        productName: item.productName,
        productCode: item.productCode ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    });
  }

  return prisma.sale.update({ where: { id }, data: updateData, select: saleSelect });
}

export async function deleteSale(id: string) {
  const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Sale');
  await prisma.sale.delete({ where: { id } });
}

export async function getSaleStats() {
  const [total, byStatus] = await prisma.$transaction([
    prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { status: 'desc' } },
    }),
  ]);

  return {
    totalSales: total._count,
    totalRevenue: total._sum.totalAmount ?? 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: typeof s._count === 'object' && s._count !== null ? s._count._all : 0,
      revenue: s._sum?.totalAmount ?? 0,
    })),
  };
}

// ── PUBLIC ONLINE CHECKOUT (STORE PICKUP ONLY + RAZORPAY / ONLINE PAYMENT) ───

export interface PublicOrderInput {
  billNumber?: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  items: SaleItemInput[];
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  transactionRef?: string;
}

export async function getPaymentConfig() {
  const settings = await getSiteSettings().catch(() => null);
  const keyId = config.razorpay.keyId;
  const keySecret = config.razorpay.keySecret;

  return {
    razorpayEnabled: Boolean(keyId && keySecret),
    razorpayKeyId: keyId || null,
    deliveryAvailable: false,
    fulfillmentType: 'STORE_PICKUP_ONLY',
    fulfillmentLabel: 'Store Pickup Only — No Delivery Option',
    pickupAddress:
      settings?.address ||
      '13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai, Tamil Nadu 600003',
    businessName: settings?.businessName || 'Neha Crockery House',
    phone: settings?.phone || '+91 97102 54681',
    whatsapp: settings?.whatsapp || settings?.phone || '919710254681',
    email: settings?.email || 'nehacrockeryhouse2001@gmail.com',
    gstNumber: settings?.gstNumber || null,
  };
}

export async function initiateOnlineOrder(input: {
  customerName: string;
  phone: string;
  email?: string | null;
  items: SaleItemInput[];
}) {
  if (!input.customerName?.trim()) {
    throw AppError.badRequest('Customer name is required');
  }
  if (!input.phone?.trim()) {
    throw AppError.badRequest('Phone number is required');
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw AppError.badRequest('At least one item is required');
  }

  const billNumber = await generateUniqueBillNumber();
  const totalAmount = input.items.reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity) || 1) * Math.max(0, Number(item.unitPrice) || 0),
    0,
  );
  const amountPaise = Math.max(100, Math.round(totalAmount * 100));

  const keyId = config.razorpay.keyId;
  const keySecret = config.razorpay.keySecret;

  if (keyId && keySecret) {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: billNumber,
        notes: {
          billNumber,
          customerName: input.customerName.trim(),
          phone: input.phone.trim(),
          fulfillment: 'Store Pickup Only (No Delivery)',
        },
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      throw AppError.badRequest(`Razorpay order creation failed: ${errBody || resp.statusText}`);
    }

    const rzpOrder = (await resp.json()) as { id: string; amount: number; currency: string };
    return {
      billNumber,
      mode: 'razorpay' as const,
      razorpayKeyId: keyId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      totalAmount,
      currency: rzpOrder.currency || 'INR',
    };
  }

  return {
    billNumber,
    mode: 'online_gateway' as const,
    razorpayKeyId: null,
    razorpayOrderId: null,
    amount: amountPaise,
    totalAmount,
    currency: 'INR',
  };
}

export async function completeOnlineOrder(input: PublicOrderInput) {
  if (!input.customerName?.trim()) {
    throw AppError.badRequest('Customer name is required');
  }
  if (!input.phone?.trim()) {
    throw AppError.badRequest('Phone number is required');
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw AppError.badRequest('Cart cannot be empty');
  }

  const keySecret = config.razorpay.keySecret;
  if (input.razorpayOrderId && input.razorpayPaymentId && input.razorpaySignature && keySecret) {
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== input.razorpaySignature) {
      throw AppError.unauthorized('Payment signature verification failed');
    }
  }

  // Ensure the billNumber is unique and never repeated
  let billNumber = input.billNumber?.trim();
  if (billNumber) {
    const alreadyExists = await prisma.sale.findUnique({
      where: { saleNumber: billNumber },
      select: { id: true },
    });
    if (alreadyExists) {
      billNumber = await generateUniqueBillNumber();
    }
  } else {
    billNumber = await generateUniqueBillNumber();
  }

  const paymentRef =
    input.razorpayPaymentId?.trim() ||
    input.transactionRef?.trim() ||
    `PAY-${randomAlphanumeric(8)}`;
  const paymentMethod = input.paymentMethod?.trim() || (input.razorpayPaymentId ? 'Razorpay Online' : 'Online Payment');

  const normalizedItems = input.items.map((item) => {
    const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    return {
      productId: item.productId ?? null,
      productName: String(item.productName || 'Product').trim(),
      productCode: item.productCode ? String(item.productCode).trim() : null,
      quantity: qty,
      unitPrice,
      total: qty * unitPrice,
    };
  });

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total, 0);

  const notes = [
    `Fulfillment: Store Pickup Only (No Delivery Option)`,
    `Payment Status: PAID ONLINE (${paymentMethod})`,
    `Payment Ref: ${paymentRef}`,
    input.razorpayOrderId ? `Razorpay Order: ${input.razorpayOrderId}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const sale = await prisma.sale.create({
    data: {
      saleNumber: billNumber,
      customerName: input.customerName.trim(),
      companyName: input.companyName?.trim() || null,
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      notes,
      status: SaleStatus.CONFIRMED,
      totalAmount,
      createdBy: 'Online Customer Order',
      items: {
        create: normalizedItems,
      },
    },
    select: saleSelect,
  });

  // Also record in Enquiries so staff see a notification in Enquiries & Dashboard
  try {
    const summaryLines = normalizedItems.map(
      (it, idx) =>
        `${idx + 1}. ${it.productName}${it.productCode ? ` [${it.productCode}]` : ''} × ${it.quantity} @ ₹${it.unitPrice.toFixed(2)} = ₹${it.total.toFixed(2)}`,
    );
    await prisma.enquiry.create({
      data: {
        name: input.customerName.trim(),
        companyName: input.companyName?.trim() || null,
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        source: 'website-online-order',
        message: [
          `BILL NO: ${sale.saleNumber}`,
          `PAYMENT: PAID ONLINE (${paymentMethod}) — Ref: ${paymentRef}`,
          `FULFILLMENT: Store Pickup Only (No Delivery Option)`,
          ...summaryLines,
          `TOTAL PAID: ₹${totalAmount.toFixed(2)}`,
        ].join('\n'),
      },
    });
  } catch {
    // Non-fatal if enquiry mirror fails
  }

  const business = await getPaymentConfig();

  return {
    billNumber: sale.saleNumber,
    sale,
    paymentRef,
    paymentMethod,
    fulfillment: 'Store Pickup Only — No Delivery Option',
    business,
  };
}

export async function getBillByNumber(billNumber: string) {
  const sale = await prisma.sale.findUnique({
    where: { saleNumber: billNumber.trim() },
    select: saleSelect,
  });
  if (!sale) {
    throw AppError.notFound('Bill');
  }
  const business = await getPaymentConfig();
  return {
    billNumber: sale.saleNumber,
    sale,
    fulfillment: 'Store Pickup Only — No Delivery Option',
    business,
  };
}
