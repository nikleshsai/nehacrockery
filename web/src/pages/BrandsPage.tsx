// Auto-ported from legacy frontend/brands.html (content preserved, now React).
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';
import { BrandsGrid } from '@/components/site/BrandsGrid';

export default function BrandsPage() {
  const c = useContact();
  return (
    <>
      <Seo title="Brands We Deal In – Neha Crockery House" description="Discover the leading crockery, cutlery and glassware brands stocked by Neha Crockery House, Park Town Chennai — including our own in-house brand Taroba." />
      <section className="page-banner" aria-label="Brands page banner">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            OUR PORTFOLIO
          </p>
          <h1 className="page-banner-title">
            Brands We Deal In
          </h1>
          <p className="page-banner-desc">
            Quality tableware from trusted brands — including our own in-house brand, Taroba.
          </p>
        </div>
      </section>
      <section className="brand-highlight-section" aria-labelledby="taroba-brand-heading">
        <div className="container brand-highlight-inner">
          <div className="brand-highlight-badge">
            <span className="brand-highlight-letter">
              T
            </span>
            <span className="brand-highlight-badge-sub">EST. 2016</span>
          </div>
          <div className="brand-highlight-text">
            <span className="brand-own-tag">
              &#9670; OUR FLAGSHIP IN-HOUSE BRAND
            </span>
            <h2 className="brand-highlight-title" id="taroba-brand-heading">
              Taroba
            </h2>
            <p className="brand-highlight-desc">
              Taroba is the officially registered in-house brand of Neha Crockery House, crafted for discerning homes, hotels, and banquets — spanning fine crockery &amp; glassware, ceramic dinnerware, vacuum flasks, and stainless steel cutlery.
            </p>
            <div className="taroba-categories" style={{ marginBottom: 20 }}>
              <span className="taroba-cat-tag">Crockery &amp; Glassware</span>
              <span className="taroba-cat-tag">Ceramic Tableware</span>
              <span className="taroba-cat-tag">Insulated Flasks</span>
              <span className="taroba-cat-tag">Stainless Cutlery</span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/taroba" className="btn-primary">
                Explore Taroba &#8594;
              </Link>
              <Link to="/products?brand=taroba" className="btn-outline">
                View Taroba Products
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="all-brands-section" aria-labelledby="all-brands-heading">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              BRANDS WE STOCK
            </p>
            <h2 className="section-title" id="all-brands-heading">
              Our Brand
              <br />
              <em>
                Portfolio
              </em>
            </h2>
            <p className="section-description">
              We carry products from reputed manufacturers across India and beyond. Every brand below is stocked at our Park Town showroom.
            </p>
          </div>
          <BrandsGrid />
        </div>
      </section>
      <section className="brands-enquiry-strip" aria-label="Brand enquiry CTA">
        <div className="container brands-enquiry-inner">
          <h2 className="brands-enquiry-title">
            Looking for a specific brand?
          </h2>
          <p className="brands-enquiry-desc">
            Contact us and we'll check availability or source it for you.
          </p>
          <div className="brands-enquiry-ctas">
            <a href={c.wa("Hello, I am looking for products from a specific brand.")} className="btn-whatsapp" target="_blank" rel="noopener noreferrer">
              WhatsApp Us
            </a>
            {' '}
            <a href={c.telHref} className="btn-primary" title={`Call ${c.phoneDisplay}`}>
              Call {c.phoneDisplay} &#8594;
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
