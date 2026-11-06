import { useAllProducts } from '@/lib/hooks';
import { ProductCard } from './ProductCard';

export function TarobaProducts() {
  const { data: products, loading } = useAllProducts();

  const tarobaProducts = (products ?? [])
    .filter((p) => (p.brand?.name ?? '').toLowerCase() === 'taroba')
    .slice(0, 8);

  if (loading && tarobaProducts.length === 0) {
    return (
      <div className="products-grid" id="taroba-products-grid">
        <p className="products-loading-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px' }}>
          Loading Taroba products…
        </p>
      </div>
    );
  }

  if (tarobaProducts.length === 0) {
    return (
      <div className="products-grid" id="taroba-products-grid">
        <p className="products-loading-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px' }}>
          Taroba product details are coming soon. Please enquire on WhatsApp for the current range.
        </p>
      </div>
    );
  }

  return (
    <div className="products-grid" id="taroba-products-grid">
      {tarobaProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

