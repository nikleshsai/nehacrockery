import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/lib/auth';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const { adminRequest } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminRequest<DashboardStats>('/admin/dashboard')
      .then((res) => {
        if (active) {
          setStats(res.data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [adminRequest]);

  return (
    <div className="space-y-6">
      <Seo title="Dashboard – Admin | Neha Crockery House" noindex />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy">Dashboard</h1>
          <p className="text-xs text-charcoal-lt">Overview of products, enquiries, and wholesale orders</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-mid"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/enquiries"
            className="px-3.5 py-2 rounded-lg border border-navy text-navy text-xs font-medium hover:bg-navy/5"
          >
            View Enquiries
          </Link>
        </div>
      </div>

      {loading && <div className="text-xs text-charcoal-lt">Loading dashboard metrics…</div>}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#e5dfd3] shadow-brand-sm">
              <div className="text-[11px] uppercase tracking-wider text-charcoal-lt font-semibold">
                Total Products
              </div>
              <div className="font-serif text-3xl font-bold text-navy mt-1">
                {stats.products.total}
              </div>
              <div className="text-xs text-charcoal-lt mt-1">
                {stats.products.active} active · {stats.products.featured} featured
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e5dfd3] shadow-brand-sm">
              <div className="text-[11px] uppercase tracking-wider text-charcoal-lt font-semibold">
                Enquiries
              </div>
              <div className="font-serif text-3xl font-bold text-navy mt-1">
                {stats.enquiries.total}
              </div>
              <div className="text-xs text-amber-700 font-medium mt-1">
                {stats.enquiries.new} new unread
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e5dfd3] shadow-brand-sm">
              <div className="text-[11px] uppercase tracking-wider text-charcoal-lt font-semibold">
                Categories &amp; Brands
              </div>
              <div className="font-serif text-3xl font-bold text-navy mt-1">
                {stats.categories} / {stats.brands}
              </div>
              <div className="text-xs text-charcoal-lt mt-1">
                {stats.catalogues} active PDF catalogues
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e5dfd3] shadow-brand-sm">
              <div className="text-[11px] uppercase tracking-wider text-charcoal-lt font-semibold">
                Recorded Sales
              </div>
              <div className="font-serif text-3xl font-bold text-navy mt-1">{stats.sales}</div>
              <div className="text-xs text-charcoal-lt mt-1">B2B orders &amp; quotes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Enquiries */}
            <div className="bg-white rounded-xl border border-[#e5dfd3] shadow-brand-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5dfd3] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Recent Enquiries</h2>
                <Link to="/admin/enquiries" className="text-xs text-gold font-medium hover:underline">
                  View all &#8594;
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.recentEnquiries.length === 0 ? (
                  <p className="p-5 text-xs text-charcoal-lt">No enquiries yet.</p>
                ) : (
                  stats.recentEnquiries.map((enq) => (
                    <div key={enq.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-navy">
                          {enq.name}{' '}
                          {enq.companyName && (
                            <span className="font-normal text-charcoal-lt">({enq.companyName})</span>
                          )}
                        </div>
                        <div className="text-charcoal-lt">
                          {enq.product?.name || enq.customerType} ·{' '}
                          {new Date(enq.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cream text-navy border border-greige-2">
                        {enq.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl border border-[#e5dfd3] shadow-brand-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5dfd3] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Recent Sales</h2>
                <Link to="/admin/sales" className="text-xs text-gold font-medium hover:underline">
                  View all &#8594;
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.recentSales.length === 0 ? (
                  <p className="p-5 text-xs text-charcoal-lt">No sales recorded yet.</p>
                ) : (
                  stats.recentSales.map((sale) => (
                    <div key={sale.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-navy">
                          {sale.saleNumber} — {sale.customerName}
                        </div>
                        <div className="text-charcoal-lt">
                          {sale.companyName || 'Direct'} ·{' '}
                          {new Date(sale.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right">
                        {sale.totalAmount != null && (
                          <div className="font-semibold text-navy">
                            ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                          </div>
                        )}
                        <span className="text-[10px] uppercase text-charcoal-lt">{sale.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

