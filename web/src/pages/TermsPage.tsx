// Auto-ported from legacy frontend/terms.html (content preserved, now React).
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';

export default function TermsPage() {
  const c = useContact();
  return (
    <>
      <Seo title="Terms & Conditions – Neha Crockery House" description="Terms and conditions for using the Neha Crockery House website, including product information, pricing and enquiries." />
      <section className="page-banner" aria-label="Terms banner">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            LEGAL
          </p>
          <h1 className="page-banner-title">
            Terms &amp; Conditions
          </h1>
          <p className="page-banner-desc">
            Last reviewed: October 2026
          </p>
        </div>
      </section>
      <section className="legal-section" aria-labelledby="terms-heading">
        <div className="container legal-content">
          <h2 id="terms-heading" className="legal-main-title">
            Terms &amp; Conditions
          </h2>
          <p className="legal-intro">
            By accessing and using the Neha Crockery House website, you accept these Terms &amp; Conditions in full.
          </p>
          <div className="legal-block">
            <h3>
              1. Website Use
            </h3>
            <p>
              This website is operated by Neha Crockery House for the purpose of providing information about our products and services. Content is provided for informational purposes only.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              2. Product Information
            </h3>
            <p>
              Product descriptions, images and availability on this website are subject to change without notice. All prices and availability must be confirmed directly with us before placing any order. We do not guarantee the accuracy of all product information displayed.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              3. Pricing
            </h3>
            <p>
              Prices displayed on product cards represent indicative MRP or reference pricing where available, while other items are listed as price on request. Wholesale, trade, and bulk pricing is subject to minimum order quantities and may vary. Final prices are not binding until confirmed in writing by Neha Crockery House upon enquiry.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              4. Intellectual Property
            </h3>
            <p>
              All content on this website, including text, images, logos and the Taroba brand name, belongs to Neha Crockery House. Third-party brand names belong to their respective owners. Unauthorised use, reproduction or distribution is prohibited.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              5. Enquiries &amp; WhatsApp
            </h3>
            <p>
              Enquiries submitted via our website form or WhatsApp do not constitute a confirmed order. All orders are subject to stock availability and confirmed by Neha Crockery House in writing.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              6. Limitation of Liability
            </h3>
            <p>
              Neha Crockery House is not liable for any indirect, incidental or consequential damages arising from the use of this website or reliance on information provided herein.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              7. Governing Law
            </h3>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Chennai, Tamil Nadu.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              8. Contact
            </h3>
            <p>
              <strong>
                Neha Crockery House
              </strong>
              <br />
              {c.address}
              <br />
              <a href={c.telHref}>
                {c.phoneDisplay}
              </a>
              <br />
              <a href={c.mailHref}>
                {c.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
