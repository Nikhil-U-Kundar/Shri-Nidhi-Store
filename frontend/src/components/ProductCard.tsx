import React, { useState } from 'react';
import { Star, Plus, Minus, ShoppingBag, Eye, Package } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateCartItemQty, setSelectedProductDetail } = useApp();
  const [imageFailed, setImageFailed] = useState(false);

  const cartItem = cart.find((item) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-emerald-600/40 transition duration-200 group relative min-w-0 w-full max-w-full">
      {/* Discount / Low Stock Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
        {product.discount > 0 && (
          <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
            {product.discount}% OFF
          </span>
        )}
        {isLowStock && (
          <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* Quick View Button */}
      <button
        onClick={() => setSelectedProductDetail(product)}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-stone-600 hover:text-emerald-700 hover:scale-110 transition opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Quick view product"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Product Image Container with Resilient Fallback */}
      <div
        onClick={() => setSelectedProductDetail(product)}
        className="p-2 sm:p-4 bg-stone-50/70 flex items-center justify-center relative cursor-pointer aspect-square overflow-hidden min-w-0"
      >
        {!imageFailed ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="object-contain max-h-24 sm:max-h-32 md:max-h-36 w-full max-w-full group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100 p-4 text-center rounded-xl">
            <Package className="w-10 h-10 mb-2 text-emerald-700" />
            <span className="text-xs font-bold text-stone-700">{product.name}</span>
            <span className="text-[10px] text-stone-400">{product.unit}</span>
          </div>
        )}
      </div>

      {/* Product Details Body */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1 text-[11px] text-stone-500 font-medium min-w-0">
            <span className="uppercase tracking-wider truncate min-w-0">{product.brand}</span>
            <span className="flex items-center text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-current mr-0.5 text-amber-500" />
              {product.rating}
            </span>
          </div>

          <h3
            onClick={() => setSelectedProductDetail(product)}
            className="font-bold text-xs sm:text-sm text-stone-900 mt-1 line-clamp-2 leading-tight cursor-pointer hover:text-emerald-700 transition"
          >
            {product.name}
          </h3>

          <p className="text-[11px] text-stone-500 font-medium mt-1">{product.unit}</p>
        </div>

        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-sm sm:text-base font-black text-stone-900 tabular-nums">
              ₹{product.discountPrice}
            </span>
            {product.price > product.discountPrice && (
              <span className="text-xs text-stone-400 line-through tabular-nums">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* Cart Stepper or Add Button */}
          {isOutOfStock ? (
            <button
              disabled
              className="w-full bg-stone-200 text-stone-500 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed text-center"
            >
              Out of Stock
            </button>
          ) : cartItem ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 sm:p-1 min-w-0">
              <button
                onClick={() => updateCartItemQty(product.id, -1)}
                className="w-7 h-7 shrink-0 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-800 font-bold hover:bg-emerald-100 transition cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-emerald-950 tabular-nums px-1">
                {cartItem.qty}
              </span>
              <button
                onClick={() => updateCartItemQty(product.id, 1)}
                className="w-7 h-7 shrink-0 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-800 font-bold hover:bg-emerald-100 transition cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
