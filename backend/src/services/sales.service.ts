// =============================================================================
// Sales & Online Order Billing service
// Generates cryptographically unique, non-repeating Bill Numbers (saleNumber)
// shared between Customer receipts and Admin Sales records.
// Fixes: C1, M1, M2, B4, B6, B9
// =============================================================================
import crypto from 'node:crypto';
import { Prisma, SaleStatus } from '@prisma/client';
import prisma from '../config/database';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
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

function timingSafeHexEqual(expectedHex: string, providedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(providedHex, 'hex');
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

interface SignedOrderPayload {
  billNumber: string;
  razorpayOrderId: string | null;
  amountPaise: number;
  itemsDigest: string;
  exp: number;
}

function computeItemsDigest(
  items: Array<{ productId: string | null; quantity: number; unitPrice: number }>,
): string {
  const canonical = items
    .map((it) => `${it.productId ?? ''}:${it.quantity}:${it.unitPrice.toFixed(2)}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function signOrderToken(payload: SignedOrderPayload): string {
  const dataB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', config.security.orderTokenSecret)
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${sig}`;
}

function verifyOrderToken(token: string): SignedOrderPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [dataB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', config.security.orderTokenSecret)
    .update(dataB64)
    .digest();
  const actualSig = Buffer.from(sigB64, 'base64url');
  if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8')) as SignedOrderPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates an HMAC token granting read access to a specific bill receipt (M1).
 */
export function signBillAccessToken(billNumber: string): string {
  return crypto
    .createHmac('sha256', config.security.orderTokenSecret)
    .update(`bill:${billNumber.trim().toUpperCase()}`)
    .digest('hex');
}

function normalizePhoneDigits(phone?: string | null): string {
  const digits = String(phone ?? '').replace(/\D+/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
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

  return `NCH-BILL-${datePart}-${randomAlphanumeric(8)}`;
}

export interface SaleItemInput {
  productId?: string | null;
  slug?: string | null;
  productName: string;
  productCode?: string | null;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateSaleInput {
  customerId?: string | null;
  customerName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  discountAmount?: number;
  taxAmount?: number;
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
  const totalAmount = data.items.reduce(
    (sum, item) => sum + Math.max(0, item.quantity * (item.unitPrice ?? 0)),
    0,
  );

  // B6: Retry on P2002 unique constraint collision for saleNumber
  for (let attempt = 0; attempt < 4; attempt++) {
    const saleNumber = await generateUniqueBillNumber();
    try {
      return await prisma.sale.create({
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
            create: data.items.map((item) => {
              const unitPrice = item.unitPrice ?? 0;
              return {
                productId: item.productId ?? null,
                productName: item.productName,
                productCode: item.productCode ?? null,
                quantity: item.quantity,
                unitPrice,
                total: Math.max(0, item.quantity * unitPrice),
              };
            }),
          },
        },
        select: saleSelect,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 3
      ) {
        continue;
      }
      throw err;
    }
  }

  throw AppError.internal('Could not generate a unique sale number');
}

export async function updateSale(
  id: string,
  data: Partial<Omit<CreateSaleInput, 'items'>> & { status?: SaleStatus; items?: SaleItemInput[] },
) {
  const existing = await prisma.sale.findUnique({
    where: { id },
    select: { id: true, totalAmount: true },
  });
  if (!existing) throw AppError.notFound('Sale');

  const updateData: Record<string, unknown> = {};
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // B4: Wrap item replacement and sale header update in an atomic transaction
  return prisma.$transaction(async (tx) => {
    if (data.items) {
      const totalAmount = data.items.reduce(
        (sum, item) => sum + Math.max(0, item.quantity * (item.unitPrice ?? 0)),
        0,
      );
      updateData.totalAmount = totalAmount;

      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.saleItem.createMany({
        data: data.items.map((item) => {
          const unitPrice = item.unitPrice ?? 0;
          return {
            saleId: id,
            productId: item.productId ?? null,
            productName: item.productName,
            productCode: item.productCode ?? null,
            quantity: item.quantity,
            unitPrice,
            total: Math.max(0, item.quantity * unitPrice),
          };
        }),
      });
    }

    return tx.sale.update({ where: { id }, data: updateData, select: saleSelect });
  });
}

export async function deleteSale(id: string) {
  const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('Sale');
  await prisma.sale.delete({ where: { id } });
}

export async function getSaleStats() {
  const earnedStatuses: SaleStatus[] = [
    SaleStatus.CONFIRMED,
    SaleStatus.PROCESSING,
    SaleStatus.DELIVERED,
  ];

  // B9: Exclude CANCELLED and QUOTE records from totalRevenue
  const [totalCount, earnedAgg, byStatus] = await prisma.$transaction([
    prisma.sale.count(),
    prisma.sale.aggregate({
      where: { status: { in: earnedStatuses } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { status: 'desc' } },
    }),
  ]);

  return {
    totalSales: totalCount,
    totalRevenue: earnedAgg._sum.totalAmount ?? 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: typeof s._count === 'object' && s._count !== null ? s._count._all : 0,
      revenue: s._sum?.totalAmount ?? 0,
    })),
  };
}

// ── PUBLIC ONLINE CHECKOUT (STORE PICKUP ONLY + RAZORPAY / ONLINE PAYMENT) ───

export interface PublicOrderInput {
  orderToken?: string | null;
  customerName: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  notes?: string | null;
  items: SaleItemInput[];
  paymentMethod?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
}

interface ResolvedOrderLineItem {
  productId: string;
  productName: string;
  productCode: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * C1: Resolves all cart items against active products in the database and computes
 * authoritative server-side prices (`websitePrice ?? mrp ?? catalogueMrp`).
 * Never trusts client-supplied `unitPrice`.
 */
async function resolvePublicOrderItems(items: SaleItemInput[]): Promise<ResolvedOrderLineItem[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('At least one item is required');
  }
  if (items.length > 100) {
    throw AppError.badRequest('Order cannot exceed 100 line items');
  }

  const resolved: ResolvedOrderLineItem[] = [];

  for (const item of items) {
    const qty = Math.round(Number(item.quantity) || 0);
    if (qty < 1 || qty > 10_000) {
      throw AppError.badRequest(`Invalid quantity for "${item.productName || 'item'}"`);
    }

    const orFilters: Prisma.ProductWhereInput[] = [];
    if (item.productId?.trim()) {
      orFilters.push({ id: item.productId.trim() });
      orFilters.push({ slug: item.productId.trim() });
    }
    if (item.slug?.trim()) {
      orFilters.push({ slug: item.slug.trim() });
    }
    if (item.productCode?.trim()) {
      orFilters.push({ productCode: { equals: item.productCode.trim(), mode: 'insensitive' } });
    }
    if (item.productName?.trim()) {
      orFilters.push({ name: { equals: item.productName.trim(), mode: 'insensitive' } });
    }

    if (orFilters.length === 0) {
      throw AppError.badRequest('Each order item must identify a valid product');
    }

    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: orFilters,
      },
      select: {
        id: true,
        name: true,
        productCode: true,
        websitePrice: true,
        mrp: true,
        catalogueMrp: true,
      },
    });

    if (!product) {
      throw AppError.badRequest(
        `Product "${item.productName || item.productCode || 'Unknown'}" is unavailable or inactive`,
      );
    }

    const serverPrice = Number(product.websitePrice ?? product.mrp ?? product.catalogueMrp ?? 0);
    if (!Number.isFinite(serverPrice) || serverPrice <= 0) {
      throw AppError.badRequest(
        `Product "${product.name}" is available by wholesale quote only and cannot be purchased directly`,
      );
    }

    resolved.push({
      productId: product.id,
      productName: product.name,
      productCode: product.productCode ?? null,
      quantity: qty,
      unitPrice: serverPrice,
      total: Number((qty * serverPrice).toFixed(2)),
    });
  }

  return resolved;
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

  // C1: Compute authoritative total from active DB products
  const resolvedItems = await resolvePublicOrderItems(input.items);
  const totalAmount = Number(
    resolvedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2),
  );
  const amountPaise = Math.max(100, Math.round(totalAmount * 100));
  const itemsDigest = computeItemsDigest(resolvedItems);

  const billNumber = await generateUniqueBillNumber();
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
    const orderToken = signOrderToken({
      billNumber,
      razorpayOrderId: rzpOrder.id,
      amountPaise,
      itemsDigest,
      exp: Date.now() + 30 * 60 * 1000,
    });

    return {
      billNumber,
      orderToken,
      mode: 'razorpay' as const,
      razorpayKeyId: keyId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      totalAmount,
      currency: rzpOrder.currency || 'INR',
    };
  }

  const orderToken = signOrderToken({
    billNumber,
    razorpayOrderId: null,
    amountPaise,
    itemsDigest,
    exp: Date.now() + 30 * 60 * 1000,
  });

  return {
    billNumber,
    orderToken,
    mode: 'cash_pickup_only' as const,
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

  // C1: Always resolve product prices server-side
  const normalizedItems = await resolvePublicOrderItems(input.items);
  const totalAmount = Number(
    normalizedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2),
  );
  const amountPaise = Math.max(100, Math.round(totalAmount * 100));
  const itemsDigest = computeItemsDigest(normalizedItems);

  const requestedMethod = (input.paymentMethod ?? '').trim();
  const isCashOrder = requestedMethod.toLowerCase().includes('cash');

  const verifiedTokenPayload = input.orderToken ? verifyOrderToken(input.orderToken) : null;

  let paymentRef: string;
  let paymentMethod: string;
  let saleStatus: SaleStatus;
  let paymentStatusLabel: string;

  if (isCashOrder) {
    // Cash at Store Pickup order — recorded as QUOTE until cash is collected at showroom
    paymentMethod = 'Cash at Store Pickup';
    paymentRef = `CASH-${randomAlphanumeric(8)}`;
    saleStatus = SaleStatus.QUOTE;
    paymentStatusLabel = `PAY BY CASH AT STORE PICKUP (${paymentMethod})`;
  } else {
    // C1: Online payment requires configured Razorpay secret + valid HMAC signature
    const keySecret = config.razorpay.keySecret;
    const keyId = config.razorpay.keyId;
    if (!keyId || !keySecret) {
      throw AppError.badRequest(
        'Online payment gateway is not configured; please use Pay by Cash at Store Pickup',
      );
    }

    const rzpOrderId = input.razorpayOrderId?.trim();
    const rzpPaymentId = input.razorpayPaymentId?.trim();
    const rzpSignature = input.razorpaySignature?.trim();

    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      throw AppError.badRequest('Verified Razorpay payment credentials are required');
    }

    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    if (!timingSafeHexEqual(expectedSig, rzpSignature)) {
      throw AppError.unauthorized('Payment signature verification failed');
    }

    // Verify the Razorpay Order matches the server-computed cart total & items
    if (verifiedTokenPayload) {
      if (
        verifiedTokenPayload.razorpayOrderId !== rzpOrderId ||
        verifiedTokenPayload.amountPaise !== amountPaise ||
        verifiedTokenPayload.itemsDigest !== itemsDigest
      ) {
        throw AppError.badRequest('Order items or amount do not match the initiated payment');
      }
    } else {
      // Fallback verification against Razorpay Orders API if orderToken was omitted
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const orderResp = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(rzpOrderId)}`,
        {
          method: 'GET',
          headers: { Authorization: authHeader },
        },
      );
      if (!orderResp.ok) {
        throw AppError.badRequest('Unable to verify Razorpay order with payment gateway');
      }
      const orderData = (await orderResp.json()) as { amount?: number; currency?: string };
      if (orderData.amount !== amountPaise || (orderData.currency && orderData.currency !== 'INR')) {
        throw AppError.badRequest('Paid amount does not match server order total');
      }
    }

    // C1: Replay protection — reject if razorpayPaymentId or razorpayOrderId was already recorded
    const existingReplay = await prisma.sale.findFirst({
      where: {
        OR: [
          { notes: { contains: `Payment Ref: ${rzpPaymentId}` } },
          { notes: { contains: `Razorpay Order: ${rzpOrderId}` } },
        ],
      },
      select: { id: true },
    });
    if (existingReplay) {
      throw AppError.conflict('This payment has already been processed');
    }

    paymentRef = rzpPaymentId;
    paymentMethod = 'Razorpay Online';
    saleStatus = SaleStatus.CONFIRMED;
    paymentStatusLabel = `PAID ONLINE (${paymentMethod})`;
  }

  const notes = [
    `Fulfillment: Store Pickup Only (No Delivery Option)`,
    `Payment Status: ${paymentStatusLabel}`,
    `Payment Ref: ${paymentRef}`,
    !isCashOrder && input.razorpayOrderId ? `Razorpay Order: ${input.razorpayOrderId.trim()}` : null,
    input.notes?.trim() ? `Customer Notes: ${input.notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  // M2 & B6: Only use server-generated billNumber (from verified orderToken or freshly generated)
  // and retry automatically on P2002 collision
  let sale: Awaited<ReturnType<typeof getSaleById>> | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const candidateBill =
      attempt === 0 && verifiedTokenPayload?.billNumber
        ? verifiedTokenPayload.billNumber
        : await generateUniqueBillNumber();

    try {
      sale = await prisma.sale.create({
        data: {
          saleNumber: candidateBill,
          customerName: input.customerName.trim(),
          companyName: input.companyName?.trim() || null,
          phone: input.phone.trim(),
          email: input.email?.trim() || null,
          notes,
          status: saleStatus,
          totalAmount,
          createdBy: 'Online Customer Order',
          items: {
            create: normalizedItems,
          },
        },
        select: saleSelect,
      });
      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 3
      ) {
        continue;
      }
      throw err;
    }
  }

  if (!sale) {
    throw AppError.internal('Failed to create order bill');
  }

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
          `PAYMENT: ${paymentStatusLabel} — Ref: ${paymentRef}`,
          `FULFILLMENT: Store Pickup Only (No Delivery Option)`,
          ...summaryLines,
          `${isCashOrder ? 'TOTAL PAYABLE (CASH AT PICKUP)' : 'TOTAL PAID'}: ₹${totalAmount.toFixed(2)}`,
        ].join('\n'),
      },
    });
  } catch {
    // Non-fatal if enquiry mirror fails
  }

  const business = await getPaymentConfig();
  const billAccessToken = signBillAccessToken(sale.saleNumber);

  return {
    billNumber: sale.saleNumber,
    billAccessToken,
    sale,
    paymentRef,
    paymentMethod,
    fulfillment: 'Store Pickup Only — No Delivery Option',
    business,
  };
}

