import { useCallback, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/lib/auth';
import type { Pagination } from '@/lib/types';

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-greige-2 bg-white text-sm focus:outline-none focus:border-navy';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
      <Seo title={`${title} – Admin | Neha Crockery House`} noindex />
      <div>
        <h1 className="font-serif text-3xl font-semibold text-navy">{title}</h1>
        {subtitle && <p className="text-xs text-charcoal-lt">{subtitle}</p>}
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-[#e5dfd3] shadow-brand-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function Btn({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'danger' }) {
  const styles = {
    primary: 'bg-navy text-white hover:bg-navy-mid',
    outline: 'border border-navy text-navy hover:bg-navy/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${styles} ${className}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-charcoal">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${inputCls} ${p.className ?? ''}`} />;

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  const tones = {
    neutral: 'bg-cream text-navy border-greige-2',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }[tone];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tones}`}>{children}</span>;
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' }) {
  const cls = tone === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  return <div role="alert" className={`p-3 rounded-lg border text-xs mb-4 ${cls}`}>{children}</div>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-cream text-charcoal-lt uppercase tracking-wider text-[10px]">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-brand-lg">
        <div className="px-6 py-4 border-b border-[#e5dfd3] flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-navy">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-charcoal-lt cursor-pointer">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Pager({ p, onPage }: { p: Pagination | null; onPage: (n: number) => void }) {
  if (!p || p.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5dfd3] text-xs">
      <span className="text-charcoal-lt">Page {p.page} of {p.totalPages} · {p.total} total</span>
      <div className="flex gap-2">
        <Btn variant="outline" disabled={p.page <= 1} onClick={() => onPage(p.page - 1)}>Previous</Btn>
        <Btn variant="outline" disabled={p.page >= p.totalPages} onClick={() => onPage(p.page + 1)}>Next</Btn>
      </div>
    </div>
  );
}

/** Fetch an admin list endpoint (with optional pagination) and expose reload. */
export function useAdminList<T>(path: string) {
  const { adminRequest } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminRequest<T[]>(path);
      setItems(res.data ?? []);
      setPagination(res.pagination ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [adminRequest, path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, pagination, loading, error, reload, setError };
}
