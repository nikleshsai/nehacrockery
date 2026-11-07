// =============================================================================
// Sales controller — B2B manually-recorded orders
// =============================================================================
import { Request, Response } from 'express';
import * as salesService from '../services/sales.service';
import * as auditService from '../services/audit.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/apiResponse';
import { AuditAction } from '@prisma/client';

export async function adminListSales(req: Request, res: Response): Promise<void> {
  const { page, pageSize, status } = req.query as Record<string, string>;
  const { sales, pagination } = await salesService.listSales(page, pageSize, status);
  sendPaginated(res, sales, pagination);
}

export async function adminGetSale(req: Request, res: Response): Promise<void> {
  const sale = await salesService.getSaleById(req.params.id);
  sendSuccess(res, sale);
}

export async function adminCreateSale(req: Request, res: Response): Promise<void> {
  const sale = await salesService.createSale({
    ...req.body,
    createdBy: req.user?.name ?? req.user?.email ?? 'admin',
  });
  await auditService.auditFromRequest(req, AuditAction.CREATE, 'Sale', sale.id, `Created sale ${sale.saleNumber}`);
  sendCreated(res, sale, 'Sale created');
}

export async function adminUpdateSale(req: Request, res: Response): Promise<void> {
  const sale = await salesService.updateSale(req.params.id, req.body);
  await auditService.auditFromRequest(req, AuditAction.SALE_CHANGE, 'Sale', sale.id, `Updated sale ${sale.saleNumber} status to ${sale.status}`);
  sendSuccess(res, sale, 'Sale updated');
}

export async function adminDeleteSale(req: Request, res: Response): Promise<void> {
  const saleId = req.params.id;
  await salesService.deleteSale(saleId);
  await auditService.auditFromRequest(req, AuditAction.DELETE, 'Sale', saleId, 'Deleted sale');
  sendNoContent(res);
}

export async function adminGetSaleStats(_req: Request, res: Response): Promise<void> {
  const stats = await salesService.getSaleStats();
  sendSuccess(res, stats);
}

// ── PUBLIC ONLINE CHECKOUT & BILL ENDPOINTS ──────────────────────────────────

export async function getPaymentConfig(_req: Request, res: Response): Promise<void> {
  const cfg = await salesService.getPaymentConfig();
  sendSuccess(res, cfg);
}

export async function initiateOnlineOrder(req: Request, res: Response): Promise<void> {
  const result = await salesService.initiateOnlineOrder(req.body);
  sendSuccess(res, result, 'Order payment initialized');
}

export async function completeOnlineOrder(req: Request, res: Response): Promise<void> {
  const result = await salesService.completeOnlineOrder(req.body);
  sendCreated(res, result, `Order confirmed. Bill ${result.billNumber} generated.`);
}

export async function getBillByNumber(req: Request, res: Response): Promise<void> {
  const { token, phone } = req.query as { token?: string; phone?: string };
  const result = await salesService.getBillByNumber(req.params.billNumber, { token, phone });
  sendSuccess(res, result);
}
