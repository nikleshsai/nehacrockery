import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import type { SiteSettings } from '@/lib/types';
import { Alert, Btn, Card, Field, Input, PageHeader, Textarea } from '@/components/admin/ui';

const FIELDS: Array<[keyof SiteSettings, string, boolean?]> = [
  ['businessName', 'Business name'],
  ['tagline', 'Tagline'],
  ['phone', 'Phone'],
  ['whatsapp', 'WhatsApp number'],
  ['email', 'Email'],
  ['address', 'Showroom address', true],
  ['warehouseAddress', 'Warehouse address', true],
  ['businessHours', 'Business hours'],
  ['googleMapsUrl', 'Google Maps URL'],
  ['facebook', 'Facebook URL'],
  ['instagram', 'Instagram URL'],
  ['twitter', 'Twitter / X URL'],
  ['youtube', 'YouTube URL'],
  ['linkedin', 'LinkedIn URL'],
  ['gstNumber', 'GST number'],
  ['panNumber', 'PAN number'],
];

export default function SettingsPage() {
  const { adminRequest } = useAuth();
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminRequest<SiteSettings>('/admin/settings')
      .then((r) => setForm(r.data ?? {}))
      .catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, [adminRequest]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { id: _id, ...body } = form;
    void _id;
    try {
      await adminRequest('/admin/settings', { method: 'PUT', body });
      try { sessionStorage.removeItem('nch_site_settings'); } catch { /* ignore */ }
      setMsg({ ok: true, text: 'Settings saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  return (
    <>
      <PageHeader title="Site Settings" subtitle="Contact details shown across the public website" />
      {msg && <Alert tone={msg.ok ? 'success' : 'error'}>{msg.text}</Alert>}
      <Card>
        <form onSubmit={save} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(([key, label, multi]) => (
            <div key={key} className={multi ? 'md:col-span-2' : ''}>
              <Field label={label}>
                {multi ? (
                  <Textarea rows={2} value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                ) : (
                  <Input value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                )}
              </Field>
            </div>
          ))}
          <div className="md:col-span-2"><Btn type="submit">Save settings</Btn></div>
        </form>
      </Card>
    </>
  );
}

