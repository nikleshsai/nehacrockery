// Auto-ported from legacy frontend/index.html (content preserved, now React).
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';
import { useStatCounters } from '@/lib/hooks';

export default function HomePage() {
  const c = useContact();
  useStatCounters();
  return (
    <>
      <Seo title="Neha Crockery House – Crockery, Cutlery & Glassware Wholesaler | Chennai" description="Neha Crockery House is a Chennai wholesaler of crockery, cutlery and glassware, established in 1994. Serving retailers, hotels and restaurants across Tamil Nadu from our Park Town showroom." />
      <section className="hero-section" id="hero" aria-labelledby="hero-heading">
        <div className="hero-bg" aria-hidden="true">
          <img src="/assets/images/marble_hero_bg.jpg" alt="" className="hero-bg-img" />
        </div>
        <div className="hero-content container">
          <div className="hero-left">
            <p className="hero-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              {' '}CROCKERY &nbsp;&middot;&nbsp; CUTLERY &nbsp;&middot;&nbsp; GLASSWARE &nbsp;&middot;&nbsp; WHOLESALE
            </p>
            <h1 className="hero-heading" id="hero-heading">
              Chennai's Premier
              <br />
              <em>
                Crockery &amp; Glassware
              </em>
              <br />
              Wholesaler
            </h1>
            <p className="hero-description">
              Serving retailers, hotels, restaurants and institutions across Tamil Nadu for over{' '}
              <strong>
                30 years
              </strong>
              . From premium crockery to elegant glassware &mdash; quality you can trust, pricing built for business.
            </p>
            <div className="hero-ctas">
              <a href={c.wa("Hello, I would like to enquire about wholesale pricing.")} className="btn-whatsapp" id="hero-whatsapp-cta" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {' '}WhatsApp Enquiry
              </a>
              {' '}
              <a href={c.telHref} className="btn-primary" id="hero-call-cta" title={`Call ${c.phoneDisplay}`}>
                Call {c.phoneDisplay} &#8594;
              </a>
              {' '}
              <Link to="/products" className="btn-secondary" id="hero-products-cta">
                Explore Products
              </Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-img-frame">
              <img src="/assets/images/glassware_hero.jpg" alt="Premium crockery and glassware collection" className="hero-img" />
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="container hero-stats-inner">
            <div className="stat-item">
              <span className="stat-number" data-target="30" data-suffix="+">
                30+
              </span>
              {' '}
              <span className="stat-label">
                Years of Experience
              </span>
            </div>
            <div className="stat-divider" aria-hidden="true">
            </div>
            <div className="stat-item">
              <span className="stat-number" data-target="5000" data-suffix="+">
                5000+
              </span>
              {' '}
              <span className="stat-label">
                Products Available
              </span>
            </div>
            <div className="stat-divider" aria-hidden="true">
            </div>
            <div className="stat-item">
              <span className="stat-number">
                8
              </span>
              {' '}
              <span className="stat-label">
                Product Categories
              </span>
            </div>
            <div className="stat-divider" aria-hidden="true">
            </div>
            <div className="stat-item">
              <span className="stat-number">
                B2B
              </span>
              {' '}
              <span className="stat-label">
                Wholesale Specialists
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="home-pages-section" aria-labelledby="explore-heading">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              EXPLORE
            </p>
            <h2 className="section-title" id="explore-heading">
              What We{' '}
              <em>
                Offer
              </em>
            </h2>
            <p className="section-description">
              Navigate to any section of our website to learn more about our products and services.
            </p>
          </div>
          <div className="home-page-cards">
            <Link to="/products" className="home-page-card" id="hp-products">
              <span className="home-page-card-icon">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </span>
              <h3 className="home-page-card-title">
                Products
              </h3>
              <p className="home-page-card-desc">
                Browse our full range of crockery, cutlery, glassware, melamineware, acrylicware, kitchenware and more.
              </p>
              <span className="home-page-card-cta">
                Browse Products &#8594;
              </span>
            </Link>
            {' '}
            <Link to="/brands" className="home-page-card" id="hp-brands">
              <span className="home-page-card-icon">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 12l-8 8-9-9V3h8zM7.5 7.5h.01" />
                </svg>
              </span>
              <h3 className="home-page-card-title">
                Brands
              </h3>
              <p className="home-page-card-desc">
                We stock products from leading brands alongside our own in-house brand, Taroba.
              </p>
              <span className="home-page-card-cta">
                View Brands &#8594;
              </span>
            </Link>
            {' '}
            <Link to="/taroba" className="home-page-card" id="hp-taroba">
              <span className="home-page-card-icon">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                </svg>
              </span>
              <h3 className="home-page-card-title">
                Taroba Brand
              </h3>
              <p className="home-page-card-desc">
                Our own in-house brand &mdash; covering crockery, glassware, ceramics, flasks and cutlery.
              </p>
              <span className="home-page-card-cta">
                Explore Taroba &#8594;
              </span>
            </Link>
            {' '}
            <Link to="/about" className="home-page-card" id="hp-about">
              <span className="home-page-card-icon">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-6h4v6" />
                </svg>
              </span>
              <h3 className="home-page-card-title">
                About Us
              </h3>
              <p className="home-page-card-desc">
                30+ years of wholesale experience from our Park Town, Chennai showroom. Learn our story.
              </p>
              <span className="home-page-card-cta">
                Our Story &#8594;
              </span>
            </Link>
            {' '}
            <Link to="/catalogue" className="home-page-card" id="hp-catalogue">
              <span className="home-page-card-icon">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8" />
                </svg>
              </span>
              <h3 className="home-page-card-title">
                Catalogue
              </h3>
              <p className="home-page-card-desc">
                Download our product catalogue or request it via WhatsApp for the latest range and pricing.
              </p>
              <span className="home-page-card-cta">
                Get Catalogue &#8594;
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
