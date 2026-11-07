import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { Sale, SaleStatus } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, Modal, PageHeader, Pager, Select, Table, Textarea, useAdminList } from '@/components/admin/ui';

const STATUSES: SaleStatus[] = ['QUOTE', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'];
interface Line { productName: string; quantity: number; unitPrice: number }
const emptyLine = (): Line => ({ productName: '', quantity: 1, unitPrice: 0 });

export default function SalesPage() {
  const { adminRequest } = useAuth();
  const [page, setPage] = useState(1);
  const { items, pagination, loading, error, reload, setError } = useAdminList<Sale>(`/admin/sales?page=${page}&pageSize=20`);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerName: '', companyName: '', phone: '', email: '', notes: '' });
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.productName.trim() && l.quantity > 0);
    if (!form.customerName.trim() || valid.length === 0) {
      setError('Customer name and at least one line item are required.');
      return;
    }
    try {
      await adminRequest('/admin/sales', {
        method: 'POST',
        body: {
          customerName: form.customerName.trim(),
          companyName: form.companyName || null,
          phone: form.phone || null,
          email: form.email || null,
          notes: form.notes || null,
          items: valid,
        },
      });
      setOpen(false);
      setForm({ customerName: '', companyName: '', phone: '', email: '', notes: '' });
      setLines([emptyLine()]);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const setStatus = async (id: string, status: SaleStatus) => {
    try {
      await adminRequest(`/admin/sales/${id}`, { method: 'PUT', body: { status } });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (s: Sale) => {
    if (!confirm(`Delete sale ${s.saleNumber}?`)) return;
    try {
      await adminRequest(`/admin/sales/${s.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const escHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const printBill = (s: Sale) => {
    const win = window.open('', '_blank', 'width=820,height=760,noopener,noreferrer');
    if (!win) return;
    const rows = (s.items ?? [])
      .map(
        (it, idx) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #ddd;">${idx + 1}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #ddd;"><strong>${escHtml(it.productName)}</strong>${it.productCode ? `<br><small style="color:#666;">Code: ${escHtml(it.productCode)}</small>` : ''}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${Number(it.quantity || 0)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">₹${Number(it.unitPrice || 0).toLocaleString('en-IN')}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;font-weight:600;">₹${(Number(it.quantity || 1) * Number(it.unitPrice || 0)).toLocaleString('en-IN')}</td></tr>`,
      )
      .join('');
    win.document.open();
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill ${escHtml(s.saleNumber)} - Neha Crockery House</title>` +
        `<style>body{font-family:Arial,sans-serif;color:#1a2744;margin:28px;line-height:1.5}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a2744;padding-bottom:14px;margin-bottom:16px}.pickup{background:#fff8e6;border:1px solid #e6c97a;padding:10px 14px;border-radius:6px;margin:14px 0;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#1a2744;color:#fff;padding:8px;text-align:left;font-size:13px}@media print{.no-print{display:none}}</style></head><body>` +
        `<div class="no-print" style="text-align:right;margin-bottom:12px;"><button onclick="window.print()" style="padding:8px 16px;background:#1a2744;color:#fff;border:0;border-radius:4px;cursor:pointer;font-weight:600;">🖨️ Print / Save Bill PDF</button></div>` +
        `<div class="hdr"><div><h2 style="margin:0 0 4px;">Neha Crockery House</h2><div style="font-size:12px;color:#444;">13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai, Tamil Nadu 600003<br>Phone: +91 97102 54681</div></div>` +
        `<div style="text-align:right;"><div style="font-size:11px;color:#666;text-transform:uppercase;">Official Admin & Customer Bill</div><div style="font-size:18px;font-weight:700;color:#1a2744;margin:2px 0;">${escHtml(s.saleNumber)}</div><div style="font-size:12px;color:#555;">Date: ${escHtml(new Date(s.createdAt).toLocaleString('en-IN'))}</div></div></div>` +
        `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;"><div><strong>Billed To:</strong><br>${escHtml(s.customerName)}${s.companyName ? ` (${escHtml(s.companyName)})` : ''}${s.phone ? `<br>Phone: ${escHtml(s.phone)}` : ''}</div><div style="text-align:right;"><strong>Fulfillment:</strong> Store Pickup Only (No Delivery)<br><small>${escHtml(s.notes ?? '')}</small></div></div>` +
        `<div class="pickup"><strong>🏪 STORE PICKUP ONLY (NO DELIVERY OPTION):</strong> Showroom pickup at 13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai – 600003.</div>` +
        `<table><thead><tr><th>#</th><th>Product Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody>` +
        `<tfoot><tr><td colspan="4" style="padding:10px 8px;text-align:right;font-weight:700;font-size:15px;">Grand Total:</td><td style="padding:10px 8px;text-align:right;font-weight:700;font-size:15px;">₹${Number(s.totalAmount ?? 0).toLocaleString('en-IN')}</td></tr></tfoot></table></body></html>`,
    );
    win.document.close();
  };

  const patch = (i: number, p: Partial<Line>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  return (
    <>
      <PageHeader title="Sales & Orders" subtitle="Manually recorded B2B quotes and orders" actions={<Btn onClick={() => setOpen(true)}>+ New Sale</Btn>} />
      {error && <Alert>{error}</Alert>}
      <Card>
        <Table head={['Number', 'Customer', 'Items', 'Total', 'Status', 'Date', '']}>
          {loading && <tr><td className="p-4" colSpan={7}>Loading…</td></tr>}
          {items.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-semibold text-navy">{s.saleNumber}</td>
              <td className="px-4 py-3">{s.customerName}<div className="text-charcoal-lt">{s.companyName}</div></td>
              <td className="px-4 py-3">{s.items?.length ?? 0}</td>
              <td className="px-4 py-3">₹{Number(s.totalAmount ?? 0).toLocaleString('en-IN')}</td>
              <td className="px-4 py-3">
                <Badge>{s.status}</Badge>
                <Select className="mt-2" value={s.status} onChange={(e) => setStatus(s.id, e.target.value as SaleStatus)}>
                  {STATUSES.map((x) => <option key={x}>{x}</option>)}
                </Select>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <Btn variant="outline" onClick={() => printBill(s)}>Print Bill</Btn>
                <Btn variant="danger" onClick={() => remove(s)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
        <Pager p={pagination} onPage={setPage} />
      </Card>
      {open && (
        <Modal title="New Sale" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer name *"><Input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
              <Field label="Company"><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold">Line items</div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_auto] gap-2">
                  <Input placeholder="Product" value={l.productName} onChange={(e) => patch(i, { productName: e.target.value })} />
                  <Input type="number" min={1} value={l.quantity} onChange={(e) => patch(i, { quantity: Number(e.target.value) })} />
                  <Input type="number" min={0} step="0.01" value={l.unitPrice} onChange={(e) => patch(i, { unitPrice: Number(e.target.value) })} />
                  <Btn variant="outline" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>×</Btn>
                </div>
              ))}
              <Btn variant="outline" onClick={() => setLines([...lines, emptyLine()])}>+ Add line</Btn>
              <div className="text-sm font-semibold text-navy">Total: ₹{total.toLocaleString('en-IN')}</div>
            </div>
            <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <Btn type="submit">Create sale</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}

