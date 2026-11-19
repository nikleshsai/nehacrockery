import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { useContact } from '@/lib/settings';

export function CartDrawer() {
  const { items, count, remove, updateQty, clear, drawerOpen, closeDrawer } = useCart();
  const c = useContact();
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer]);

  // Build WhatsApp message from cart items
  const waMessage = items.length
    ? `Hello, I'd like to enquire about the following products:\n` +
      items.map((i) => `- ${i.name}${i.productCode ? ` (${i.productCode})` : ''} × ${i.qty}`).join('\n')
    : '';

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`cart-overlay${drawerOpen ? ' open' : ''}`}
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`cart-drawer${drawerOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Enquiry cart"
      >
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Enquiry Cart
            {count > 0 && <span className="cart-drawer-count">{count}</span>}
          </h2>
          <button className="cart-drawer-close" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>Your cart is empty</p>
            <Link to="/products" className="btn-primary" onClick={closeDrawer}>Browse Products</Link>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                  )}
                  {!item.image && (
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
                    {item.brand && <span className="cart-item-brand">{item.brand}</span>}
                    {item.productCode && (
                      <span className="cart-item-code">Code: {item.productCode}</span>
                    )}
                    <div className="cart-item-qty">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                        disabled={item.qty <= 1}
                      >−</button>
                      <span className="cart-qty-value">{item.qty}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >✕</button>
                </li>
              ))}
            </ul>

            <div className="cart-drawer-footer">
              <p className="cart-footer-note">
                💡 Wholesale pricing available. We'll confirm availability and pricing via WhatsApp or phone.
              </p>
              <a
                href={c.wa(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary cart-wa-btn"
              >
                Enquire via WhatsApp ({count} item{count !== 1 ? 's' : ''})
              </a>
              <button className="cart-clear-btn" onClick={clear}>
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
