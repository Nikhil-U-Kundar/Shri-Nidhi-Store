import React from 'react';
import { X, ShoppingBag, Plus, Minus, ArrowRight, Trash2, Zap, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    cartSavings,
    deliveryFee,
    cartFinalTotal,
    setIsCheckoutModalOpen
  } = useApp();

  if (!isCartDrawerOpen) return null;

  const freeDeliveryThreshold = 499;
  const progressPercent = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);
  const amountNeededForFree = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
      />

      <aside
        aria-label="Shopping Cart Drawer"
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-stone-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Your Grocery Basket</h2>
              <p className="text-[11px] text-stone-500">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-red-600 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Clear entire cart"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Progress Calculator */}
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 text-xs">
          <div className="flex justify-between items-center text-emerald-900 font-bold mb-1.5">
            {amountNeededForFree === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
                🎉 You unlocked FREE Local Delivery!
              </span>
            ) : (
              <span>Add ₹{amountNeededForFree} more for FREE Delivery</span>
            )}
            <span className="text-[11px] text-emerald-700 font-normal">
              Threshold: ₹{freeDeliveryThreshold}
            </span>
          </div>
          <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-stone-400 space-y-3">
              <ShoppingBag className="w-14 h-14 mx-auto text-stone-300" />
              <p className="font-bold text-stone-700 text-sm">Your basket is empty</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Add fresh grocery items from our catalog to get instant 30-min doorstep delivery in Sector 14.
              </p>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
              >
                Start Shopping Mandi Items
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-stone-50/80 border border-stone-200/80 rounded-2xl hover:border-emerald-300 transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-stone-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                  <span className="text-[11px] text-stone-500 block">
                    {item.unit} · {item.brand}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs font-black text-stone-900 tabular-nums">
                      ₹{item.discountPrice * item.qty}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      (₹{item.discountPrice} each)
                    </span>
                  </div>
                </div>

                {/* Stepper & Remove */}
                <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl p-1 shadow-sm shrink-0">
                  <button
                    onClick={() => updateCartItemQty(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700 transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center tabular-nums text-stone-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateCartItemQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700 transition cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Calculations & Checkout Trigger */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900 tabular-nums">₹{cartSubtotal}</span>
              </div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Mandi Savings</span>
                  <span className="tabular-nums">- ₹{cartSavings}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Local Delivery Fee</span>
                <span className="font-bold tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>To Pay</span>
                <span className="text-emerald-800 text-base tabular-nums">₹{cartFinalTotal}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                setIsCheckoutModalOpen(true);
              }}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Proceed to Express Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
