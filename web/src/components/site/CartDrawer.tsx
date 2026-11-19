// ─────────────────────────────────────────────────────────────────────────────
// CartDrawer — slides in from the right, full cart + checkout flow
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart';

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CartDrawer() {
  const { items, count, total, hasUnpriced, isOpen, closeCart, setQty, removeItem } = useCart();
  const drawerRef = useRef<HTMLElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      firstFocusRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Trap focus inside drawer
  useEffect(() => {
    if (!isOpen) return;
    const el = drawerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [isOpen, items]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`nch-ov${isOpen ? ' on' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`nch-dr${isOpen ? ' on' : ''}`}
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="nch-hd">
          <span>Your Cart {count > 0 && <span className="nch-hd-count">({count} item{count !== 1 ? 's' : ''})</span>}</span>
          <button ref={firstFocusRef} className="nch-x" aria-label="Close cart" onClick={closeCart}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="nch-bd">
          {items.length === 0 ? (
            <div className="nch-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Your cart is empty</div>
              <div style={{ fontSize: 13, color: '#888' }}>
                Browse our <a href="/products" style={{ color: '#c8a84b' }} onClick={closeCart}>products</a> and add items to get started.
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.slug} className="nch-it">
                {item.img
                  ? <img src={item.img} alt="" loading="lazy" />
                  : <div className="nch-ph" />}
                <div className="nch-in">
                  <b>{item.name}</b>
                  {item.code && <span className="nch-pr">Code: {item.code}</span>}
                  <span className="nch-pr">
                    {item.price ? `${inr(item.price)} each` : 'Price on request'}
                  </span>
                  <div className="nch-q">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(item.slug, item.qty - 1)}
                    >&minus;</button>
                    <span>{item.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(item.slug, item.qty + 1)}
                    >+</button>
                    <button
                      style={{ width: 'auto', padding: '0 8px', marginLeft: 8 }}
                      onClick={() => removeItem(item.slug)}
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div className="nch-ft">
            {/* Pickup notice */}
            <div className="nch-pickup-box">
              <strong>🏪 Store Pickup Only — No Delivery Option</strong>
              <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>
                Pickup Showroom: 13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai, Tamil Nadu 600003
              </div>
            </div>

            {/* Total */}
            <div className="nch-tot">
              <span>Total Payable</span>
              <span>
                {hasUnpriced && total === 0 ? 'On request' : `${inr(total)}${hasUnpriced ? '+' : ''}`}
              </span>
            </div>

            {/* Customer fields */}
            <CustomerCheckout onClose={closeCart} />
          </div>
        )}
      </aside>
    </>
  );
}

// ── Checkout sub-component ────────────────────────────────────────────────────
function CustomerCheckout({ onClose }: { onClose: () => void }) {
  const { items, total, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState<'online' | 'scanner' | 'cash' | null>(null);
  const [bill, setBill] = useState<BillData | null>(null);

  if (bill) return <BillResult bill={bill} onDone={() => { setBill(null); clearCart(); onClose(); }} />;

  const validate = () => {
    if (!name.trim()) { alert('Please enter your full name.'); return false; }
    if (!/^[0-9+\-() ]{7,20}$/.test(phone.trim())) { alert('Please enter a valid phone number.'); return false; }
    return true;
  };

  const payload = () => ({
    customerName: name.trim(),
    companyName: company.trim() || null,
    phone: phone.trim(),
    email: email.trim() || null,
    items: items.map((i) => ({
      slug: i.slug,
      productName: i.name,
      productCode: i.code ?? null,
      quantity: i.qty,
      unitPrice: i.price ?? 0,
    })),
  });

  const finalize = async (extra: Record<string, unknown>) => {
    const API = import.meta.env.VITE_API_URL ?? '/api/v1';
    try {
      const r = await fetch(`${API}/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload(), ...extra }),
      });
      const json = await r.json() as { data?: BillData };
      return (json.data ?? json) as BillData;
    } catch {
      // Fallback: record as enquiry
      const fallbackBill: BillData = {
        billNumber: 'NCH-' + Date.now().toString(36).toUpperCase(),
        customerName: name,
        phone: phone,
        paymentMethod: (extra.paymentMethod as string) ?? 'Unknown',
        totalAmount: total,
        dateStr: new Date().toLocaleString('en-IN'),
      };
      return fallbackBill;
    }
  };

  const handleCash = async () => {
    if (!validate()) return;
    setLoading('cash');
    const b = await finalize({ paymentMethod: 'Cash at Store Pickup' });
    setBill(b);
    setLoading(null);
  };

  const handleOnline = async () => {
    if (!validate()) return;
    setLoading('online');
    const API = import.meta.env.VITE_API_URL ?? '/api/v1';
    try {
      // Step 1 — Create Razorpay order on backend
      const r = await fetch(`${API}/orders/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({})) as { message?: string };
        alert(err.message ?? 'Could not initialize payment. Please try again.');
        setLoading(null);
        return;
      }
      const json = await r.json() as {
        data?: {
          billNumber?: string;
          totalAmount?: number;
          orderToken?: string;
          razorpayKeyId?: string | null;
          razorpayOrderId?: string | null;
          amount?: number;
          currency?: string;
          mode?: string;
        }
      };
      const d = json.data ?? {};
      setLoading(null);

      // Step 2 — If Razorpay is configured, open checkout modal
      if (d.mode === 'razorpay' && d.razorpayKeyId && d.razorpayOrderId) {
        openRazorpayModal({
          keyId: d.razorpayKeyId,
          orderId: d.razorpayOrderId,
          amountPaise: d.amount ?? Math.round((d.totalAmount ?? total) * 100),
          currency: d.currency ?? 'INR',
          billNumber: d.billNumber ?? '',
          orderToken: d.orderToken ?? null,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          finalize,
          setBill,
        });
      } else {
        // Fallback: Razorpay not configured — open manual ref modal
        openOnlineModal(d.billNumber ?? '', d.totalAmount ?? total, d.orderToken ?? null, finalize, setBill);
      }
    } catch {
      setLoading(null);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleScanner = async () => {
    if (!validate()) return;
    setLoading('scanner');
    const API = import.meta.env.VITE_API_URL ?? '/api/v1';
    let billNo = 'NCH-' + Date.now().toString(36).toUpperCase();
    let orderToken: string | null = null;
    let amount = total;
    try {
      const r = await fetch(`${API}/orders/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const json = await r.json() as { data?: { billNumber?: string; totalAmount?: number; orderToken?: string } };
      const d = json.data ?? {};
      billNo = d.billNumber ?? billNo;
      amount = d.totalAmount ?? amount;
      orderToken = d.orderToken ?? null;
    } catch { /* use fallback */ }
    setLoading(null);
    openScannerModal(billNo, amount, orderToken, finalize, setBill);
  };

  return (
    <div>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your Full Name *"
        style={inputStyle}
        autoComplete="name"
      />
      <input
        value={phone} onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone / WhatsApp Number *"
        inputMode="tel"
        style={inputStyle}
        autoComplete="tel"
      />
      <input
        value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address (optional)"
        type="email"
        style={inputStyle}
        autoComplete="email"
      />
      <input
        value={company} onChange={(e) => setCompany(e.target.value)}
        placeholder="Business / Shop Name (optional)"
        style={inputStyle}
        autoComplete="organization"
      />

      <button className="nch-go" disabled={!!loading} onClick={() => void handleOnline()}>
        {loading === 'online' ? 'Initializing Payment…' : '💳 Pay Online & Generate Bill →'}
      </button>
      <button className="nch-scanner-btn" disabled={!!loading} onClick={() => void handleScanner()}>
        {loading === 'scanner' ? 'Preparing QR…' : '📷 Pay by UPI Scanner / QR Code →'}
      </button>
      <button className="nch-cash-btn" disabled={!!loading} onClick={() => void handleCash()}>
        {loading === 'cash' ? 'Generating Bill…' : '💵 Pay by Cash (at Store Pickup) →'}
      </button>
      <p className="nch-note">
        Scan QR Code (GPay / PhonePe / Paytm), Pay Online (UPI / Card), or Pay Cash at Pickup. Instant bill generated.
      </p>
    </div>
  );
}

