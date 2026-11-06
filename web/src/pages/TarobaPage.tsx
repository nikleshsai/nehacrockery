// Auto-ported from legacy frontend/taroba.html (content preserved, now React).
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';
import { TarobaProducts } from '@/components/site/TarobaProducts';

export default function TarobaPage() {
  const c = useContact();
  return (
    <>
      <Seo title="Taroba – Our Own Brand | Neha Crockery House" description="Taroba is the in-house brand of Neha Crockery House, Chennai, covering crockery, glassware, ceramic products, flasks and cutlery. Enquire for the current range." />
      <section className="taroba-hero" aria-labelledby="taroba-hero-heading">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container taroba-hero-inner">
          <div className="taroba-hero-emblem" aria-hidden="true">
            <div className="taroba-large-letter">
              T
            </div>
          </div>
          <div className="taroba-hero-text">
            <p className="section-eyebrow page-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              OUR OWN BRAND
            </p>
            <h1 className="page-banner-title" id="taroba-hero-heading">
              Taroba
            </h1>
            <p className="page-banner-desc">
              The in-house brand of Neha Crockery House — quality kitchen and tableware under our own trusted label.
            </p>
            <div className="page-banner-ctas">
              <a href={c.wa("Hello, I want to enquire about Taroba brand products.")} className="btn-whatsapp" target="_blank" rel="noopener">
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="taroba-story-section" aria-labelledby="taroba-story-heading">
        <div className="container taroba-story-inner">
          <div className="taroba-story-text">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              OUR STORY
            </p>
            <h2 className="section-title" id="taroba-story-heading">
              The Taroba
              <br />
              <em>
                Brand Story
              </em>
            </h2>
            <p className="about-lead">
              <strong>
                Taroba
              </strong>
              {' '}is our very own in-house brand of kitchen and tableware, offered through Neha Crockery House.
            </p>
            <p className="about-body">
              Taroba gives our customers a trusted, homegrown alternative to the other brands we stock, backed by the same standards we apply across our showroom.
            </p>
            <p className="about-body">
              Taroba covers four core categories: crockery &amp; glassware, ceramic products, flasks and cutlery. Detailed product information will be added soon — please enquire for the current range.
            </p>
          </div>
          <div className="taroba-story-info">
            <div className="taroba-info-card">
              <span className="taroba-info-year">
                T
              </span>
              {' '}
              <span className="taroba-info-label">
                In-house Brand
              </span>
            </div>
            <div className="taroba-categories-list">
              <h3 className="taroba-cat-list-title">
                Taroba Covers
              </h3>
              <ul className="taroba-cat-list">
                <li>
                  <span className="taroba-cat-icon">
                    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="5" />
                    </svg>
                  </span>
                  Crockery &amp; Glassware
                </li>
                <li>
                  <span className="taroba-cat-icon">
                    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8 3h8M9 3c0 3-3 4-3 9a6 6 0 0 0 12 0c0-5-3-6-3-9M9 21h6" />
                    </svg>
                  </span>
                  Ceramic Products
                </li>
                <li>
                  <span className="taroba-cat-icon">
                    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
                    </svg>
                  </span>
                  Flasks
                </li>
                <li>
                  <span className="taroba-cat-icon">
                    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 4.5-3 7h3v11" />
                    </svg>
                  </span>
                  Cutlery
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="taroba-products-section" aria-labelledby="taroba-products-heading">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              TAROBA COLLECTION
            </p>
            <h2 className="section-title" id="taroba-products-heading">
              Taroba
              <br />
              <em>
                Products
              </em>
            </h2>
            <p className="section-description">
              Taroba product details are being prepared. Enquire on WhatsApp for the current range.
            </p>
          </div>
          <TarobaProducts />
        </div>
      </section>
      <section className="taroba-enquiry-strip" aria-label="Taroba enquiry">
        <div className="container taroba-enquiry-inner">
          <div className="taroba-enq-emblem" aria-hidden="true">
            T
          </div>
          <div className="taroba-enq-text">
            <h2>
              Enquire About Taroba Products
            </h2>
            <p>
              Contact us for wholesale pricing on Taroba brand products. Available for retailers, hotels and distributors.
            </p>
            <div className="taroba-enq-ctas">
              <a href={c.wa("Hello, I want to enquire about Taroba brand products and pricing.")} className="btn-whatsapp" target="_blank" rel="noopener">
                WhatsApp Enquiry
              </a>
              {' '}
              <a href={c.telHref} className="btn-primary">
                Call Now &#8594;
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
