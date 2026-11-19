/**
 * CheckoutButton — drop-in Razorpay Standard Checkout button.
 *
 * Usage:
 *   <CheckoutButton
 *     items={[{ productId: "...", quantity: 2, unitPrice: 150 }]}
 *     customer={{ customerName: "Ravi", phone: "9876543210" }}
 *     onSuccess={(bill) => navigate(`/bill/${bill.billNumber}`)}
 *   />
 */
import { useState } from 'react';
import { useRazorpay, type CheckoutItem, type CheckoutCustomer } from '@/lib/useRazorpay';
import { useApiData } from '@/lib/hooks';

interface PaymentConfig {
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
  businessName: string;
  fulfillmentLabel: string;
  pickupAddress: string;
}

interface BillResult {
  billNumber: string;
  billAccessToken: string;
  paymentMethod: string;
}

interface Props {
  items: CheckoutItem[];
  customer: CheckoutCustomer;
  onSuccess: (bill: BillResult) => void;
  onCancel?: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function CheckoutButton({
  items,
  customer,
  onSuccess,
  onCancel,
  className = 'btn-primary',
  label,
  disabled = false,
}: Props) {
  const { openCheckout, loading } = useRazorpay();
  const [error, setError] = useState('');

  const { data: config } = useApiData<PaymentConfig>('/orders/payment-config');

  // Fallback key from Vite env (set during build — KEY_SECRET is never exposed)
  const keyId = config?.razorpayKeyId ?? (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) ?? '';
  const paymentEnabled = Boolean(config?.razorpayEnabled ?? keyId);
  const businessName = config?.businessName ?? 'Neha Crockery House';

  async function handleClick() {
    setError('');
    const result = await openCheckout(customer, items, { keyId, businessName });

    if (result.ok) {
      onSuccess({ billNumber: result.billNumber, billAccessToken: result.billAccessToken, paymentMethod: result.paymentMethod });
    } else if (result.cancelled) {
      onCancel?.();
    } else {
      setError(result.error);
    }
  }

  const btnLabel = label ?? (paymentEnabled ? 'Pay Now →' : 'Place Order (Cash at Pickup) →');

  return (
    <div className="checkout-btn-wrap">
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={disabled || loading || items.length === 0}
        aria-busy={loading}
      >
        {loading ? 'Processing…' : btnLabel}
      </button>

      {config?.fulfillmentLabel && (
        <p className="checkout-fulfillment-note">
          🏪 {config.fulfillmentLabel}
        </p>
      )}
      {config?.pickupAddress && (
        <p className="checkout-address-note">📍 {config.pickupAddress}</p>
      )}

      {error && (
        <p className="checkout-error" role="alert">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
