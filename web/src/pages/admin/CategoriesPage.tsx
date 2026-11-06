import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { Category } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, Modal, PageHeader, Table, Textarea, useAdminList } from '@/components/admin/ui';

export default function CategoriesPage() {
  const { adminRequest } = useAuth();
  const { items, loading, error, reload, setError } = useAdminList<Category>('/admin/categories');
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body = {
      name: editing.name,
      description: editing.description || null,
      sortOrder: Number(editing.sortOrder ?? 0),
      isActive: editing.isActive ?? true,
    };
    try {
      if (editing.id) await adminRequest(`/admin/categories/${editing.id}`, { method: 'PUT', body });
      else await adminRequest('/admin/categories', { method: 'POST', body });
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await adminRequest(`/admin/categories/${c.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <PageHeader title="Categories" actions={<Btn onClick={() => setEditing({ isActive: true, sortOrder: 0 })}>+ Add Category</Btn>} />
      {error && <Alert>{error}</Alert>}
      <Card>
        <Table head={['Name', 'Slug', 'Products', 'Order', 'Status', '']}>
          {loading && <tr><td className="p-4" colSpan={6}>Loading…</td></tr>}
          {items.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-semibold text-navy">{c.name}</td>
              <td className="px-4 py-3">{c.slug}</td>
              <td className="px-4 py-3">{c._count?.products ?? 0}</td>
              <td className="px-4 py-3">{c.sortOrder}</td>
              <td className="px-4 py-3"><Badge tone={c.isActive ? 'green' : 'neutral'}>{c.isActive ? 'Active' : 'Hidden'}</Badge></td>
              <td className="px-4 py-3 text-right space-x-2">
                <Btn variant="outline" onClick={() => setEditing(c)}>Edit</Btn>
                <Btn variant="danger" onClick={() => remove(c)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      {editing && (
        <Modal title={editing.id ? 'Edit Category' : 'New Category'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name *"><Input required value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Description"><Textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Sort order"><Input type="number" min={0} value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <Btn type="submit">Save</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}

