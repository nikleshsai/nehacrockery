import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContact } from '@/lib/settings';
import { useCart } from '@/lib/cart';
import { WhatsAppIcon } from './WhatsAppIcon';

const NAV = [
  { to: '/', label: 'Home', id: 'home', end: true },
  { to: '/about', label: 'About', id: 'about' },
  { to: '/products', label: 'Products', id: 'products' },
  { to: '/brands', label: 'Brands', id: 'brands' },
  { to: '/taroba', label: 'Taroba', id: 'taroba' },
  { to: '/catalogue', label: 'Catalogue', id: 'catalogue' },
  { to: '/contact', label: 'Contact', id: 'contact' },
];

export function Header() {
  const c = useContact();
  const { count, openCart } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Keep `inert` attribute synchronized so hidden mobile links are removed from tab order
  useEffect(() => {
    const el = mobileMenuRef.current;
    if (!el) return;
    if (open) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [open]);

  // Close the mobile menu on Escape or when resizing to desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        document.getElementById('mobile-toggle')?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 992 && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const enquiry = 'Hello, I would like to enquire about your products.';

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`} id="site-header">
      <div className="header-inner container">
        <Link to="/" className="logo-link" id="logo-link">
          <img src="/assets/images/logo.jpeg" alt="" className="header-logo-img" />
          <div className="logo-text">
            <span className="logo-name">Neha Crockery</span>{' '}
            <span className="logo-tagline">House</span>
          </div>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <ul className="desktop-nav-list" role="list">
            {NAV.map((n) => (
              <li key={n.id}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  id={`dnav-${n.id}`}
                  className={({ isActive }) => `desktop-nav-link${isActive ? ' active' : ''}`}
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-controls">
          <button
            type="button"
            className="nch-cart-btn"
            aria-label={`Open cart${count > 0 ? ` (${count} item${count !== 1 ? 's' : ''})` : ''}`}
            onClick={openCart}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="20" r="1.4"/>
              <circle cx="18" cy="20" r="1.4"/>
              <path d="M2 3h3l2.7 12.4a1 1 0 001 .8h8.9a1 1 0 001-.8L20 7H6"/>
            </svg>
            {count > 0 && <span className="nch-cart-count">{count}</span>}
          </button>
          <a
            href={c.wa(enquiry)}
            className="header-whatsapp-btn"
            id="header-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Neha Crockery House on WhatsApp"
          >
            <WhatsAppIcon />
            <span>WhatsApp</span>
          </a>
          <button
            type="button"
            className={`mobile-toggle${open ? ' open' : ''}`}
            id="mobile-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`mobile-menu${open ? ' open' : ''}`}
        id="mobile-menu"
        aria-hidden={!open}
      >
        <nav aria-label="Mobile navigation">
          <ul className="mobile-nav-list" role="list">
            {NAV.map((n) => (
              <li key={n.id}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  id={`mnav-${n.id}`}
                  className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
            <li>
              <a
                href={c.wa(enquiry)}
                className="btn-primary mobile-cta"
                id="mnav-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Enquiry &#8594;
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
