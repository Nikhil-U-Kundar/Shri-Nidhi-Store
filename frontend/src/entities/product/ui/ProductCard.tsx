import { useState, type ReactNode } from 'react';
import { Eye, Package, Star } from 'lucide-react';
import type { Product } from '../model/types';
import { LOW_STOCK_THRESHOLD } from '@/shared/config/store';

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
  /** Cart control rendered at the bottom of the card, supplied by the caller. */
  action: ReactNode;
}

export function ProductCard({ product, onOpen, action }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const hasDiscount = product.price > product.discountPrice;

  return (
    <article className="group relative flex w-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:border-emerald-600/40 hover:shadow-xl">
      <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
        {product.discount > 0 && (
          <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm sm:px-2">
            {product.discount}% OFF
          </span>
        )}
        {isLowStock && (
          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-stone-950 shadow-sm sm:px-2">
            Only {product.stock} left
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-md backdrop-blur transition hover:scale-110 hover:text-emerald-700 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        title="Quick view product"
        aria-label={`Quick view ${product.name}`}
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="relative flex aspect-square min-w-0 cursor-pointer items-center justify-center overflow-hidden bg-stone-50/70 p-2 sm:p-4"
      >
        {imageFailed ? (
          <span className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-stone-100 p-3 text-center text-stone-400">
            <Package className="mb-2 h-9 w-9 text-emerald-700" />
            <span className="text-xs font-bold text-stone-700">{product.name}</span>
            <span className="text-[10px] text-stone-400">{product.unit}</span>
          </span>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="max-h-24 w-full max-w-full object-contain transition duration-300 group-hover:scale-105 sm:max-h-32 md:max-h-36"
          />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-between space-y-2 p-2.5 sm:space-y-3 sm:p-3.5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-1 text-[11px] font-medium text-stone-500">
            <span className="min-w-0 truncate uppercase tracking-wider">{product.brand}</span>
            <span className="flex shrink-0 items-center font-bold text-amber-600">
              <Star className="mr-0.5 h-3 w-3 fill-current text-amber-500" />
              {product.rating}
            </span>
          </div>

          <h3
            onClick={onOpen}
            className="mt-1 line-clamp-2 cursor-pointer text-xs leading-tight font-bold text-stone-900 transition hover:text-emerald-700 sm:text-sm"
          >
            {product.name}
          </h3>
          <p className="mt-1 text-[11px] font-medium text-stone-500">{product.unit}</p>
        </div>

        <div className="border-t border-stone-100 pt-2">
          <div className="mb-2.5 flex items-baseline gap-1.5">
            <span className="text-sm font-black text-stone-900 tabular-nums sm:text-base">₹{product.discountPrice}</span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through tabular-nums">₹{product.price}</span>
            )}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
