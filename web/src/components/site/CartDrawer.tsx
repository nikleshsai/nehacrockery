/**
 * CartDrawer — slide-in side panel showing cart items with qty controls
 * and a WhatsApp enquiry button that sends all items in one message.
 */
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { useContact } from '@/lib/settings';

export function CartDrawer() {
  const { items, count, remove, setQty, clear, drawerOpen, closeDrawer } = useCart();
  const c = useContact();

  // Build WhatsApp message from cart items
  function buildWhatsAppMessage() {
    const lines = items.map(
      (item) =>
        `• ${item.name}${item.productCode ? ` (${item.productCode})` : ''} — Qty: ${item.quantity}`,
    );
    return `Hello, I would like to enquire about the following products:\n\n${lines.join('\n')}\n\nKindly share pricing and availability.`;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay${drawerOpen ? ' open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`cart-drawer${drawerOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your enquiry cart"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Enquiry Cart
            {count > 0 && <span className="cart-drawer-count">{count}</span>}
          </h2>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>Your enquiry cart is empty.</p>
            <p style={{ fontSize: 13 }}>Browse products and click the cart icon to add items.</p>
          </div>
        ) : (
          <ul className="cart-items" aria-label="Cart items">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                ) : (
                  <div className="cart-item-img-placeholder" aria-hidden="true" />
                )}

                <div className="cart-item-info">
                  <Link
                    to={`/product/${encodeURIComponent(item.slug)}`}
                    className="cart-item-name"
                    onClick={closeDrawer}
                  >
                    {item.name}
                  </Link>
                  {item.brandName && <span className="cart-item-brand">{item.brandName}</span>}
                  {item.productCode && <span className="cart-item-code">#{item.productCode}</span>}

                  {/* Qty controls */}
                  <div className="cart-item-qty">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => setQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <p className="cart-footer-note">
              Prices are discussed over WhatsApp. Tap below to send your enquiry directly.
            </p>
            <a
              href={c.wa(buildWhatsAppMessage())}
              className="cart-wa-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              📲 Send Enquiry on WhatsApp
            </a>
            <button type="button" className="cart-clear-btn" onClick={clear}>
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

