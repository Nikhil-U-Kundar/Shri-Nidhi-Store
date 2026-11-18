import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from './types';
import { calculateCartTotals, type CartTotals } from './totals';

const CART_STORAGE_KEY = 'sri_nidhi_cart';

interface CartValue {
  items: CartItem[];
  setItems: (update: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  clearCart: () => void;
  totals: CartTotals;
}

const CartContext = createContext<CartValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/** Basket state, persisted to localStorage so it survives reloads. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: the basket still works for this page view */
    }
  }, [items]);

  const value = useMemo<CartValue>(
    () => ({
      items,
      setItems,
      clearCart: () => setItems([]),
      totals: calculateCartTotals(items),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
