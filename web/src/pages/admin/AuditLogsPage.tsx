import { useState } from 'react';
import type { AuditLog } from '@/lib/types';
import { Alert, Badge, Card, PageHeader, Pager, Table, useAdminList } from '@/components/admin/ui';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const { items, pagination, loading, error } = useAdminList<AuditLog>(`/admin/audit-logs?page=${page}&pageSize=25`);
  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Who changed what, and when" />
      {error && <Alert>{error}</Alert>}
      <Card>
        <Table head={['When', 'User', 'Action', 'Entity', 'Details']}>
          {loading && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
          {items.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
              <td className="px-4 py-3">{l.userName || l.userEmail || '—'}</td>
              <td className="px-4 py-3"><Badge>{l.action}</Badge></td>
              <td className="px-4 py-3">{l.entity}</td>
              <td className="px-4 py-3">{l.details}</td>
            </tr>
          ))}
        </Table>
        <Pager p={pagination} onPage={setPage} />
      </Card>
    </>
  );
}

