import type { Product } from '@/entities/product/@x/cart';

export interface CartItem extends Product {
  qty: number;
}
