import { Building, Clock, Minus, Plus, ShieldCheck, ShoppingBag, Star, X } from 'lucide-react';
import { useCart } from '@/entities/cart';
import { useCatalog } from '@/entities/product';
import { useCartActions } from '@/features/cart-actions';
import { useNavigation } from '@/shared/lib/navigation';
import { Modal } from '@/shared/ui/Modal';
import { LOW_STOCK_THRESHOLD } from '@/shared/config/store';

/** Product detail dialog with the purchase controls. */
export function ProductQuickView() {
  const { quickViewProduct: product, setQuickViewProduct } = useCatalog();
  const { items } = useCart();
  const { addToCart, updateQuantity } = useCartActions();
  const { setCartOpen } = useNavigation();

  if (!product) return null;

  const close = () => setQuickViewProduct(null);
  const inCart = items.find((item) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.price > product.discountPrice;

  return (
    <Modal label={product.name} onClose={close} size="sm:max-w-2xl">
      <button
        type="button"
        onClick={close}
        className="absolute right-3 top-3 z-10 cursor-pointer rounded-full bg-stone-100 p-2 text-stone-400 transition hover:bg-stone-200 hover:text-stone-700"
        aria-label="Close product details"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="grid grid-cols-1 gap-6 p-5 sm:p-8 md:grid-cols-2 md:items-center">
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-stone-100 bg-stone-50 p-6">
          <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="max-h-48 w-full max-w-full object-contain sm:max-h-64" />
        </div>

        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-stone-500">
              <span className="truncate uppercase tracking-wider text-emerald-800">{product.category}</span>
              <span className="flex shrink-0 items-center font-bold text-amber-500">
                <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                {product.rating} ({product.reviewsCount || 45} reviews)
              </span>
            </div>

            <h2 className="pr-8 text-lg leading-snug font-black text-stone-900 sm:text-xl">{product.name}</h2>

            <p className="mt-1 text-xs text-stone-600">
              Brand: <span className="font-bold text-stone-900">{product.brand}</span> · Pack:{' '}
              <span className="font-bold text-stone-900">{product.unit}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 tabular-nums">₹{product.discountPrice}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-stone-400 line-through tabular-nums">₹{product.price}</span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">{product.discount}% OFF</span>
                </>
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-stone-200/60 bg-stone-50 p-3.5 text-xs text-stone-700">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  <strong>Stock:</strong>{' '}
                  <span className={product.stock > LOW_STOCK_THRESHOLD ? 'font-bold text-emerald-700' : 'font-bold text-amber-600'}>
                    {product.stock > 0 ? `${product.stock} units available at Sector 14 shelf` : 'Out of Stock'}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Building className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                <span><strong>Mfr:</strong> {product.mfg}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                <span><strong>Expiry Guarantee:</strong> {product.expiry}</span>
              </div>
              {product.fssaiNumber && (
                <div className="border-t border-stone-200 pt-2 text-[11px] text-stone-500">FSSAI Lic. No: {product.fssaiNumber}</div>
              )}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-600">{product.description}</p>
          </div>

          <div className="border-t border-stone-100 pt-3">
            {isOutOfStock ? (
              <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-stone-200 py-3 text-center text-xs font-bold text-stone-500">
                Currently Out of Stock
              </button>
            ) : inCart ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, -1)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                    aria-label={`Decrease ${product.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-black text-emerald-950 tabular-nums">{inCart.qty} in Basket</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, 1)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                    aria-label={`Increase ${product.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewProduct(null);
                    setCartOpen(true);
                  }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-stone-800"
                >
                  <ShoppingBag className="h-4 w-4" />
                  View Cart
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add to Cart (₹{product.discountPrice})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
