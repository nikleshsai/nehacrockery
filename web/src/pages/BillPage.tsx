/**
 * BillPage — shown after a successful Razorpay payment.
 * Fetches bill details from GET /api/v1/orders/bill/:billNumber?token=...
 * and displays a simple payment confirmation.
 */
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { request } from '@/lib/api';

interface BillItem {
  productName: string;
  productCode?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Bill {
  billNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  paymentMethod: string;
  paymentRef?: string | null;
  totalAmount: number;
  items: BillItem[];
  createdAt: string;
}

export default function BillPage() {
  const { billNumber } = useParams<{ billNumber: string }>();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billNumber) return;
    setLoading(true);
    request<Bill>(`/orders/bill/${encodeURIComponent(billNumber)}?token=${encodeURIComponent(token)}`)
      .then((env) => setBill(env.data))
      .catch((err) => setError(err?.message ?? 'Could not load bill details.'))
      .finally(() => setLoading(false));
  }, [billNumber, token]);

  return (
    <>
      <Seo title="Payment Confirmation — Neha Crockery House" noindex />

      <div className="container" style={{ padding: '60px 24px', maxWidth: 640, margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '80px 0' }}>
            Loading bill…
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#dc2626', marginBottom: 24 }}>⚠️ {error}</p>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </div>
        )}

        {bill && (
          <div>
            {/* Success banner */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 16,
              padding: '32px 28px',
              textAlign: 'center',
              marginBottom: 32,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: '#14532d', marginBottom: 8 }}>
                Payment Confirmed!
              </h1>
              <p style={{ color: '#16a34a', fontSize: 15, margin: 0 }}>
                Thank you, {bill.customerName}. Your order has been recorded.
              </p>
            </div>

            {/* Bill details */}
            <div style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: 12,
              padding: '24px 28px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px' }}>BILL NUMBER</p>
                  <p style={{ fontWeight: 700, color: '#1a2744', fontSize: 18, margin: 0 }}>#{bill.billNumber}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px' }}>DATE</p>
                  <p style={{ fontWeight: 600, color: '#374151', margin: 0 }}>
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0 0 20px' }} />

              {/* Customer */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</p>
                <p style={{ fontWeight: 600, color: '#1a2744', margin: '0 0 2px' }}>{bill.customerName}</p>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{bill.phone}{bill.email ? ` · ${bill.email}` : ''}</p>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0 0 20px' }} />

              {/* Items */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
                      <th style={{ textAlign: 'left', paddingBottom: 8, fontWeight: 600 }}>Product</th>
                      <th style={{ textAlign: 'center', paddingBottom: 8, fontWeight: 600 }}>Qty</th>
                      <th style={{ textAlign: 'right', paddingBottom: 8, fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '10px 0', color: '#1a2744', fontWeight: 500 }}>
                          {item.productName}
                          {item.productCode && <span style={{ color: '#9ca3af', fontSize: 12, display: 'block' }}>#{item.productCode}</span>}
                        </td>
                        <td style={{ textAlign: 'center', color: '#374151' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', color: '#374151' }}>₹{(item.totalPrice / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '0 0 16px' }} />

              {/* Total & payment */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
                    via {bill.paymentMethod === 'RAZORPAY_ONLINE' ? 'Razorpay' : bill.paymentMethod}
                    {bill.paymentRef && <span style={{ color: '#9ca3af' }}> · {bill.paymentRef}</span>}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px' }}>TOTAL PAID</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', margin: 0 }}>
                    ₹{(bill.totalAmount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn-primary">
                Continue Shopping
              </Link>
              <Link to="/contact" style={{ padding: '12px 24px', border: '1.5px solid #d1d5db', borderRadius: 8, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
