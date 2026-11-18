import { Clock, MapPin, ShoppingBag, ShoppingBasket, Sparkles, Wallet } from 'lucide-react';
import { useCart } from '@/entities/cart';
import { useAuth } from '@/features/auth';
import { ProductSearchBox } from '@/features/product-search';
import { DELIVERY, STORE } from '@/shared/config/store';
import { useNavigation } from '@/shared/lib/navigation';
import { UserMenu } from './UserMenu';

/** Top notice strip, brand, search, and primary actions (deals, khata, account, cart). */
export function SiteHeader() {
  const { totals } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { customerTab, setCustomerTab, setAccountSubTab, setCartOpen } = useNavigation();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
      <div className="border-b border-emerald-900 bg-emerald-950 px-4 py-1.5 text-[11px] font-medium text-emerald-100 sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="hidden items-center gap-2 lg:flex">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Store Open: 7:00 AM – 10:00 PM (Daily)</span>
            <span className="text-emerald-500">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Belapu, industrial Area
            </span>
          </div>

          <div className="mx-auto flex flex-wrap items-center justify-center gap-2 lg:mx-0">
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black uppercase text-stone-900">Mandi Rates</span>
            <span className="text-stone-200">
              Free delivery on orders above ₹{DELIVERY.freeThreshold}
              <span className="hidden sm:inline"> | Instant 30-min local delivery</span>
            </span>
          </div>

          <div className="hidden items-center gap-3 text-stone-300 md:flex">
            <span>Call Store: {STORE.phoneDisplay}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 py-2.5 sm:py-3 md:min-h-20">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setCustomerTab('home')}
              className="group flex min-w-0 cursor-pointer items-center gap-2 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-700/25 transition group-hover:scale-105 sm:h-11 sm:w-11">
                <ShoppingBasket className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-black tracking-tight text-stone-900 sm:text-xl">
                  SRI NIDHI <span className="text-emerald-700">STORE</span>
                </span>
                <span className="block truncate text-[10px] font-semibold tracking-wider text-stone-500 uppercase sm:block">
                  General Store · Best Mandi Prices
                </span>
              </span>
            </button>
          </div>

          <div className="order-last w-full md:order-none md:w-auto md:flex-1">
            <ProductSearchBox />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setCustomerTab('deals')}
              className={`hidden cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex ${
                customerTab === 'deals' ? 'bg-amber-100 text-amber-900' : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Weekend Deals</span>
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setCustomerTab('account');
                  setAccountSubTab('khata');
                }}
                className="hidden cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 lg:flex"
                title="Your Kirana Khata / Monthly Store Credit"
              >
                <Wallet className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="text-left">
                  <span className="block text-[9px] leading-none font-black uppercase text-emerald-700">Khata Credit</span>
                  <span className="text-sm leading-tight font-black text-emerald-950 tabular-nums">
                    ₹{user.khataBalance.toLocaleString('en-IN')}
                  </span>
                </span>
              </button>
            )}

            <UserMenu />

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-2.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm"
              aria-label={`Cart with ${totals.count} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="min-w-5 rounded-full bg-amber-400 px-1.5 py-px text-center text-[11px] font-black text-stone-950 tabular-nums">
                {totals.count}
              </span>
              <span className="hidden border-l border-emerald-600 pl-2 text-xs font-bold tabular-nums md:inline">
                ₹{totals.subtotal}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