/**
 * M1: Public bill lookup requires either a signed `token` (`billAccessToken`)
 * or a matching customer `phone` number to prevent unauthenticated PII scraping.
 */
export async function getBillByNumber(
  billNumber: string,
  verification?: { token?: string; phone?: string },
) {
  const normalizedBillNo = billNumber.trim().toUpperCase();
  const sale = await prisma.sale.findUnique({
    where: { saleNumber: normalizedBillNo },
    select: saleSelect,
  });
  if (!sale) {
    throw AppError.notFound('Bill');
  }

  const providedToken = verification?.token?.trim();
  const providedPhone = verification?.phone?.trim();

  let authorized = false;
  if (providedToken) {
    const expectedToken = signBillAccessToken(sale.saleNumber);
    authorized = timingSafeHexEqual(expectedToken, providedToken);
  }
  if (!authorized && providedPhone && sale.phone) {
    const reqDigits = normalizePhoneDigits(providedPhone);
    const saleDigits = normalizePhoneDigits(sale.phone);
    if (reqDigits.length >= 7 && reqDigits === saleDigits) {
      authorized = true;
    }
  }

  if (!authorized) {
    throw AppError.forbidden(
      'Bill verification token or matching customer phone number is required to view this bill',
    );
  }

  const business = await getPaymentConfig();
  return {
    billNumber: sale.saleNumber,
    sale,
    fulfillment: 'Store Pickup Only — No Delivery Option',
    business,
  };
}
