import { useCallback } from 'react';
import { useCart, type CartItem } from '@/entities/cart';
import type { Product } from '@/entities/product';
import { useToast } from '@/shared/ui/toast';

/** Basket operations with user feedback. */
export function useCartActions() {
  const { setItems } = useCart();
  const { addToast } = useToast();

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + qty } : item));
        }
        return [...prev, { ...product, qty }];
      });
      addToast(`Added ${product.name} to basket`, 'success');
    },
    [setItems, addToast]
  );

  /** Change a line's quantity by `delta`; a line that drops to zero is removed. */
  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((item): CartItem | null => {
            if (item.id !== productId) return item;
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          })
          .filter((item): item is CartItem => item !== null)
      );
    },
    [setItems]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      addToast('Item removed from cart', 'info');
    },
    [setItems, addToast]
  );

  return { addToCart, updateQuantity, removeFromCart };
}
