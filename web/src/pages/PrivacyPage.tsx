// Auto-ported from legacy frontend/privacy.html (content preserved, now React).
import { Seo } from '@/components/Seo';
import { useContact } from '@/lib/settings';

export default function PrivacyPage() {
  const c = useContact();
  return (
    <>
      <Seo title="Privacy Policy – Neha Crockery House" description="How Neha Crockery House collects, stores and protects enquiry information submitted through this website." />
      <section className="page-banner" aria-label="Privacy Policy banner">
        <div className="page-banner-bg" aria-hidden="true">
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            LEGAL
          </p>
          <h1 className="page-banner-title">
            Privacy Policy
          </h1>
          <p className="page-banner-desc">
            Last reviewed: October 2026
          </p>
        </div>
      </section>
      <section className="legal-section" aria-labelledby="privacy-heading">
        <div className="container legal-content">
          <h2 id="privacy-heading" className="legal-main-title">
            Privacy Policy
          </h2>
          <p className="legal-intro">
            Neha Crockery House ("
            <strong>
              we
            </strong>
            ", "
            <strong>
              us
            </strong>
            ", "
            <strong>
              our
            </strong>
            ") operates this website. This Privacy Policy explains how we handle information when you visit our site or contact us.
          </p>
          <div className="legal-block">
            <h3>
              1. Information We Collect
            </h3>
            <p>
              When you use our enquiry form or contact us via WhatsApp, you may voluntarily provide:
            </p>
            <ul>
              <li>
                Your name
              </li>
              <li>
                Business or shop name
              </li>
              <li>
                Phone number / WhatsApp number
              </li>
              <li>
                Product enquiry details
              </li>
              <li>
                Email address, if you choose to provide one
              </li>
            </ul>
            <p>
              We do not collect any payment information on this website. This website does not currently use Google Analytics or advertising cookies.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              2. How We Use Your Information
            </h3>
            <p>
              Information you provide is used solely to:
            </p>
            <ul>
              <li>
                Respond to your product and pricing enquiries
              </li>
              <li>
                Share product information, catalogues or quotations you request
              </li>
              <li>
                Improve our website and customer service
              </li>
            </ul>
            <p>
              We do not sell, rent or share your personal information with third parties for marketing purposes.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              3. How Enquiries Are Stored
            </h3>
            <p>
              When you submit an enquiry form, the details you enter are saved in our secure database (hosted on Supabase PostgreSQL) so our team can follow up with you. Access is limited to authorised staff. After submitting, WhatsApp opens with your message pre-filled; anything you then send is handled by WhatsApp and is subject to WhatsApp's own privacy policy.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              4. Google Maps
            </h3>
            <p>
              Our website embeds Google Maps to display our showroom location. Google may collect data as described in Google's Privacy Policy when you interact with the map.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              5. Cookies
            </h3>
            <p>
              Google Analytics is not enabled on this website. We do not use advertising or tracking cookies. If we enable analytics in future, we will update this policy first. Embedded Google Maps may set its own cookies.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              6. Data Retention
            </h3>
            <p>
              We retain enquiry information only as long as needed to respond to your enquiry. You may request deletion of your information at any time by contacting us.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              7. Your Rights
            </h3>
            <p>
              You have the right to access, correct or request deletion of personal information you have provided to us. Contact us at the details below.
            </p>
          </div>
          <div className="legal-block">
            <h3>
              8. Contact Us
            </h3>
            <p>
              For privacy-related queries:
            </p>
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
