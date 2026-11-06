import { Link } from 'react-router-dom';
import { useContact } from '@/lib/settings';

const CATEGORIES: Array<[string, string]> = [
  ['crockery', 'Crockery & Dinnerware'],
  ['cutlery', 'Cutlery'],
  ['glassware', 'Glassware & Bottles'],
  ['kitchenware', 'Kitchenware'],
  ['hotelware', 'Hotelware & Institutional'],
  ['cookware', 'Cookware'],
  ['storage-containers', 'Storage & Containers'],
  ['stainless-steel-items', 'Stainless Steel Items'],
];

export function Footer() {
  const c = useContact();
  return (
    <footer className="site-footer" id="site-footer" role="contentinfo">
      <div className="footer-top">
        <div className="container footer-top-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/assets/images/logo.jpeg" alt="" className="footer-logo-img" />
              <div className="footer-logo-text">
                <span className="footer-logo-name">Neha Crockery</span>{' '}
                <span className="footer-logo-sub">House</span>
              </div>
            </div>
            <address className="footer-address">
              <span>{c.address}</span>
              <br />
              <a href={c.telHref} className="footer-link" title={`Call ${c.phoneDisplay}`}>
                {c.phoneDisplay}
              </a>
              <br />
              <a
                href={c.wa('Hello, I would like to enquire about your products.')}
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {c.whatsappDisplay}
              </a>
              <br />
              <a href={c.mailHref} className="footer-link">
                {c.email}
              </a>
            </address>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links" role="list">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/products" className="footer-link">Our Products</Link></li>
              <li><Link to="/brands" className="footer-link">Brands We Deal In</Link></li>
              <li><Link to="/taroba" className="footer-link">Taroba Brand</Link></li>
              <li><Link to="/catalogue" className="footer-link">Download Catalogue</Link></li>
              <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-links" role="list">
              {CATEGORIES.map(([slug, label]) => (
                <li key={slug}>
                  <Link to={`/products?category=${slug}`} className="footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <ul className="footer-links" role="list">
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer-link">Terms &amp; Conditions</Link></li>
            </ul>
            <h4 className="footer-col-title" style={{ marginTop: 24 }}>Opening Hours</h4>
            <p className="footer-hours">
              Mon &ndash; Sat: 10:30 AM &ndash; 7:30 PM
              <br />
              <span className="closed-text">Sunday: Closed</span>
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} Neha Crockery House. All rights reserved. &nbsp;|&nbsp; Taroba is the
            in-house brand of Neha Crockery House.
          </p>
          <p className="footer-location">Park Town, Chennai, Tamil Nadu</p>
        </div>
      </div>
    </footer>
  );
}
