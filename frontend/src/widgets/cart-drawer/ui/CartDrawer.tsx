import { ArrowRight, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import { useCart } from '@/entities/cart';
import { useCartActions } from '@/features/cart-actions';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { DELIVERY } from '@/shared/config';
import { useNavigation } from '@/shared/lib/navigation';

export function CartDrawer() {
  const { items, totals, clearCart } = useCart();
  const { updateQuantity } = useCartActions();
  const { isCartOpen, setCartOpen, setCheckoutOpen } = useNavigation();

  if (!isCartOpen) return null;

  const close = () => setCartOpen(false);
  const progressPercent = Math.min(100, (totals.subtotal / DELIVERY.freeThreshold) * 100);
  const amountForFreeDelivery = Math.max(0, DELIVERY.freeThreshold - totals.subtotal);
  const hasItems = items.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div onClick={close} className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm" />

      <aside
        aria-label="Shopping cart"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-stone-200 bg-white shadow-2xl sm:w-[440px]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-stone-900">Your Grocery Basket</h2>
              <p className="text-[11px] text-stone-500">
                {totals.count} {totals.count === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasItems && (
              <button
                type="button"
                onClick={clearCart}
                className="flex cursor-pointer items-center gap-1 rounded-lg p-2 text-xs font-semibold text-stone-400 transition hover:text-red-600"
                title="Clear entire cart"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="cursor-pointer rounded-lg p-2 text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between gap-2 font-bold text-emerald-900">
            {amountForFreeDelivery === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Zap className="h-3.5 w-3.5 fill-current text-amber-500" />
                You unlocked FREE Local Delivery!
              </span>
            ) : (
              <span>Add ₹{amountForFreeDelivery} more for FREE Delivery</span>
            )}
            <span className="shrink-0 text-[11px] font-normal text-emerald-700">
              Threshold: ₹{DELIVERY.freeThreshold}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/80">
            <div className="h-2 rounded-full bg-emerald-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!hasItems ? (
            <div className="space-y-3 py-16 text-center text-stone-400">
              <ShoppingBag className="mx-auto h-14 w-14 text-stone-300" />
              <p className="text-sm font-bold text-stone-700">Your basket is empty</p>
              <p className="mx-auto max-w-xs text-xs text-stone-400">
                Add fresh grocery items from our catalog to get instant 30-min doorstep delivery in Sector 14.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-2 cursor-pointer rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                Start Shopping Mandi Items
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3 transition hover:border-emerald-300"
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl border border-stone-100 bg-white object-contain p-1"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-bold text-stone-900">{item.name}</h3>
                  <span className="block text-[11px] text-stone-500">{item.unit} · {item.brand}</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-stone-900 tabular-nums">₹{item.discountPrice * item.qty}</span>
                    <span className="text-[10px] text-stone-400">(₹{item.discountPrice} each)</span>
                  </div>
                </div>

                <div className="w-24 shrink-0">
                  <QuantityStepper
                    quantity={item.qty}
                    itemName={item.name}
                    onDecrement={() => updateQuantity(item.id, -1)}
                    onIncrement={() => updateQuantity(item.id, 1)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {hasItems && (
          <footer className="space-y-3 border-t border-stone-200 bg-stone-50 p-4">
            <dl className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <dt>Items Subtotal</dt>
                <dd className="font-bold text-stone-900 tabular-nums">₹{totals.subtotal}</dd>
              </div>
              {totals.savings > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <dt>Mandi Savings</dt>
                  <dd className="tabular-nums">- ₹{totals.savings}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Local Delivery Fee</dt>
                <dd className="font-bold tabular-nums">
                  {totals.deliveryFee === 0 ? <span className="uppercase text-emerald-700">FREE</span> : `₹${totals.deliveryFee}`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-black text-stone-900">
                <dt>To Pay</dt>
                <dd className="text-base text-emerald-800 tabular-nums">₹{totals.finalTotal}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-[0.99] sm:text-sm"
            >
              <span>Proceed to Express Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
