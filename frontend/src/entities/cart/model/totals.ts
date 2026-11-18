import { DELIVERY } from '@/shared/config/store';
import type { CartItem } from './types';

export interface CartTotals {
  count: number;
  subtotal: number;
  originalTotal: number;
  savings: number;
  deliveryFee: number;
  finalTotal: number;
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.discountPrice * item.qty, 0);
  const originalTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal === 0 || subtotal >= DELIVERY.freeThreshold ? 0 : DELIVERY.fee;

  return {
    count,
    subtotal,
    originalTotal,
    savings: Math.max(0, originalTotal - subtotal),
    deliveryFee,
    finalTotal: subtotal > 0 ? subtotal + deliveryFee : 0,
  };
}
