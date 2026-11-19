// ─────────────────────────────────────────────────────────────────────────────
// Cart Context — persisted in localStorage, shared across the React app
// ─────────────────────────────────────────────────────────────────────────────
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from './types';

const STORAGE_KEY = 'nch_cart';

export interface CartItem {
  slug: string;
  name: string;
  code?: string | null;   // productCode from the backend
  price: number | null;   // null = "price on request"
  img?: string | null;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  hasUnpriced: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (p: Product) => void;
  setQty: (slug: string, qty: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

const CartCtx = createContext<CartContextValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [isOpen, setIsOpen] = useState(false);

  // Persist on every change
  useEffect(() => { save(items); }, [items]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((p: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === p.slug);
      if (existing) {
        return prev.map((i) => i.slug === p.slug ? { ...i, qty: i.qty + 1 } : i);
      }
      return [
        ...prev,
        {
          slug: p.slug,
          name: p.name,
          code: p.productCode ?? null,
          price: typeof p.mrp === 'number' ? p.mrp : null,
          img: Array.isArray(p.images) && p.images.length > 0 ? p.images[0]?.imageUrl ?? null : null,
          qty: 1,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.slug !== slug) : prev.map((i) => i.slug === slug ? { ...i, qty } : i)
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((a, i) => a + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((a, i) => a + (i.price ?? 0) * i.qty, 0), [items]);
  const hasUnpriced = useMemo(() => items.some((i) => i.price === null), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, count, total, hasUnpriced, isOpen, openCart, closeCart, addItem, setQty, removeItem, clearCart }),
    [items, count, total, hasUnpriced, isOpen, openCart, closeCart, addItem, setQty, removeItem, clearCart]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

/** Convenience hook — returns addItem + whether item is already in cart */
export function useAddToCart(product: Product) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.slug === product.slug);
  const add = useCallback(() => addItem(product), [addItem, product]);
  return { add, inCart };
}
