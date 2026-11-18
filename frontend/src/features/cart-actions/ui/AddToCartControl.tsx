import { Plus } from 'lucide-react';
import { useCart } from '@/entities/cart';
import type { Product } from '@/entities/product';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { useCartActions } from '../model/useCartActions';

interface AddToCartControlProps {
  product: Product;
}

/** Add button for a product, switching to a quantity stepper once it is in the basket. */
export function AddToCartControl({ product }: AddToCartControlProps) {
  const { items } = useCart();
  const { addToCart, updateQuantity } = useCartActions();
  const line = items.find((item) => item.id === product.id);

  if (product.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-xl bg-stone-200 py-1.5 text-center text-xs font-bold text-stone-500"
      >
        Out of Stock
      </button>
    );
  }

  if (line) {
    return (
      <QuantityStepper
        quantity={line.qty}
        itemName={product.name}
        onDecrement={() => updateQuantity(product.id, -1)}
        onIncrement={() => updateQuantity(product.id, 1)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart(product)}
      className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-emerald-700 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98] sm:gap-1.5 sm:text-xs"
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Add</span>
    </button>
  );
}