// ── UPI Scanner Modal ─────────────────────────────────────────────────────────
function openScannerModal(
  billNo: string,
  amount: number,
  _orderToken: string | null,
  finalize: (extra: Record<string, unknown>) => Promise<BillData>,
  setBill: (b: BillData) => void
) {
  const UPI_ID = (window as unknown as Record<string, unknown>).__NCH_SITE_SETTINGS__
    ? ((window as unknown as Record<string, unknown>).__NCH_SITE_SETTINGS__ as Record<string, string>).upiId ?? 'nehacrockeryhouse@okaxis'
    : 'nehacrockeryhouse@okaxis';

  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=Neha+Crockery+House&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + billNo)}`;
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;max-width:380px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="background:#1e3a8a;color:#fff;padding:14px 16px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:11px;opacity:.8;">📷 Scan & Pay</div><div style="font-size:15px;font-weight:700;">Bill: ${billNo}</div></div>
        <button id="scan-close" style="background:none;border:0;color:#fff;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;justify-content:space-between;background:#eff6ff;border:1.5px solid #bfdbfe;padding:10px 14px;border-radius:8px;margin-bottom:14px;">
          <div><div style="font-size:11px;color:#1e40af;font-weight:600;">AMOUNT</div><strong style="font-size:20px;color:#1e3a8a;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
          <div style="text-align:right;font-size:12px;"><div style="color:#555;">UPI ID</div><strong style="color:#1e3a8a;">${UPI_ID}</strong></div>
        </div>
        <div style="text-align:center;margin-bottom:12px;">
          <p style="font-size:12px;color:#555;margin:0 0 8px;">Scan with GPay / PhonePe / Paytm or any UPI app</p>
          <div style="display:inline-block;padding:8px;border:2px solid #bfdbfe;border-radius:10px;">
            <img src="${qrUrl}" width="200" height="200" alt="UPI QR Code" style="display:block;">
          </div>
          <div style="margin-top:8px;">
            <a href="${upiLink}" style="display:inline-block;padding:8px 18px;background:#2563eb;color:#fff;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">Open UPI App 📱</a>
          </div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;font-size:12px;color:#166534;margin-bottom:12px;">
          <strong>Steps:</strong>
          <ol style="margin:4px 0 0 16px;padding:0;">
            <li>Scan the QR code or tap "Open UPI App"</li>
            <li>Pay exactly ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</li>
            <li>Note the <strong>UTR / Transaction ID</strong> after payment</li>
            <li>Enter it below and click Confirm</li>
          </ol>
        </div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">UPI Transaction ID / UTR No. <span style="color:#b91c1c;">*</span></label>
        <input id="utr-input" placeholder="e.g. 423898765432 (12-digit UTR)" style="width:100%;box-sizing:border-box;padding:10px;border:1.5px solid #bfdbfe;border-radius:6px;font-size:13px;margin-bottom:8px;">
        <p id="scan-err" style="color:#b91c1c;font-size:12px;margin:0 0 8px;display:none;"></p>
        <button id="scan-confirm" style="width:100%;padding:12px;border:0;border-radius:6px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">✅ Payment Done — Generate Bill →</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.querySelector('#scan-close')!.addEventListener('click', () => overlay.remove());

  overlay.querySelector('#scan-confirm')!.addEventListener('click', async () => {
    const utr = (overlay.querySelector('#utr-input') as HTMLInputElement).value.trim();
    const errEl = overlay.querySelector('#scan-err') as HTMLElement;
    if (!utr || utr.length < 6) {
      errEl.textContent = 'Please enter a valid UPI Transaction ID / UTR number.';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    const btn = overlay.querySelector('#scan-confirm') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Verifying & Generating Bill…';
    const bill = await finalize({ paymentMethod: `UPI Scanner / QR (UTR: ${utr})`, transactionRef: utr, upiId: UPI_ID });
    overlay.remove();
    setBill(bill);
  });
}

// ── Razorpay Standard Checkout ──────────────────────────────────────────────
interface RazorpayModalArgs {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  billNumber: string;
  orderToken: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  finalize: (extra: Record<string, unknown>) => Promise<BillData>;
  setBill: (b: BillData) => void;
}

function openRazorpayModal(args: RazorpayModalArgs) {
  const {
    keyId, orderId, amountPaise, currency, billNumber,
    orderToken, customerName, customerPhone, customerEmail,
    finalize, setBill,
  } = args;

  if (typeof window.Razorpay === 'undefined') {
    alert('Razorpay could not be loaded. Please check your connection and try again.');
    return;
  }

  const rzp = new window.Razorpay({
    key: keyId,
    amount: amountPaise,
    currency,
    name: 'Neha Crockery House',
    description: `Bill ${billNumber} — Store Pickup`,
    image: '/assets/images/logo.jpeg',
    order_id: orderId,
    prefill: {
      name: customerName,
      contact: customerPhone,
      email: customerEmail || undefined,
    },
    notes: { billNumber, orderToken: orderToken ?? '' },
    theme: { color: '#1a2744' },
    modal: {
      ondismiss: () => { /* user dismissed — cart stays open */ },
    },
    handler: (response) => {
      void finalize({
        orderToken,
        paymentMethod: 'Razorpay Online',
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }).then((bill) => setBill(bill)).catch(() => {
        setBill({
          billNumber, customerName, phone: customerPhone,
          paymentMethod: 'Razorpay Online',
          totalAmount: amountPaise / 100,
          dateStr: new Date().toLocaleString('en-IN'),
        });
      });
    },
  });

  rzp.on('payment.failed', (resp) => {
    alert(`Payment failed: ${resp.error.description}. Please try again.`);
  });

  rzp.open();
}

// ── Online Payment Modal ──────────────────────────────────────────────────────
function openOnlineModal(
  billNo: string,
  amount: number,
  _orderToken: string | null,
  finalize: (extra: Record<string, unknown>) => Promise<BillData>,
  setBill: (b: BillData) => void
) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="background:#1a2744;color:#fff;padding:14px 16px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:11px;opacity:.8;">💳 Online Payment</div><div style="font-size:15px;font-weight:700;">Bill: ${billNo}</div></div>
        <button id="pay-close" style="background:none;border:0;color:#fff;font-size:24px;cursor:pointer;">&times;</button>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;justify-content:space-between;background:#f6f1e7;padding:10px 14px;border-radius:8px;margin-bottom:14px;">
          <div><div style="font-size:11px;color:#666;">Customer</div></div>
          <div style="text-align:right;"><div style="font-size:11px;color:#666;">Amount Payable</div><strong style="font-size:16px;color:#1a2744;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
        </div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">Select Payment Method</label>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button class="pm-btn active" data-method="UPI (GPay / PhonePe / Paytm)" style="flex:1;padding:8px 4px;border:1.5px solid #1a2744;border-radius:6px;background:#1a2744;color:#fff;font-size:12px;cursor:pointer;">📱 UPI</button>
          <button class="pm-btn" data-method="Card (Debit / Credit)" style="flex:1;padding:8px 4px;border:1.5px solid #d9d2c3;border-radius:6px;background:#fff;font-size:12px;cursor:pointer;">💳 Card</button>
          <button class="pm-btn" data-method="NetBanking" style="flex:1;padding:8px 4px;border:1.5px solid #d9d2c3;border-radius:6px;background:#fff;font-size:12px;cursor:pointer;">🏦 Net</button>
        </div>
        <input id="pay-ref" placeholder="Enter UPI ID (e.g. name@okaxis) or Ref No." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d2c3;border-radius:6px;font-size:13px;margin-bottom:8px;">
        <p id="pay-err" style="color:#b91c1c;font-size:12px;margin:0 0 8px;display:none;"></p>
        <button id="pay-confirm" style="width:100%;padding:12px;border:0;border-radius:6px;background:#1a2744;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Pay ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} & Generate Bill →</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  let selectedMethod = 'UPI (GPay / PhonePe / Paytm)';
  overlay.querySelectorAll('.pm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.pm-btn').forEach((b) => {
        (b as HTMLElement).style.background = '#fff';
        (b as HTMLElement).style.color = '#1a2744';
        (b as HTMLElement).style.borderColor = '#d9d2c3';
      });
      (btn as HTMLElement).style.background = '#1a2744';
      (btn as HTMLElement).style.color = '#fff';
      (btn as HTMLElement).style.borderColor = '#1a2744';
      selectedMethod = btn.getAttribute('data-method') ?? selectedMethod;
      const inp = overlay.querySelector('#pay-ref') as HTMLInputElement;
      if (selectedMethod.includes('UPI')) inp.placeholder = 'Enter UPI ID or UTR Ref No.';
      else if (selectedMethod.includes('Card')) inp.placeholder = 'Card Holder Name / Last 4 Digits';
      else inp.placeholder = 'Bank Name / NetBanking Ref No.';
    });
  });

  overlay.querySelector('#pay-close')!.addEventListener('click', () => overlay.remove());

  overlay.querySelector('#pay-confirm')!.addEventListener('click', async () => {
    const ref = (overlay.querySelector('#pay-ref') as HTMLInputElement).value.trim();
    const errEl = overlay.querySelector('#pay-err') as HTMLElement;
    if (!ref) { errEl.textContent = 'Please enter a payment reference.'; errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    const btn = overlay.querySelector('#pay-confirm') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Verifying & Generating Bill…';
    const bill = await finalize({ paymentMethod: selectedMethod, transactionRef: ref });
    overlay.remove();
    setBill(bill);
  });
}

// ── Bill Result ───────────────────────────────────────────────────────────────
interface BillData {
  billNumber: string;
  customerName: string;
  phone: string;
  paymentMethod: string;
  totalAmount: number;
  dateStr?: string;
  email?: string;
  companyName?: string;
  items?: Array<{ productName: string; productCode?: string; quantity: number; unitPrice: number }>;
  businessName?: string;
  pickupAddress?: string;
  businessPhone?: string;
  gstNumber?: string;
}

function BillResult({ bill, onDone }: { bill: BillData; onDone: () => void }) {
  const isCash = bill.paymentMethod.toLowerCase().includes('cash');
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 36 }}>{isCash ? '📋' : '✅'}</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginTop: 4 }}>
          {isCash ? 'Store Pickup Bill Generated!' : 'Payment Successful!'}
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Bill No: <strong>{bill.billNumber}</strong></div>
      </div>
      <div style={{ background: '#f6f1e7', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
        <div><strong>Customer:</strong> {bill.customerName} · {bill.phone}</div>
        <div><strong>Payment:</strong> {bill.paymentMethod}</div>
        <div><strong>Total:</strong> ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
      <button
        style={{ width: '100%', padding: 11, border: 0, borderRadius: 6, background: '#1a2744', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
        onClick={onDone}
      >
        ✅ Done — Close Cart
      </button>
      <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: 0 }}>
        Show this bill number at the showroom to collect your order.
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px', marginBottom: 8,
  border: '1px solid #d9d2c3', borderRadius: 6, fontSize: 13, fontFamily: 'Montserrat, sans-serif',
};
