import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { ProductCard } from '@/components/site/ProductCard';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { useAllProducts, useCategories } from '@/lib/hooks';
import { useContact } from '@/lib/settings';

const PAGE_SIZE = 12;

interface CategoryChipDef {
  slug: string;
  label: string;
  id: string;
  isNew?: boolean;
  icon?: ReactNode;
}

const CHIPS: CategoryChipDef[] = [
  { slug: 'all', label: 'All Products', id: 'chip-all' },
  {
    slug: 'crockery',
    label: 'Crockery & Dinnerware',
    id: 'chip-crockery',
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
  },
  {
    slug: 'cutlery',
    label: 'Cutlery',
    id: 'chip-cutlery',
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 4.5-3 7h3v11" />
      </svg>
    ),
  },
  {
    slug: 'glassware',
    label: 'Glassware & Bottles',
    id: 'chip-glassware',
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8" />
      </svg>
    ),
  },
  {
    slug: 'kitchenware',
    label: 'Kitchenware',
    id: 'chip-kitchen',
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 9h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM3 9h2M19 9h2M9 6a3 3 0 0 1 6 0" />
      </svg>
    ),
  },
];

function normalizeCategorySlug(raw: string): string {
  const s = (raw || '').toLowerCase().trim();
  const map: Record<string, string> = {
    'crockery-dinnerware': 'crockery',
    'crockery & dinnerware': 'crockery',
    'glassware-bottles': 'glassware',
    'glassware & bottles': 'glassware',
    'hotelware-institutional-supply': 'hotelware',
    'hotelware & institutional supply': 'hotelware',
  };
  return map[s] || s;
}

