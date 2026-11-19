/**
 * useRazorpay — loads the Razorpay checkout.js script on demand and exposes
 * a single `openCheckout()` call that:
 *   1. Calls POST /api/v1/orders/initiate  → gets razorpay_order_id + orderToken
 *   2. Opens the Razorpay payment modal
 *   3. On payment success, calls POST /api/v1/orders/complete (with signature)
 *   4. Returns the confirmed bill number
 *
 * KEY_SECRET never touches the browser — all HMAC-SHA256 verification is done
 * on the backend in salesService.completeOnlineOrder().
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '@/lib/api';

// ── Razorpay window type ────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: { error: { description: string } }) => void): void;
}

// ── Backend response shapes ─────────────────────────────────────────────────
interface InitiateResponse {
  razorpayOrderId: string | null;
  amountPaise: number;
  currency: string;
  orderToken: string;
  billNumber: string;
  isCashOrder?: boolean;
}

interface CompleteResponse {
  billNumber: string;
  billAccessToken: string;
  paymentRef: string;
  paymentMethod: string;
}

// ── Cart item shape accepted by the backend ─────────────────────────────────
export interface CheckoutItem {
  productId?: string | null;
  productCode?: string | null;
  quantity: number;
  unitPrice?: number;
}

export interface CheckoutCustomer {
  customerName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

export type CheckoutResult =
  | { ok: true; billNumber: string; billAccessToken: string; paymentMethod: string }
  | { ok: false; cancelled?: boolean; error: string };

// ── Hook ────────────────────────────────────────────────────────────────────
export function useRazorpay() {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Lazy-load checkout.js once on first render
  useEffect(() => {
    if (window.Razorpay) { setScriptReady(true); return; }
    if (scriptRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error('[Razorpay] Failed to load checkout.js');
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => { /* script persists for page lifetime — intentional */ };
  }, []);

  const openCheckout = useCallback(
    async (
      customer: CheckoutCustomer,
      items: CheckoutItem[],
      meta: { businessName: string; keyId: string },
    ): Promise<CheckoutResult> => {
      setLoading(true);
      try {
        // ── Step 1: Create Razorpay order on the backend ──────────────────
        const initiateEnvelope = await request<InitiateResponse>('/orders/initiate', {
          method: 'POST',
          body: {
            customerName: customer.customerName,
            phone: customer.phone,
            email: customer.email,
            items,
          },
        });
        const initData = initiateEnvelope.data;

        // Cash order path — no Razorpay modal needed
        if (initData.isCashOrder || !initData.razorpayOrderId) {
          const completeEnvelope = await request<CompleteResponse>('/orders/complete', {
            method: 'POST',
            body: {
              customerName: customer.customerName,
              phone: customer.phone,
              email: customer.email,
              notes: customer.notes,
              items,
              orderToken: initData.orderToken,
              paymentMethod: 'CASH_AT_PICKUP',
            },
          });
          const c = completeEnvelope.data;
          return { ok: true, billNumber: c.billNumber, billAccessToken: c.billAccessToken, paymentMethod: c.paymentMethod };
        }

        // ── Step 2: Open Razorpay modal ───────────────────────────────────
        if (!window.Razorpay) {
          return { ok: false, error: 'Payment gateway failed to load. Please refresh and try again.' };
        }

        return await new Promise<CheckoutResult>((resolve) => {
          const rzp = new window.Razorpay!({
            key: meta.keyId,
            amount: initData.amountPaise,
            currency: initData.currency || 'INR',
            name: meta.businessName,
            description: `Order for ${customer.customerName}`,
            order_id: initData.razorpayOrderId!,
            prefill: {
              name: customer.customerName,
              contact: customer.phone,
              email: customer.email ?? undefined,
            },
            theme: { color: '#1a2f5a' },

            // ── Step 3: Verify payment on backend ─────────────────────────
            handler: async (response) => {
              try {
                const completeEnvelope = await request<CompleteResponse>('/orders/complete', {
                  method: 'POST',
                  body: {
                    customerName: customer.customerName,
                    phone: customer.phone,
                    email: customer.email,
                    notes: customer.notes,
                    items,
                    orderToken: initData.orderToken,
                    paymentMethod: 'RAZORPAY_ONLINE',
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });
                const c = completeEnvelope.data;
                resolve({ ok: true, billNumber: c.billNumber, billAccessToken: c.billAccessToken, paymentMethod: c.paymentMethod });
              } catch (err) {
                resolve({ ok: false, error: err instanceof Error ? err.message : 'Payment verification failed. Contact support.' });
              }
            },

            modal: {
              ondismiss: () => resolve({ ok: false, cancelled: true, error: 'Payment cancelled' }),
            },
          });

          rzp.on('payment.failed', (resp) => {
            resolve({ ok: false, error: resp?.error?.description ?? 'Payment failed. Please try again.' });
          });

          rzp.open();
        });
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Could not start payment. Please try again.' };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { openCheckout, loading, scriptReady };
}
