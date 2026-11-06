// Auto-ported from legacy frontend/catalogue.html (content preserved, now React).
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';
import { useCatalogue } from '@/lib/hooks';

export default function CataloguePage() {
  const c = useContact();
  const cat = useCatalogue();
  return (
    <>
      <Seo title="Download Catalogue – Neha Crockery House" description="Download the Neha Crockery House product catalogue featuring crockery, cutlery, glassware and more. Available for retailers, wholesalers and hospitality businesses." />
      <section className="page-banner" aria-label="Catalogue page banner">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            PRODUCT CATALOGUE
          </p>
          <h1 className="page-banner-title">
            Download Our
            <br />
            Catalogue
          </h1>
          <p className="page-banner-desc">
            Get our complete product catalogue featuring crockery, cutlery, glassware and all categories — ideal for retailers and wholesale buyers.
          </p>
        </div>
      </section>
      <section className="catalogue-section" aria-labelledby="catalogue-heading">
        <div className="container catalogue-inner">
          <div className="catalogue-download-card" id="catalogue-card">
            <div className="catalogue-icon" aria-hidden="true">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2 className="catalogue-card-title" id="catalogue-heading">
              Neha Crockery House
              <br />
              <em>
                Product Catalogue
              </em>
            </h2>
            <p className="catalogue-card-desc">
              Our catalogue includes all 8 product categories: Crockery &amp; Dinnerware, Cutlery, Glassware &amp; Bottles, Kitchenware, Hotelware &amp; Institutional Supply, Cookware, Storage &amp; Containers, and Stainless Steel Items.
            </p>
            <div className="catalogue-meta">
              <span className="catalogue-meta-item">
                &#9670; All 8 Product Categories
              </span>
              {' '}
              <span className="catalogue-meta-item">
                &#9670; Taroba Brand
              </span>
              {' '}
              <span className="catalogue-meta-item">
                &#9670; Ideal for Wholesale Buyers
              </span>
            </div>
            {cat && (
                  <a href={cat.fileUrl} className="catalogue-download-btn" id="catalogue-download-btn" target="_blank" rel="noopener noreferrer" download aria-label="Download product catalogue PDF">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download Catalogue (PDF)
                  </a>
                )}
            <p className="catalogue-note" id="catalogue-availability-note">
                  {cat
                    ? `${cat.title || 'Product catalogue'}${cat.version ? ` — version ${cat.version}` : ''} (PDF)`
                    : 'Our latest catalogue is being updated. Request it on WhatsApp and we will share it right away.'}
                </p>
          </div>
          <div className="catalogue-alt-section">
            <div className="catalogue-alt-divider">
              <span>
                or
              </span>
            </div>
            <div className="catalogue-alt-card">
              <h3 className="catalogue-alt-title">
                Request via WhatsApp
              </h3>
              <p className="catalogue-alt-desc">
                Send us a message on WhatsApp and we'll share the latest catalogue and product details directly with you.
              </p>
              <a href={c.wa("Hello, I would like to request the Neha Crockery House product catalogue.")} className="btn-whatsapp" id="catalogue-whatsapp" target="_blank" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {' '}Request on WhatsApp &#8594;
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
