/**
 * CartProvider + useCart — simple enquiry-based cart (no prices).
 * Items are persisted to localStorage so the cart survives page refreshes.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;          // product.id
  slug: string;        // product.slug — used for navigation
  name: string;        // display name
  productCode?: string | null;
  imageUrl?: string | null;
  brandName?: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;         // total quantity across all items
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  isInCart: (id: string) => boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

// ── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nch_cart_v1';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persist on every change
  useEffect(() => { saveCart(items); }, [items]);

  const add = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setDrawerOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, add, remove, setQty, clear, isInCart, drawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

