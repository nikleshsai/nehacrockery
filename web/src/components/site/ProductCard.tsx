import { Link } from 'react-router-dom';
import type { Product } from '@/lib/types';
import { useAddToCart } from '@/lib/cart';

export const CATEGORY_LABELS: Record<string, string> = {
  crockery: 'Crockery & Dinnerware',
  cutlery: 'Cutlery',
  glassware: 'Glassware & Bottles',
  melamineware: 'Melamineware',
  acrylicware: 'Acrylicware',
  kitchenware: 'Kitchenware',
  hotelware: 'Hotelware',
  'wooden-handicrafts': 'Wooden Handicrafts',
  'new-arrivals': 'New Arrivals',
};

interface Props {
  product: Product;
  /** Footer button label (related-products uses "View Details"). */
  cta?: string;
}

export function ProductCard({ product, cta }: Props) {
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const image = product.images?.[0]?.imageUrl;
  const catSlug = product.category?.slug ?? '';
  const catLabel = product.category?.name ?? CATEGORY_LABELS[catSlug] ?? catSlug.replace(/-/g, ' ');
  const meta = [product.material, product.capacity, product.setContents].filter(Boolean).join(' · ');
  const { add, inCart } = useAddToCart(product);

  return (
    <article className="product-card" data-id={product.productCode ?? product.id}>
      <Link to={href} className="product-card-img-wrap" tabIndex={-1}>
        {image ? (
          <img src={image} alt={product.name} className="product-card-img" loading="lazy" />
        ) : (
          <div className="product-card-img-placeholder" aria-hidden="true">
            <svg
              className="ui-icon ui-icon--lg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
        )}
        {(product.isFeatured || product.isNewArrival) && (
          <div className="product-card-badges">
            {product.isFeatured && <span className="product-badge product-badge--featured">Featured</span>}
            {product.isNewArrival && <span className="product-badge product-badge--new">New</span>}
          </div>
        )}
      </Link>
      <div className="product-card-body">
        {product.brand && <span className="product-card-brand">{product.brand.name}</span>}
        <h3 className="product-card-name">
          <Link to={href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>
        <span className="product-card-category">{catLabel}</span>
        {meta && <span className="product-card-meta">{meta}</span>}
      </div>
      <div className="product-card-footer">
        {typeof product.mrp === 'number' && (
          <span className="product-card-price">₹{product.mrp.toLocaleString('en-IN')}</span>
        )}
        {typeof product.mrp !== 'number' && (
          <span className="product-card-price-req">Price on request</span>
        )}
        <button
          type="button"
          className={`nch-atc-btn${inCart ? ' in-cart' : ''}`}
          onClick={add}
          aria-label={inCart ? `${product.name} added to cart` : `Add ${product.name} to cart`}
        >
          {inCart ? '✓ In Cart' : (cta ?? 'Add to Cart')}
        </button>
      </div>
    </article>
  );
}
