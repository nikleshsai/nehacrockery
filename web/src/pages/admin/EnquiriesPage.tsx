import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { Enquiry, EnquiryStatus } from '@/lib/types';
import { Alert, Badge, Card, PageHeader, Pager, Select, Table, useAdminList } from '@/components/admin/ui';

const STATUSES: EnquiryStatus[] = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
const tone = (s: EnquiryStatus) =>
  ({ NEW: 'amber', CONTACTED: 'blue', IN_PROGRESS: 'blue', COMPLETED: 'green', CLOSED: 'neutral' } as const)[s];

export default function EnquiriesPage() {
  const { adminRequest } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { items, pagination, loading, error, reload, setError } = useAdminList<Enquiry>(
    `/admin/enquiries?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`,
  );

  const update = async (id: string, next: EnquiryStatus) => {
    try {
      await adminRequest(`/admin/enquiries/${id}`, { method: 'PUT', body: { status: next } });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle="Customer enquiries and website orders"
        actions={
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        }
      />
      {error && <Alert>{error}</Alert>}
      <Card>
        <Table head={['Date', 'Customer', 'Phone', 'Source', 'Message', 'Status']}>
          {loading && <tr><td className="p-4" colSpan={6}>Loading…</td></tr>}
          {!loading && items.length === 0 && <tr><td className="p-4 text-charcoal-lt" colSpan={6}>No enquiries.</td></tr>}
          {items.map((e) => (
            <tr key={e.id} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-navy">{e.name}</div>
                <div className="text-charcoal-lt">{e.companyName}</div>
                {e.email && <div className="text-charcoal-lt">{e.email}</div>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{e.phone}</td>
              <td className="px-4 py-3"><Badge>{e.source ?? 'web'}</Badge></td>
              <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">
                {e.product?.name && <div className="font-semibold">{e.product.name}</div>}
                {e.message}
              </td>
              <td className="px-4 py-3">
                <Badge tone={tone(e.status)}>{e.status}</Badge>
                <Select className="mt-2" value={e.status} onChange={(ev) => update(e.id, ev.target.value as EnquiryStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </td>
            </tr>
          ))}
        </Table>
        <Pager p={pagination} onPage={setPage} />
      </Card>
    </>
  );
}

