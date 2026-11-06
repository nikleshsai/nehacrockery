import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { Brand } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, Modal, PageHeader, Table, Textarea, useAdminList } from '@/components/admin/ui';

export default function BrandsAdminPage() {
  const { adminRequest } = useAuth();
  const { items, loading, error, reload, setError } = useAdminList<Brand>('/admin/brands');
  const [editing, setEditing] = useState<Partial<Brand> | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body = {
      name: editing.name,
      description: editing.description || null,
      website: editing.website || null,
      logo: editing.logo || null,
      isOwnBrand: editing.isOwnBrand ?? false,
      sortOrder: Number(editing.sortOrder ?? 0),
      isActive: editing.isActive ?? true,
    };
    try {
      if (editing.id) await adminRequest(`/admin/brands/${editing.id}`, { method: 'PUT', body });
      else await adminRequest('/admin/brands', { method: 'POST', body });
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const remove = async (b: Brand) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    try {
      await adminRequest(`/admin/brands/${b.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <PageHeader title="Brands" actions={<Btn onClick={() => setEditing({ isActive: true, sortOrder: 0, isOwnBrand: false })}>+ Add Brand</Btn>} />
      {error && <Alert>{error}</Alert>}
      <Card>
        <Table head={['Name', 'Products', 'Type', 'Order', 'Status', '']}>
          {loading && <tr><td className="p-4" colSpan={6}>Loading…</td></tr>}
          {items.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-semibold text-navy">{b.name}</td>
              <td className="px-4 py-3">{b._count?.products ?? 0}</td>
              <td className="px-4 py-3">{b.isOwnBrand ? <Badge tone="amber">Own brand</Badge> : <Badge>Stocked</Badge>}</td>
              <td className="px-4 py-3">{b.sortOrder}</td>
              <td className="px-4 py-3"><Badge tone={b.isActive ? 'green' : 'neutral'}>{b.isActive ? 'Active' : 'Hidden'}</Badge></td>
              <td className="px-4 py-3 text-right space-x-2">
                <Btn variant="outline" onClick={() => setEditing(b)}>Edit</Btn>
                <Btn variant="danger" onClick={() => remove(b)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      {editing && (
        <Modal title={editing.id ? 'Edit Brand' : 'New Brand'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name *"><Input required value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Logo URL"><Input value={editing.logo ?? ''} onChange={(e) => setEditing({ ...editing, logo: e.target.value })} /></Field>
            <Field label="Website"><Input type="url" value={editing.website ?? ''} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></Field>
            <Field label="Description"><Textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Sort order"><Input type="number" min={0} value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
            <div className="flex gap-6 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.isOwnBrand ?? false} onChange={(e) => setEditing({ ...editing, isOwnBrand: e.target.checked })} /> Own brand</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
            <Btn type="submit">Save</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}

