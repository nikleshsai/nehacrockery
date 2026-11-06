import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { ProductCard } from '@/components/site/ProductCard';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { useAllProducts } from '@/lib/hooks';
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
    label: 'Crockery',
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
    label: 'Glassware',
    id: 'chip-glassware',
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8" />
      </svg>
    ),
  },
  {
    slug: 'melamineware',
    label: 'Melamineware',
    id: 'chip-melamineware',
  },
  {
    slug: 'acrylicware',
    label: 'Acrylicware',
    id: 'chip-acrylicware',
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
  {
    slug: 'hotelware',
    label: 'Hotelware',
    id: 'chip-hotelware',
  },
  {
    slug: 'wooden-handicrafts',
    label: 'Wooden Handicrafts',
    id: 'chip-wooden',
  },
  {
    slug: 'new-arrivals',
    label: 'New Arrivals',
    id: 'chip-new',
    isNew: true,
    icon: (
      <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      </svg>
    ),
  },
];

export default function ProductsPage() {
  const c = useContact();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const activeBrand = searchParams.get('brand') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allProducts, loading, error } = useAllProducts();

  const selectCategory = (slug: string) => {
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete('brand');
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setSearchParams(next, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const list = allProducts ?? [];
    const term = searchTerm.toLowerCase().trim();
    const filtered = list.filter((p) => {
      const cat = (p.category?.slug || p.category?.name || '').toLowerCase();
      const matchCat =
        activeCategory === 'all' ||
        (activeCategory === 'new-arrivals'
          ? Boolean(p.isNewArrival)
          : cat === activeCategory ||
            cat.startsWith(`${activeCategory}-`) ||
            cat.startsWith(activeCategory.replace('-', '')));

      const brandName = (p.brand?.name || '').toLowerCase();
      const brandSlug = (p.brand?.slug || '').toLowerCase();
      const matchBrand =
        !activeBrand ||
        brandName === activeBrand.toLowerCase() ||
        brandSlug === activeBrand.toLowerCase();

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

    const sorted = [...filtered];
    if (sortOrder === 'name-asc' || sortOrder === 'name-az') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOrder === 'name-desc' || sortOrder === 'name-za') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOrder === 'new') {
      sorted.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else if (sortOrder === 'brand') {
      sorted.sort((a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''));
    } else {
      sorted.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return sorted;
  }, [allProducts, activeCategory, activeBrand, searchTerm, sortOrder]);

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
                <option value="default">Sort: Featured</option>
                <option value="name-az">Name A – Z</option>
                <option value="name-za">Name Z – A</option>
                <option value="new">New Arrivals First</option>
                <option value="brand">By Brand</option>
              </select>
            </div>
          </div>

          <div className="category-chips" id="category-chips" role="tablist" aria-label="Filter by category">
            {CHIPS.map((chip) => {
              const selected = activeCategory === chip.slug;
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
            <p className="products-count" id="products-count">
              {loading && !allProducts
                ? 'Loading products…'
                : `Showing ${Math.min(pageProducts.length, total)} of ${total} products`}
            </p>
            <a
              href={c.wa('Hello, I want to enquire about wholesale pricing.')}
              className="btn-whatsapp btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon size={14} /> Get Wholesale Quote
            </a>
          </div>

          {error && !allProducts ? (
            <div className="products-empty" id="products-empty" aria-live="polite">
              <div className="products-empty-icon">
                <svg className="ui-icon ui-icon--lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </div>
              <p className="products-empty-desc">Could not load products. Please try again later.</p>
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
              <a
                href={c.wa('Hello, I am looking for a specific product.')}
                className="btn-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask on WhatsApp &#8594;
              </a>
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
            <a href={c.telHref} className="btn-primary">
              Call Now &#8594;
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

