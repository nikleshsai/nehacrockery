import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { Brand, Category, Product } from '@/lib/types';
import { Alert, Badge, Btn, Card, Field, Input, Modal, PageHeader, Pager, Select, Table, Textarea, useAdminList } from '@/components/admin/ui';

type Form = Partial<Omit<Product, 'features'>> & { featuresText?: string };

const num = (v: unknown) => (v === '' || v == null ? null : Number(v));

export default function ProductsAdminPage() {
  const { adminRequest } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const { items, pagination, loading, error, reload, setError } = useAdminList<Product>(
    `/admin/products?page=${page}&pageSize=20&active=all${q ? `&search=${encodeURIComponent(q)}` : ''}`,
  );
  const cats = useAdminList<Category>('/admin/categories');
  const brands = useAdminList<Brand>('/admin/brands');
  const [editing, setEditing] = useState<Form | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const open = (p?: Product) =>
    setEditing(p ? { ...p, featuresText: (p.features ?? []).join('\n') } : { isActive: true, isFeatured: false, isNewArrival: false, featuresText: '' });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body = {
      name: editing.name,
      productCode: editing.productCode || null,
      description: editing.description || null,
      brandId: editing.brandId || null,
      categoryId: editing.categoryId || null,
      material: editing.material || null,
      capacity: editing.capacity || null,
      dimensions: editing.dimensions || null,
      colourFinish: editing.colourFinish || null,
      setContents: editing.setContents || null,
      collection: editing.collection || null,
      priceUnit: editing.priceUnit || null,
      mrp: num(editing.mrp),
      catalogueMrp: num(editing.catalogueMrp),
      features: (editing.featuresText ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
      isActive: editing.isActive ?? true,
      isFeatured: editing.isFeatured ?? false,
      isNewArrival: editing.isNewArrival ?? false,
    };
    try {
      let id = editing.id;
      if (id) await adminRequest(`/admin/products/${id}`, { method: 'PUT', body });
      else id = (await adminRequest<Product>('/admin/products', { method: 'POST', body })).data.id;

      const files = imgRef.current?.files;
      if (id && files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append('images', f));
        await adminRequest(`/admin/products/${id}/images`, { method: 'POST', formData: fd });
      }
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      await adminRequest(`/admin/products/${p.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const importFile = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      await adminRequest('/admin/products/import', { method: 'POST', formData: fd });
      if (fileRef.current) fileRef.current.value = '';
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const set = (p: Form) => setEditing({ ...editing, ...p });

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage the product catalogue"
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importFile} />
            <Btn variant="outline" onClick={() => fileRef.current?.click()}>Import CSV/Excel</Btn>
            <Btn onClick={() => open()}>+ Add Product</Btn>
          </>
        }
      />
      {error && <Alert>{error}</Alert>}
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <Input placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Btn type="submit">Search</Btn>
      </form>
      <Card>
        <Table head={['Image', 'Name', 'Code', 'Category', 'Brand', 'MRP', 'Status', '']}>
          {loading && <tr><td className="p-4" colSpan={8}>Loading…</td></tr>}
          {items.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">{p.images?.[0] ? <img src={p.images[0].imageUrl} alt="" className="h-10 w-10 object-cover rounded" /> : '—'}</td>
              <td className="px-4 py-3 font-semibold text-navy">{p.name}</td>
              <td className="px-4 py-3">{p.productCode ?? '—'}</td>
              <td className="px-4 py-3">{p.category?.name ?? '—'}</td>
              <td className="px-4 py-3">{p.brand?.name ?? '—'}</td>
              <td className="px-4 py-3">{p.mrp ? `₹${Number(p.mrp).toLocaleString('en-IN')}` : '—'}</td>
              <td className="px-4 py-3 space-x-1">
                <Badge tone={p.isActive ? 'green' : 'neutral'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                {p.isFeatured && <Badge tone="amber">Featured</Badge>}
                {p.isNewArrival && <Badge tone="blue">New</Badge>}
              </td>
              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <Btn variant="outline" onClick={() => open(p)}>Edit</Btn>
                <Btn variant="danger" onClick={() => remove(p)}>Delete</Btn>
              </td>
            </tr>
          ))}
        </Table>
        <Pager p={pagination} onPage={setPage} />
      </Card>

      {editing && (
        <Modal title={editing.id ? 'Edit Product' : 'New Product'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Name *"><Input required value={editing.name ?? ''} onChange={(e) => set({ name: e.target.value })} /></Field></div>
            <Field label="Product code"><Input value={editing.productCode ?? ''} onChange={(e) => set({ productCode: e.target.value })} /></Field>
            <Field label="Collection"><Input value={editing.collection ?? ''} onChange={(e) => set({ collection: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={editing.categoryId ?? ''} onChange={(e) => set({ categoryId: e.target.value })}>
                <option value="">—</option>
                {cats.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Brand">
              <Select value={editing.brandId ?? ''} onChange={(e) => set({ brandId: e.target.value })}>
                <option value="">—</option>
                {brands.items.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Material"><Input value={editing.material ?? ''} onChange={(e) => set({ material: e.target.value })} /></Field>
            <Field label="Capacity"><Input value={editing.capacity ?? ''} onChange={(e) => set({ capacity: e.target.value })} /></Field>
            <Field label="Dimensions"><Input value={editing.dimensions ?? ''} onChange={(e) => set({ dimensions: e.target.value })} /></Field>
            <Field label="Colour / finish"><Input value={editing.colourFinish ?? ''} onChange={(e) => set({ colourFinish: e.target.value })} /></Field>
            <Field label="MRP (₹)"><Input type="number" min={0} step="0.01" value={editing.mrp ?? ''} onChange={(e) => set({ mrp: e.target.value })} /></Field>
            <Field label="Catalogue MRP (₹)"><Input type="number" min={0} step="0.01" value={editing.catalogueMrp ?? ''} onChange={(e) => set({ catalogueMrp: e.target.value })} /></Field>
            <Field label="Price unit"><Input placeholder="piece / set" value={editing.priceUnit ?? ''} onChange={(e) => set({ priceUnit: e.target.value })} /></Field>
            <Field label="Set contents"><Input value={editing.setContents ?? ''} onChange={(e) => set({ setContents: e.target.value })} /></Field>
            <div className="col-span-2"><Field label="Description"><Textarea rows={3} value={editing.description ?? ''} onChange={(e) => set({ description: e.target.value })} /></Field></div>
            <div className="col-span-2"><Field label="Features (one per line)"><Textarea rows={3} value={editing.featuresText ?? ''} onChange={(e) => set({ featuresText: e.target.value })} /></Field></div>
            <div className="col-span-2"><Field label="Add images"><input ref={imgRef} type="file" accept="image/*" multiple className="text-xs" /></Field></div>
            <div className="col-span-2 flex gap-6 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => set({ isActive: e.target.checked })} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.isFeatured ?? false} onChange={(e) => set({ isFeatured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.isNewArrival ?? false} onChange={(e) => set({ isNewArrival: e.target.checked })} /> New arrival</label>
            </div>
            <div className="col-span-2"><Btn type="submit">Save product</Btn></div>
          </form>
        </Modal>
      )}
    </>
  );
}

