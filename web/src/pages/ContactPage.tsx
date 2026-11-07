// Auto-ported from legacy frontend/contact.html (content preserved, now React).
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';
import { EnquiryForm } from '@/components/site/EnquiryForm';
import { ShopGallery } from '@/components/site/ShopGallery';

export default function ContactPage() {
  const c = useContact();
  return (
    <>
      <Seo title="Contact Us – Neha Crockery House | Showroom at Memorial Hall Road, Park Town, Chennai" description="Visit Neha Crockery House at 13/3, Memorial Hall Road, Park Town, Chennai. Contact us for wholesale glassware, crockery and cutlery enquiries. Open Mon–Sat 10:30 AM–7:30 PM." />
      <section className="page-banner" aria-label="Contact page banner">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            GET IN TOUCH
          </p>
          <h1 className="page-banner-title">
            Contact Us
          </h1>
          <p className="page-banner-desc">
            Visit our Park Town showroom, call or WhatsApp us — we'd love to hear from you.
          </p>
        </div>
      </section>
      <section className="contact-section" id="contact" aria-labelledby="contact-heading">
        <div className="container contact-inner">
          <div className="contact-text-col">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              GET IN TOUCH
            </p>
            <h2 className="section-title" id="contact-heading">
              Visit Us at Our
              <br />
              <em>
                Park Town Showroom
              </em>
            </h2>
            <p className="contact-intro">
              Explore our extensive product collection in person. We welcome wholesale buyers, retailers, hotels, restaurants and institutions. Come see us at the heart of Chennai.
            </p>
            <div className="contact-info-col">
              <div className="contact-card" id="contact-address-card">
                <div className="contact-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className="contact-card-body">
                  <h3 className="contact-card-title">
                    Our Location
                  </h3>
                  <p className="contact-card-text">
                    {c.addressBr}
                  </p>
                  <a href={c.mapsUrl} className="contact-map-link" target="_blank" rel="noopener">
                    Get Directions &#8594;
                  </a>
                </div>
              </div>
              <div className="contact-card" id="contact-phone-card">
                <div className="contact-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.07 2.82 2 2 0 012.07.84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.75a16 16 0 006.29 6.29l1.08-1.22a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div className="contact-card-body">
                  <h3 className="contact-card-title">
                    Phone, WhatsApp &amp; Email
                  </h3>
                  <p className="contact-card-text" style={{ marginBottom: '6px' }}>
                    Phone:{' '}
                    <a href={c.telHref} className="contact-phone-link" id="contact-phone-link">
                      {c.phoneDisplay}
                    </a>
                  </p>
                  <p className="contact-card-text" style={{ marginBottom: '6px' }}>
                    WhatsApp:{' '}
                    <a href={c.wa("Hello, I would like to enquire about your products.")} target="_blank" rel="noopener" className="contact-phone-link" data-contact="whatsapp">
                      {c.whatsappDisplay}
                    </a>
                  </p>
                  <p className="contact-card-text" style={{ marginBottom: '10px' }}>
                    Email:{' '}
                    <a href={c.mailHref} className="contact-phone-link" data-contact="email">
                      {c.email}
                    </a>
                  </p>
                  <a href={c.wa("Hello, I would like to enquire about your products.")} className="btn-whatsapp contact-wa-btn" target="_blank" rel="noopener">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {' '}Chat on WhatsApp
                  </a>
                </div>
              </div>
              <div className="contact-card" id="contact-hours-card">
                <div className="contact-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="contact-card-body">
                  <h3 className="contact-card-title">
                    Working Hours
                  </h3>
                  <p className="contact-card-text">
                    <span className="hours-row">
                      {c.hours}
                    </span>
                    {' '}
                    <span className="hours-row">
                      <strong>
                        Sunday
                      </strong>
                      {' '}&nbsp;{' '}
                      <em className="closed-text">
                        Closed
                      </em>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="enquiry-form-wrap contact-form-wrap">
            <EnquiryForm source="website-contact" idPrefix="ct" />
          </div>
        </div>
      </section>
      <section className="map-section" id="location" aria-labelledby="map-contact-heading">
        <div className="container map-header">
          <p className="section-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            FIND US
          </p>
          <h2 className="section-title" id="map-contact-heading">
            Our
            <br />
            <em>
              Location
            </em>
          </h2>
          <p className="map-address" data-dynamic="address">
            {c.address}
          </p>
        </div>
        <div className="map-embed-wrap">
          <iframe className="map-embed" title="Neha Crockery House on Google Maps" src="https://www.google.com/maps?q=13%2F3%2C%20Memorial%20Hall%20Road%2C%20Rattan%20Bazaar%2C%20Park%20Town%2C%20Chennai%2C%20Tamil%20Nadu%20600003&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen>
          </iframe>
        </div>
        <div className="container map-footer">
          <a href={c.mapsUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">
            Get Directions &#8594;
          </a>
          {' '}
          <a href={c.telHref} className="btn-secondary" title={`Call ${c.phoneDisplay}`}>
            Call {c.phoneDisplay} &#8594;
          </a>
        </div>
      </section>
      <section className="shop-gallery-section" id="shop-gallery" aria-labelledby="gallery-heading">
        <div className="container">
          <p className="section-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            OUR SHOWROOM
          </p>
          <h2 className="section-title" id="gallery-heading">
            See Our
            <br />
            <em>
              Store &amp; Collection
            </em>
          </h2>
          <p className="section-desc" style={{ maxWidth: '560px', marginBottom: '2.5rem', color: 'var(--c-text-muted,#666)' }}>
            Take a visual tour of our Park Town showroom — thousands of products on display, ready to explore in person.
          </p>
          <ShopGallery />
        </div>
      </section>
    </>
  );
}
