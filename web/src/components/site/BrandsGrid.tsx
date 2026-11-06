import { useBrands } from '@/lib/hooks';
import type { Brand } from '@/lib/types';

export function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className={`brand-card${brand.isOwnBrand ? ' brand-card--own' : ''}`}>
      {brand.logo ? (
        <img src={brand.logo} alt={brand.name} className="brand-card-logo" />
      ) : (
        <div className="brand-card-logo-placeholder">{brand.name.charAt(0)}</div>
      )}
      {brand.isOwnBrand && <span className="brand-own-badge">Own Brand</span>}
      <span className="brand-card-name">{brand.name}</span>
      {brand.isOwnBrand && <span className="brand-card-tagline">Our Own Brand</span>}
    </div>
  );
}

/** All active brands (Brands page grid). */
export function BrandsGrid() {
  const { data, loading, error } = useBrands();
  const brands = (data ?? []).filter((b) => b.isActive !== false);

  let body;
  if (loading) {
    body = <p className="products-loading-text">Loading brands…</p>;
  } else if (error || brands.length === 0) {
    body = (
      <div className="brand-placeholder-note">
        <p>Our brand list is being updated. Please contact us for the brands we stock.</p>
      </div>
    );
  } else {
    body = brands.map((b) => <BrandCard key={b.id} brand={b} />);
  }

  return (
    <div className="brands-full-grid" id="brands-full-grid">
      {body}
    </div>
  );
}
