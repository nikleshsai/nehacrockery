// Auto-ported from legacy frontend/about.html (content preserved, now React).
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';

export default function AboutPage() {
  return (
    <>
      <Seo title="About Us – Neha Crockery House | Crockery, Cutlery & Glassware Since 1994" description="Neha Crockery House, established in 1994, is a Chennai wholesaler of crockery, cutlery and glassware. Visit our showroom at Memorial Hall Road, Park Town." />
      <section className="page-banner" aria-label="About page banner">
        <div className="page-banner-bg" aria-hidden="true">
          <img src="/assets/images/marble_hero_bg.jpg" alt="" className="page-banner-bg-img" />
        </div>
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true">
            </span>
            {' '}OUR STORY
          </p>
          <h1 className="page-banner-title">
            About Us
          </h1>
          <p className="page-banner-desc">
            Crockery, cutlery and glassware for Tamil Nadu businesses — established 1994.
          </p>
        </div>
      </section>
      <section className="about-section" id="about" aria-labelledby="about-heading">
        <div className="container about-inner">
          <div className="about-img-col">
            <div className="about-img-backframe">
            </div>
            <div className="about-img-frame">
              <img src="/assets/images/crockery.png" alt="Neha Crockery House showroom displaying premium crockery and dinnerware sets" className="about-img" loading="lazy" />
              <div className="about-img-gradient">
              </div>
              <div className="about-img-strip">
                <span className="about-strip-title">
                  Our Showroom
                </span>
                {' '}
                <span className="about-strip-location">
                  Park Town, Chennai
                </span>
              </div>
              <div className="about-img-accent">
              </div>
            </div>
            <div className="about-badge">
              <span className="about-badge-number">
                30+
              </span>
              {' '}
              <span className="about-badge-text">
                Years
                <br />
                Established
              </span>
            </div>
            <div className="about-float-card">
              <span className="about-float-icon">
                &#9670;
              </span>
              <div>
                <strong className="about-float-title">
                  Premium Collection
                </strong>
                <p className="about-float-sub">
                  Crockery, Cutlery &amp; Glassware
                </p>
              </div>
            </div>
          </div>
          <div className="about-text-col">
            <p className="section-eyebrow">
              <span className="eyebrow-line" aria-hidden="true">
              </span>
              {' '}OUR STORY
            </p>
            <h2 className="section-title" id="about-heading">
              Established 1994
              <br />
              <em>
                Crockery, Cutlery &amp; Glassware
              </em>
            </h2>
            <p className="about-lead">
              Neha Crockery House is a Chennai wholesaler of crockery, cutlery and glassware, established in 1994. For more than 30 years we have supplied retailers, hotels, restaurants and institutions across Tamil Nadu.
            </p>
            <p className="about-body">
              Our range covers dinnerware and crockery, stainless steel cutlery and glassware, from trusted brands such as Luminarc, Larah, KOKO and Krista, alongside our in-house brand Taroba. We aim to keep ordering simple and service dependable.
            </p>
            <p className="about-body">
              Our showroom is at 13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai. We welcome wholesale buyers, retailers and hospitality businesses.
            </p>
            <ul className="about-features" role="list">
              <li className="about-feature-item" id="feature-quality">
                <span className="feature-icon" aria-hidden="true">
                  &#9670;
                </span>
                <div>
                  <strong className="feature-title">
                    Premium Quality Selection
                  </strong>
                  <p className="feature-desc">
                    We stock crockery, cutlery and glassware from established brands.
                  </p>
                </div>
              </li>
              <li className="about-feature-item" id="feature-wholesale">
                <span className="feature-icon" aria-hidden="true">
                  &#9670;
                </span>
                <div>
                  <strong className="feature-title">
                    Wholesale Specialists
                  </strong>
                  <p className="feature-desc">
                    Tailored for businesses, hotels, restaurants, and retailers across Tamil Nadu.
                  </p>
                </div>
              </li>
              <li className="about-feature-item" id="feature-experience">
                <span className="feature-icon" aria-hidden="true">
                  &#9670;
                </span>
                <div>
                  <strong className="feature-title">
                    30+ Years of Trust
                  </strong>
                  <p className="feature-desc">
                    Serving Chennai and Tamil Nadu since 1994.
                  </p>
                </div>
              </li>
            </ul>
            <Link to="/contact" className="btn-primary" id="about-cta">
              Visit Our Showroom{' '}
              <span className="btn-arrow" aria-hidden="true">
                &#8594;
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
