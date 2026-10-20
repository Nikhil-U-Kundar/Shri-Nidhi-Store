import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const CART_KEY = 'sns_cart';
const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);

    return {
      items,
      count,
      total: Math.round(total * 100) / 100,
      addItem: (product, qty = 1) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === product.id);
          if (existing) {
            return prev.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i
            );
          }
          return [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              packLabel: product.packLabel,
              sellingPrice: product.sellingPrice,
              imageUrl: product.imageUrl,
              quantity: qty,
            },
          ];
        });
      },
      updateQty: (productId, quantity) => {
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
        });
      },
      removeItem: (productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
