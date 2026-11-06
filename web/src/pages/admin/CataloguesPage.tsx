import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { Catalogue } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, PageHeader, Table, useAdminList } from '@/components/admin/ui';

export default function CataloguesPage() {
  const { adminRequest } = useAuth();
  const { items, loading, error, reload, setError } = useAdminList<Catalogue>('/admin/catalogues');
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Title and a PDF file are required.');
      return;
    }
    const fd = new FormData();
    fd.append('title', title.trim());
    if (version) fd.append('version', version);
    fd.append('file', file);
    setBusy(true);
    try {
      await adminRequest('/admin/catalogues', { method: 'POST', formData: fd });
      setTitle(''); setVersion(''); setFile(null);
      (e.target as HTMLFormElement).reset();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: Catalogue) => {
    try {
      await adminRequest(`/admin/catalogues/${c.id}`, { method: 'PUT', body: { isActive: !c.isActive } });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const remove = async (c: Catalogue) => {
    if (!confirm(`Delete catalogue "${c.title}"?`)) return;
    try {
      await adminRequest(`/admin/catalogues/${c.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <PageHeader title="Catalogues" subtitle="PDF catalogues available for public download" />
      {error && <Alert>{error}</Alert>}
      <Card className="mb-6">
        <form onSubmit={upload} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Field label="Title *"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Version"><Input value={version} onChange={(e) => setVersion(e.target.value)} /></Field>
          <Field label="PDF file *"><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          <Btn type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Btn>
        </form>
      </Card>
      <Card>
        <Table head={['Title', 'Version', 'Status', 'Uploaded', '']}>
          {loading && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
          {items.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3"><a className="font-semibold text-navy underline" href={c.fileUrl} target="_blank" rel="noreferrer">{c.title}</a></td>
              <td className="px-4 py-3">{c.version ?? '—'}</td>
              <td className="px-4 py-3"><Badge tone={c.isActive ? 'green' : 'neutral'}>{c.isActive ? 'Active' : 'Hidden'}</Badge></td>
              <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <Btn variant="outline" onClick={() => toggle(c)}>{c.isActive ? 'Hide' : 'Show'}</Btn>
                <Btn variant="danger" onClick={() => remove(c)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

