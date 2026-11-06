import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { ProductCard } from '@/components/site/ProductCard';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { request } from '@/lib/api';
import { useApiData } from '@/lib/hooks';
import { useContact } from '@/lib/settings';
import type { CustomerType, Product } from '@/lib/types';

const CAT_ICONS: Record<string, string> = {
  crockery: '🍽',
  'crockery-dinnerware': '🍽',
  cutlery: '🍴',
  glassware: '🥂',
  'glassware-bottles': '🥂',
  melamineware: '🥣',
  acrylicware: '🥤',
  kitchenware: '🍳',
  wooden: '🪵',
  'wooden-handicrafts': '🪵',
  hotelware: '🏨',
};

const CUSTOMER_TYPES: Array<{ value: CustomerType; label: string }> = [
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'HOTEL', label: 'Hotel / Restaurant' },
  { value: 'INSTITUTION', label: 'Institution' },
];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const c = useContact();

  const { data: product, loading, error } = useApiData<Product>(
    slug ? `/products/${encodeURIComponent(slug)}` : null,
  );

  const catSlug = product?.category?.slug || '';
  const { data: relatedRaw } = useApiData<Product[]>(
    catSlug ? `/products?active=true&category=${encodeURIComponent(catSlug)}&pageSize=8` : null,
  );

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Order modal state
  const [customerType, setCustomerType] = useState<CustomerType>('RETAILER');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setActiveImgIdx(0);
    setModalOpen(false);
    setSubmitSuccess(false);
    setSubmitError('');
  }, [slug]);

  if (loading) {
    return (
      <section className="product-detail-section">
        <div className="container">
          <div id="product-loading">
            <div className="product-detail-grid">
              <div>
                <div className="skeleton skeleton-img" />
              </div>
              <div>
                <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 14, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 20, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 50, marginBottom: 14, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, marginBottom: 10, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, marginBottom: 10, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="product-detail-section">
        <div className="container">
          <div id="product-error" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: 56, marginBottom: 16 }}>&#128269;</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: '#1a2744', marginBottom: 10 }}>
              Product not found
            </h2>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 14, color: '#666', marginBottom: 24 }}>
              This product may have been removed or the link is invalid.
            </p>
            <Link to="/products" className="btn-primary">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const icon = CAT_ICONS[catSlug] || '📦';
  const images = product.images ?? [];
  const mainImage = images[activeImgIdx]?.imageUrl ?? images[0]?.imageUrl;
  const price = product.catalogueMrp ?? product.mrp;

  const specs: Array<[string, string | number]> = [];
  if (product.category?.name) specs.push(['Category', product.category.name]);
  if (product.collection) specs.push(['Collection', product.collection]);
  if (product.material) specs.push(['Material', product.material]);
  if (product.capacity) specs.push(['Capacity', product.capacity]);
  if (product.dimensions) specs.push(['Dimensions', product.dimensions]);
  if (product.colourFinish) specs.push(['Colour/Finish', product.colourFinish]);
  if (product.setContents) specs.push(['Set Contents', product.setContents]);
  if (product.piecesPerSet) specs.push(['Pieces Per Set', product.piecesPerSet]);
  if (product.caseQty) specs.push(['Case Qty', product.caseQty]);
  if (product.packagingInformation) specs.push(['Packaging', product.packagingInformation]);

  const waMessage = `Hello, I'd like to enquire about: ${product.name}${product.productCode ? ` (${product.productCode})` : '.'}`;
  const related = (relatedRaw ?? []).filter((x) => x.id !== product.id).slice(0, 4);

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!name.trim() || !phone.trim()) {
      setSubmitError('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await request('/enquiries', {
        method: 'POST',
        body: {
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          customerType,
          productId: product.id,
          quantity: quantity.trim() || undefined,
          message:
            message.trim() ||
            `Order enquiry for ${product.name}${product.productCode ? ` (${product.productCode})` : ''}`,
          source: 'website-order',
        },
      });
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit enquiry. Please try WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title={`${product.seoTitle || product.name} – Neha Crockery House`}
        description={(product.seoDescription || product.description || `${product.name} wholesale at Neha Crockery House, Chennai.`).slice(0, 160)}
      />

      <section className="product-detail-section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/products">Products</Link>
            {product.category && (
              <>
                <span className="breadcrumb-sep">/</span>
                <Link to={`/products?category=${encodeURIComponent(product.category.slug)}`}>
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="breadcrumb-sep">/</span>
            <span id="breadcrumb-name">{product.name}</span>
          </nav>

          <div id="product-detail" style={{ marginTop: 24 }}>
            <div className="product-detail-grid">
              <div className="product-gallery">
                <div className="product-main-img" id="product-main-img">
                  {mainImage ? (
                    <img src={mainImage} alt={product.name} />
                  ) : (
                    <span id="product-img-placeholder">{icon}</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="product-thumb-row" id="product-thumbs">
                    {images.map((img, idx) => (
                      <img
                        key={img.id || idx}
                        src={img.imageUrl}
                        alt={img.altText || `View ${idx + 1}`}
                        className={`product-thumb${idx === activeImgIdx ? ' active' : ''}`}
                        onClick={() => setActiveImgIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="product-info">
                {product.brand && (
                  <div className="product-brand-badge" id="product-brand">
                    {product.brand.name}
                  </div>
                )}
                <h1 className="product-detail-name" id="product-name">
                  {product.name}
                </h1>
                {product.productCode && (
                  <p className="product-detail-code" id="product-code">
                    Product Code: {product.productCode}
                  </p>
                )}

                {price != null && Number(price) > 0 && (
                  <div className="product-price-block" id="product-price-block">
                    <span className="product-price-main" id="product-price">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </span>
                    <span className="product-price-label" id="product-price-unit">
                      per {product.priceUnit || 'piece'}
                    </span>
                    <span className="product-price-note">Wholesale pricing available</span>
                  </div>
                )}

                {product.description && (
                  <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>
                    {product.description}
                  </p>
                )}

                <div className="product-specs" id="product-specs">
                  <div className="product-specs-title">Product Details</div>
                  <div id="specs-list">
                    {specs.length > 0 ? (
                      specs.map(([label, val]) => (
                        <div className="spec-row" key={label}>
                          <span className="spec-label">{label}</span>
                          <span className="spec-value">{val}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: '#999' }}>
                        Contact us for specifications.
                      </p>
                    )}
                  </div>
                </div>

                {product.features && product.features.length > 0 && (
                  <ul className="product-features" id="product-features">
                    {product.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}

                <div className="product-order-cta">
                  <div className="product-order-cta-title">Ready to Order?</div>
                  <div className="product-order-cta-sub">
                    Request wholesale pricing or place an order enquiry. We confirm availability and payment by phone/WhatsApp.
                  </div>
                  <button
                    type="button"
                    className="btn-order-primary"
                    id="btn-place-order"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setSubmitError('');
                      setModalOpen(true);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    Order / Enquire Now
                  </button>
                  <a
                    id="btn-whatsapp-product"
                    href={c.wa(waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-wa-outline"
                  >
                    <WhatsAppIcon size={16} />
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="related-section" id="related-section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p className="section-eyebrow">
                <span className="eyebrow-line" />
                MORE PRODUCTS
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 400, color: '#1a2744' }}>
                Similar Products
              </h2>
            </div>
            <div className="related-grid" id="related-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} cta="View Details →" />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link to="/products" className="btn-secondary">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Order / Enquiry Modal */}
      <div
        className={`order-modal-overlay${modalOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="order-modal">
          <div className="order-modal-header">
            <h2 className="order-modal-title" id="order-modal-title">
              Order / Wholesale Enquiry
            </h2>
            <button
              type="button"
              className="order-modal-close"
              aria-label="Close"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
          </div>
          <div className="order-modal-body">
            <div className="order-product-preview">
              <span className="order-product-preview-icon">{icon}</span>
              <div>
                <div className="order-product-name">{product.name}</div>
                <div className="order-product-brand">
                  {product.brand?.name || 'Neha Crockery House'}
                  {product.productCode ? ` · ${product.productCode}` : ''}
                </div>
              </div>
            </div>

            {submitSuccess ? (
              <div className="order-success">
                <div className="order-success-icon">✓</div>
                <h3 className="order-success-title">Enquiry Received!</h3>
                <p className="order-success-sub">
                  Thank you, {name}. Our team will get back to you shortly with availability and wholesale pricing.
                </p>
                <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={c.wa(
                      `Hello Neha Crockery House,\n\nI just placed an enquiry for: ${product.name}${product.productCode ? ` (${product.productCode})` : ''}\nName: ${name}\nPhone: ${phone}${quantity ? `\nQuantity: ${quantity}` : ''}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    Continue on WhatsApp
                  </a>
                  <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} noValidate>
                <div className="form-field">
                  <label>I am a</label>
                  <div className="order-type-grid">
                    {CUSTOMER_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        className={`order-type-btn${customerType === ct.value ? ' selected' : ''}`}
                        onClick={() => setCustomerType(ct.value)}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="ord-name">
                      Your Name <span className="req">*</span>
                    </label>
                    <input
                      id="ord-name"
                      type="text"
                      required
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ord-company">Business / Company</label>
                    <input
                      id="ord-company"
                      type="text"
                      placeholder="Shop, hotel or company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="ord-phone">
                      Phone / WhatsApp <span className="req">*</span>
                    </label>
                    <input
                      id="ord-phone"
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ord-email">Email (Optional)</label>
                    <input
                      id="ord-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="ord-qty">Estimated Quantity</label>
                  <input
                    id="ord-qty"
                    type="text"
                    placeholder="e.g., 10 sets / 5 cartons"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="ord-msg">Notes / Requirements</label>
                  <textarea
                    id="ord-msg"
                    placeholder="Any specific requirements, delivery city, etc."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {submitError && <div className="order-error">{submitError}</div>}

                <button type="submit" className="order-submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Order Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

