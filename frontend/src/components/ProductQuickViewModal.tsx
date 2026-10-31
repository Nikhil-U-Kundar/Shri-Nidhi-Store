import React from 'react';
import { X, Star, ShieldCheck, Clock, MapPin, Building, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProductQuickViewModal: React.FC = () => {
  const {
    selectedProductDetail: product,
    setSelectedProductDetail,
    cart,
    addToCart,
    updateCartItemQty,
    setIsCartDrawerOpen
  } = useApp();

  if (!product) return null;

  const inCart = cart.find((item) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-stone-200">
        <button
          onClick={() => setSelectedProductDetail(null)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Image Preview Area */}
            <div className="bg-stone-50 rounded-2xl p-6 flex items-center justify-center aspect-square border border-stone-100">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-64 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Product Meta & Purchase Module */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                  <span className="uppercase tracking-wider text-emerald-800">{product.category}</span>
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    {product.rating} ({product.reviewsCount || 45} reviews)
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
                  {product.name}
                </h2>

                <p className="text-xs text-stone-600 mt-1">
                  Brand: <span className="font-bold text-stone-900">{product.brand}</span> · Pack:{' '}
                  <span className="font-bold text-stone-900">{product.unit}</span>
                </p>

                {/* Price Module */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-900 tabular-nums">
                    ₹{product.discountPrice}
                  </span>
                  {product.price > product.discountPrice && (
                    <>
                      <span className="text-sm text-stone-400 line-through tabular-nums">
                        ₹{product.price}
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {product.discount}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Kirana Guarantee Card */}
                <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl text-xs space-y-2 border border-stone-200/60 text-stone-700">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Stock:</strong>{' '}
                      <span className={product.stock > 5 ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                        {product.stock > 0 ? `${product.stock} units available at Sector 14 shelf` : 'Out of Stock'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-stone-400 shrink-0" />
                    <span><strong>Mfr:</strong> {product.mfg}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                    <span><strong>Expiry Guarantee:</strong> {product.expiry}</span>
                  </div>

                  {product.fssaiNumber && (
                    <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                      FSSAI Lic. No: {product.fssaiNumber}
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-600 mt-3 leading-relaxed">{product.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="w-full bg-stone-200 text-stone-500 py-3 rounded-xl text-xs font-bold cursor-not-allowed text-center"
                  >
                    Currently Out of Stock
                  </button>
                ) : inCart ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl p-1.5 flex-1">
                      <button
                        onClick={() => updateCartItemQty(product.id, -1)}
                        className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-800 font-bold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black text-emerald-950 tabular-nums">
                        {inCart.qty} in Basket
                      </span>
                      <button
                        onClick={() => updateCartItemQty(product.id, 1)}
                        className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-800 font-bold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductDetail(null);
                        setIsCartDrawerOpen(true);
                      }}
                      className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      View Cart
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      addToCart(product);
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart (₹{product.discountPrice})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
