import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { ShopMedia } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, PageHeader, Table, useAdminList } from '@/components/admin/ui';

export default function ShopMediaPage() {
  const { adminRequest } = useAuth();
  const { items, loading, error, reload, setError } = useAdminList<ShopMedia>('/admin/shop-media');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Choose an image or video file.');
      return;
    }
    const fd = new FormData();
    if (title) fd.append('title', title);
    fd.append('file', file);
    setBusy(true);
    try {
      await adminRequest('/admin/shop-media', { method: 'POST', formData: fd });
      setTitle(''); setFile(null);
      (e.target as HTMLFormElement).reset();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (m: ShopMedia) => {
    try {
      await adminRequest(`/admin/shop-media/${m.id}`, { method: 'PUT', body: { isActive: !m.isActive } });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (m: ShopMedia) => {
    if (!confirm('Delete this item?')) return;
    try {
      await adminRequest(`/admin/shop-media/${m.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <PageHeader title="Shop Gallery" subtitle="Showroom photos and videos shown on the Contact page" />
      {error && <Alert>{error}</Alert>}
      <Card className="mb-6">
        <form onSubmit={upload} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Field label="Caption"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Image / video *"><Input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          <Btn type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Btn>
        </form>
      </Card>
      <Card>
        <Table head={['Preview', 'Caption', 'Type', 'Status', '']}>
          {loading && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
          {items.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3">
                {m.mediaType === 'image'
                  ? <img src={m.mediaUrl} alt={m.title ?? ''} className="h-14 w-14 object-cover rounded" />
                  : <span>▶ video</span>}
              </td>
              <td className="px-4 py-3">{m.title ?? '—'}</td>
              <td className="px-4 py-3"><Badge>{m.mediaType}</Badge></td>
              <td className="px-4 py-3"><Badge tone={m.isActive ? 'green' : 'neutral'}>{m.isActive ? 'Visible' : 'Hidden'}</Badge></td>
              <td className="px-4 py-3 text-right space-x-2">
                <Btn variant="outline" onClick={() => toggle(m)}>{m.isActive ? 'Hide' : 'Show'}</Btn>
                <Btn variant="danger" onClick={() => remove(m)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

