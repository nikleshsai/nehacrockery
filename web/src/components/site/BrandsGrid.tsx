import { Link } from 'react-router-dom';
import { useBrands } from '@/lib/hooks';
import type { Brand } from '@/lib/types';

interface BrandProfile {
  specialty: string;
  category: string;
  description: string;
  monogram: string;
}

const BRAND_PROFILES: Record<string, BrandProfile> = {
  taroba: {
    specialty: 'In-House Flagship Brand',
    category: 'Crockery, Glassware, Flasks & Cutlery',
    description:
      'Our officially registered in-house trademark (filed 2016), crafted for durability and everyday elegance across homes and hospitality.',
    monogram: 'T',
  },
  ariane: {
    specialty: 'Fine Porcelain & HoReCa Chinaware',
    category: 'Luxury Hotelware & Dinnerware',
    description:
      'World-class vitrified fine porcelain engineered for 5-star hotels, banquets, fine dining restaurants, and discerning homes.',
    monogram: 'AR',
  },
  dinewell: {
    specialty: '100% Food-Grade Melamine',
    category: 'Commercial & Institutional Melamineware',
    description:
      'Heavy-duty, stain-resistant melamine plates, bowls, platters, and buffet serveware trusted by caterers and restaurants.',
    monogram: 'DW',
  },
  ocean: {
    specialty: 'International Stemware & Tumblers',
    category: 'Barware, Drinkware & Glassware',
    description:
      'Crystal-clear tumblers, goblets, juice glasses, and beverage glassware renowned for brilliance and rim strength.',
    monogram: 'OC',
  },
  luminarc: {
    specialty: 'French Tempered Glass & Opalware',
    category: 'Dinner Sets, Bowls & Drinkware',
    description:
      'Iconic French tableware combining chip-resistant tempered opal glass with timeless contemporary dining silhouettes.',
    monogram: 'LU',
  },
  larah: {
    specialty: 'Toughened Opal Glass by Borosil',
    category: 'Microwave-Safe Dinner Sets',
    description:
      'Lightweight, bone-ash-free toughened opalware dinner sets and serving bowls designed for modern Indian households.',
    monogram: 'LA',
  },
  'roxx-pro': {
    specialty: 'Contemporary Glass & Steelware',
    category: 'Storage, Drinkware & Dinnerware',
    description:
      'Versatile kitchen storage jars, insulated casseroles, glass tumblers, and gift-ready tableware collections.',
    monogram: 'RX',
  },
  roxx: {
    specialty: 'Contemporary Glass & Steelware',
    category: 'Storage, Drinkware & Dinnerware',
    description:
      'Versatile kitchen storage jars, insulated casseroles, glass tumblers, and gift-ready tableware collections.',
    monogram: 'RX',
  },
  lg: {
    specialty: 'Commercial Tableware & Serveware',
    category: 'Crockery & Hospitality Essentials',
    description:
      'Dependable everyday crockery, serving pieces, and utility tableware stocked for retail and bulk trade buyers.',
    monogram: 'LG',
  },
  koko: {
    specialty: 'Modern Kitchen & Tableware',
    category: 'Serveware, Bowls & Accessories',
    description:
      'Stylish, value-driven tableware, serving bowls, and utility essentials popular with retailers and gifting buyers.',
    monogram: 'KK',
  },
  krista: {
    specialty: 'Premium Acrylic & Serveware',
    category: 'Unbreakable Drinkware & Trays',
    description:
      'High-clarity food-grade acrylic tumblers, pitchers, and servingware ideal for outdoor dining, clubs, and banquets.',
    monogram: 'KR',
  },
};

export function BrandCard({ brand }: { brand: Brand }) {
  const slugKey = (brand.slug || brand.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const profile = BRAND_PROFILES[slugKey] || {
    specialty: 'Authorized Showroom Stockist',
    category: 'Tableware & Kitchenware',
    description:
      brand.description ||
      `Genuine ${brand.name} tableware and hospitality products available for retail and wholesale at our Park Town showroom.`,
    monogram: (brand.name || '?')
      .substring(0, 2)
      .toUpperCase()
      .replace(/[^A-Z]/g, '') || 'B',
  };

  const isOwn = slugKey === 'taroba' || (Boolean(brand.isOwnBrand) && slugKey !== 'lg');
  const desc =
    brand.description && brand.description.trim().length > 25 && brand.description !== 'Our Own Brand'
      ? brand.description
      : profile.description;
  const productCount = brand._count?.products ?? 0;
  const href = isOwn ? '/taroba' : `/products?brand=${encodeURIComponent(brand.slug || slugKey)}`;

  return (
    <article className={`brand-card${isOwn ? ' brand-card--own' : ''}`}>
      <div className="brand-card-top">
        {brand.logo ? (
          <div className="brand-card-emblem brand-card-emblem--img">
            <img src={brand.logo} alt={brand.name} className="brand-card-logo" loading="lazy" />
          </div>
        ) : (
          <div className={`brand-card-emblem${isOwn ? ' brand-card-emblem--own' : ''}`} aria-hidden="true">
            <span className="brand-card-monogram">{profile.monogram || brand.name.charAt(0)}</span>
          </div>
        )}
        <div className="brand-card-badges">
          {isOwn ? (
            <span className="brand-own-badge">&#9670; Our Own Brand</span>
          ) : (
            <span className="brand-stock-badge">Authorized Stockist</span>
          )}
        </div>
      </div>
      <div className="brand-card-body">
        <span className="brand-card-category">{profile.category}</span>
        <h3 className="brand-card-name">
          <Link to={href} className="brand-card-title-link">
            {brand.name}
          </Link>
        </h3>
        <p className="brand-card-specialty">{profile.specialty}</p>
        <p className="brand-card-desc">{desc}</p>
      </div>
      <div className="brand-card-footer">
        <span className="brand-card-count">
          {productCount > 0 ? `${productCount} Products` : 'In Showroom Stock'}
        </span>
        <Link to={href} className="brand-card-cta">
          {isOwn ? 'Explore Taroba' : 'View Products'} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}

/** All active brands (Brands page grid). */
export function BrandsGrid() {
  const { data, loading, error } = useBrands();
  const brands = (data ?? [])
    .filter((b) => b.isActive !== false)
    .slice()
    .sort((a, b) => {
      const aOwn = a.slug === 'taroba' || (a.isOwnBrand && a.slug !== 'lg') ? 1 : 0;
      const bOwn = b.slug === 'taroba' || (b.isOwnBrand && b.slug !== 'lg') ? 1 : 0;
      if (bOwn !== aOwn) return bOwn - aOwn;
      return (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
    });

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
