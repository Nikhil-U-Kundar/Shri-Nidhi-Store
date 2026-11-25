import { useState } from 'react';
import { Clock, Menu, MapPin, ShoppingBag, ShoppingBasket, Sparkles, Wallet, X } from 'lucide-react';
import { useCart } from '@/entities/cart';
import { ALL_PRODUCTS, useCatalog } from '@/entities/product';
import { useAuth } from '@/entities/user';
import { ProductSearchBox } from '@/features/product-search';
import { DELIVERY, STORE } from '@/shared/config';
import { useNavigation } from '@/shared/lib/navigation';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';

/** Top notice strip, brand, search, and primary actions (deals, khata, account, cart). */
export function SiteHeader() {
  const { totals } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { customerTab, setCustomerTab, setAccountSubTab, setCartOpen } = useNavigation();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { setSelectedCategory, setSearchQuery } = useCatalog();

  /** Logo click: back to the full storefront, with no category or search filter, at the top of the page. */
  const goHome = () => {
    setSelectedCategory(ALL_PRODUCTS);
    setSearchQuery('');
    setCustomerTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white shadow-sm">
      <div className="border-b border-emerald-900 bg-emerald-950 px-4 py-1.5 text-[11px] font-medium text-emerald-100 sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="hidden items-center gap-2 lg:flex">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Store Open: {STORE.hours} (Daily)</span>
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
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-stone-200 text-stone-700 transition hover:bg-stone-100 md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={goHome}
              className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
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

          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-3">
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
                title="Your khata balance: what you owe the store"
              >
                <Wallet className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="text-left">
                  <span className="block text-[9px] leading-none font-black uppercase text-emerald-700">Balance due</span>
                  <span className="text-sm leading-tight font-black text-emerald-950 tabular-nums">
                    ₹{user.balanceDue.toLocaleString('en-IN')}
                  </span>
                </span>
              </button>
            )}

            <div className="hidden md:block">
              <UserMenu />
            </div>

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

        {isMenuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </header>
  );
}