export default function ProductsPage() {
  const c = useContact();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const activeBrand = searchParams.get('brand') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allProducts, loading, error, retry } = useAllProducts();
  const { data: apiCategories } = useCategories();

  const { dynamicChips, categoryOrderMap } = useMemo(() => {
    const orderMap: Record<string, number> = {
      crockery: 1,
      'crockery-dinnerware': 1,
      cutlery: 2,
      glassware: 3,
      'glassware-bottles': 3,
      melamineware: 4,
      acrylicware: 5,
      kitchenware: 6,
      hotelware: 7,
      'hotelware-institutional-supply': 7,
      'wooden-handicrafts': 8,
      'new-arrivals': 9,
    };

    const activeCats = (apiCategories ?? [])
      .filter((cat) => {
        if (!cat || cat.isActive === false) return false;
        const rawSlug = (cat.slug || '').toLowerCase().trim();
        const normSlug = normalizeCategorySlug(rawSlug);
        if (allProducts && allProducts.length > 0) {
          return allProducts.some((p) => {
            const pRaw = (p.category?.slug || '').toLowerCase().trim();
            return normalizeCategorySlug(pRaw) === normSlug || pRaw === rawSlug;
          });
        }
        if (typeof cat._count?.products === 'number') {
          return cat._count.products > 0;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const sa = typeof a.sortOrder === 'number' ? a.sortOrder : 99;
        const sb = typeof b.sortOrder === 'number' ? b.sortOrder : 99;
        if (sa !== sb) return sa - sb;
        return (a.name || '').localeCompare(b.name || '');
      });

    if (activeCats.length === 0) {
      return { dynamicChips: CHIPS, categoryOrderMap: orderMap };
    }

    const iconBySlug = new Map<string, ReactNode>();
    CHIPS.forEach((ch) => {
      if (ch.icon) iconBySlug.set(ch.slug, ch.icon);
    });

    const list: CategoryChipDef[] = [{ slug: 'all', label: 'All Products', id: 'chip-all' }];
    let hasNew = false;

    activeCats.forEach((cat, idx) => {
      const rawSlug = (cat.slug || '').toLowerCase().trim();
      const normSlug = normalizeCategorySlug(rawSlug);
      const sortVal = typeof cat.sortOrder === 'number' ? cat.sortOrder : idx + 1;
      orderMap[rawSlug] = sortVal;
      orderMap[normSlug] = sortVal;
      if (normSlug === 'new-arrivals') hasNew = true;
      list.push({
        slug: normSlug,
        label: cat.name,
        id: `chip-${normSlug}`,
        isNew: normSlug === 'new-arrivals',
        icon: iconBySlug.get(normSlug),
      });
    });

    const anyNewArrivalProduct = (allProducts ?? []).some((p) => Boolean(p.isNewArrival));
    if (!hasNew && anyNewArrivalProduct) {
      list.push({
        slug: 'new-arrivals',
        label: 'New Arrivals',
        id: 'chip-new',
        isNew: true,
      });
    }

    return { dynamicChips: list, categoryOrderMap: orderMap };
  }, [apiCategories, allProducts]);

  const effectiveCategory = useMemo(() => {
    const norm = normalizeCategorySlug(activeCategory);
    if (norm === 'all') return 'all';
    const exists = dynamicChips.some((ch) => ch.slug === norm || ch.slug === activeCategory);
    return exists ? norm : 'all';
  }, [activeCategory, dynamicChips]);

  useEffect(() => {
    if (activeCategory !== 'all' && effectiveCategory === 'all') {
      const next = new URLSearchParams(searchParams);
      next.delete('category');
      setSearchParams(next, { replace: true });
    }
  }, [activeCategory, effectiveCategory, searchParams, setSearchParams]);

  const selectCategory = (slug: string) => {
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete('brand');
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('default');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const list = allProducts ?? [];
    const term = searchTerm.toLowerCase().trim();
    const normActiveCat = normalizeCategorySlug(effectiveCategory);
    const filtered = list.filter((p) => {
      const rawCat = (p.category?.slug || p.category?.name || '').toLowerCase();
      const cat = normalizeCategorySlug(rawCat);
      const matchCat =
        effectiveCategory === 'all' ||
        (effectiveCategory === 'new-arrivals'
          ? Boolean(p.isNewArrival)
          : cat === normActiveCat ||
            rawCat === effectiveCategory.toLowerCase() ||
            rawCat.startsWith(`${normActiveCat}-`));

      const brandName = (p.brand?.name || '').toLowerCase().trim();
      const brandSlug = (p.brand?.slug || brandName.replace(/[^a-z0-9]+/g, '-')).toLowerCase().trim();
      const activeBrandNorm = activeBrand.toLowerCase().trim();
      const activeBrandSlug = activeBrandNorm.replace(/[^a-z0-9]+/g, '-');
      const matchBrand =
        !activeBrand ||
        brandName === activeBrandNorm ||
        brandSlug === activeBrandNorm ||
        brandSlug === activeBrandSlug;

      const matchSearch =
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        brandName.includes(term) ||
        (p.productCode || p.id || '').toLowerCase().includes(term) ||
        cat.includes(term) ||
        (p.collection || '').toLowerCase().includes(term) ||
        (p.material || '').toLowerCase().includes(term);

      return matchCat && matchBrand && matchSearch;
    });

    const getCatOrder = (p: (typeof filtered)[number]): number => {
      const raw = (p.category?.slug || '').toLowerCase();
      const norm = normalizeCategorySlug(raw);
      if (categoryOrderMap[raw] !== undefined) return categoryOrderMap[raw];
      if (categoryOrderMap[norm] !== undefined) return categoryOrderMap[norm];
      if (typeof p.category?.sortOrder === 'number') return p.category.sortOrder;
      return 99;
    };

    const sorted = [...filtered];
    if (sortOrder === 'name-asc' || sortOrder === 'name-az') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOrder === 'name-desc' || sortOrder === 'name-za') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOrder === 'category') {
      sorted.sort((a, b) => {
        const ca = getCatOrder(a);
        const cb = getCatOrder(b);
        if (ca !== cb) return ca - cb;
        return (a.name || '').localeCompare(b.name || '');
      });
    } else if (sortOrder === 'new') {
      sorted.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else if (sortOrder === 'brand') {
      sorted.sort((a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''));
    } else {
      sorted.sort((a, b) => {
        const fa = a.isFeatured ? 1 : 0;
        const fb = b.isFeatured ? 1 : 0;
        if (fb !== fa) return fb - fa;
        const ca = getCatOrder(a);
        const cb = getCatOrder(b);
        if (ca !== cb) return ca - cb;
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    return sorted;
  }, [allProducts, effectiveCategory, activeBrand, searchTerm, sortOrder, categoryOrderMap]);

  const total = filteredProducts.length;
  const pageProducts = filteredProducts.slice(0, currentPage * PAGE_SIZE);

  return (
    <>
      <Seo
        title="Our Products – Neha Crockery House | Crockery, Cutlery & Glassware Wholesale"
        description="Browse 5000+ crockery, cutlery, glassware, melamineware, and hotelware products stocked at Neha Crockery House, Park Town, Chennai."
      />

      <section className="page-banner" aria-label="Products page banner">
        <div className="page-banner-bg" aria-hidden="true" />
        <div className="container page-banner-content">
          <p className="section-eyebrow page-eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> OUR COLLECTION
          </p>
          <h1 className="page-banner-title">Our Products</h1>
          <p className="page-banner-desc">
            5000+ products across categories — crockery, cutlery, glassware and more. Browse a featured selection below, or enquire for the full range.
          </p>
        </div>
      </section>

      <section className="products-page-section" id="products" aria-labelledby="products-heading">
        <div className="container">
          <div className="products-toolbar" role="search">
            <div className="products-search-wrap">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                id="products-search"
                className="products-search"
                placeholder="Search products by name, brand or category…"
                aria-label="Search products"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="products-sort-wrap">
              <select
                id="products-sort"
                className="products-sort"
                aria-label="Sort products"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="default">Sort: Featured &amp; Category</option>
                <option value="category">Category (Admin Order)</option>
                <option value="name-az">Name A – Z</option>
                <option value="name-za">Name Z – A</option>
                <option value="brand">Brand A – Z</option>
                <option value="new">New Arrivals First</option>
              </select>
            </div>
          </div>

          <div className="category-chips" id="category-chips" role="tablist" aria-label="Filter by category">
            {dynamicChips.map((chip) => {
              const selected = effectiveCategory === chip.slug;
              return (
                <button
                  key={chip.slug}
                  type="button"
                  id={chip.id}
                  data-category={chip.slug}
                  role="tab"
                  aria-selected={selected}
                  className={`category-chip${chip.isNew ? ' category-chip--new' : ''}${selected ? ' active' : ''}`}
                  onClick={() => selectCategory(chip.slug)}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="products-results-bar">
            <p className="products-count" id="products-count" aria-live="polite">
              {loading && !allProducts
                ? 'Loading products…'
                : error && !allProducts
                  ? 'Unable to load products'
                  : total === 0
                    ? '0 products found'
                    : `Showing ${Math.min(pageProducts.length, total)} of ${total} products`}
            </p>
            <a
              href={c.wa('Hello, I would like to enquire about wholesale pricing.')}
              className="btn-whatsapp btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon size={14} /> Get Wholesale Quote
            </a>
          </div>

          {error && !allProducts ? (
            <div className="products-empty" id="products-empty" role="alert" aria-live="polite">
              <div className="products-empty-icon">
                <svg className="ui-icon ui-icon--lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </div>
              <h3 className="products-empty-title">Could Not Load Products</h3>
              <p className="products-empty-desc">
                We encountered a temporary connection issue loading the catalogue. Please try again or reach us directly on WhatsApp.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                <button type="button" className="btn-primary" id="products-retry-btn" onClick={retry}>
                  Retry Loading
                </button>
                <a
                  href={c.wa('Hello, I would like to enquire about your products.')}
                  className="btn-whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask on WhatsApp &#8594;
                </a>
              </div>
            </div>
          ) : !loading && total === 0 ? (
            <div className="products-empty" id="products-empty" aria-live="polite">
              <div className="products-empty-icon">
                <svg className="ui-icon ui-icon--lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </div>
              <h3 className="products-empty-title">
                {activeCategory !== 'all' && !searchTerm ? 'Products coming soon' : 'No Products Found'}
              </h3>
              <p className="products-empty-desc">
                {activeCategory !== 'all' && !searchTerm
                  ? 'We stock this category in our showroom. Enquire for the current range and availability.'
                  : 'Try adjusting your search or filter, or contact us for the full range.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                {(activeCategory !== 'all' || activeBrand || searchTerm) && (
                  <button type="button" className="btn-secondary" id="products-reset-btn" onClick={resetFilters}>
                    Reset Filters
                  </button>
                )}
                <a
                  href={c.wa('Hello, I am looking for a specific product.')}
                  className="btn-whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask on WhatsApp &#8594;
                </a>
              </div>
            </div>
          ) : (
            <div className="products-grid-full" id="products-main-grid" role="list" aria-live="polite" aria-label="Products list">
              {pageProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pageProducts.length < total && (
            <div className="products-loadmore-wrap" id="products-loadmore-wrap">
              <button
                type="button"
                className="btn-secondary"
                id="products-load-more"
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Load More Products
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="products-cta-strip" aria-label="Enquiry call to action">
        <div className="container products-cta-strip-inner">
          <div className="products-cta-text">
            <h2 className="products-cta-title">Can't find what you're looking for?</h2>
            <p className="products-cta-desc">We stock 5000+ products. Contact us and our team will help you find it.</p>
          </div>
          <div className="products-cta-actions">
            <a
              href={c.wa('Hello, I am looking for a specific product not shown on your website.')}
              className="btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Enquiry
            </a>
            <a href={c.telHref} className="btn-primary" title={`Call ${c.phoneDisplay}`}>
              Call {c.phoneDisplay} &#8594;
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

