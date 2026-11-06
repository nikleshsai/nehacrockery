import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page Not Found – Neha Crockery House" />
      <section className="page-banner" aria-label="Page not found">
        <div className="page-banner-bg" aria-hidden="true" />
        <div className="container page-banner-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p className="section-eyebrow page-eyebrow" style={{ justifyContent: 'center' }}>
            <span className="eyebrow-line" aria-hidden="true" /> 404 ERROR
          </p>
          <h1 className="page-banner-title">Page Not Found</h1>
          <p className="page-banner-desc" style={{ margin: '0 auto 28px' }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary">
              Back to Home &#8594;
            </Link>
            <Link to="/products" className="btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

