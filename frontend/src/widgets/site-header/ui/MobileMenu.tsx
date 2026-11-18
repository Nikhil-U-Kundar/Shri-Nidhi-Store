import { useEffect } from 'react';
import { ChevronRight, LogIn, LogOut, MapPin, Package, Sparkles, Wallet, X } from 'lucide-react';
import { ALL_PRODUCTS, buildCategoryList, useCatalog } from '@/entities/product';
import { useAuth } from '@/features/auth';
import { useNavigation, type CustomerTab } from '@/shared/lib/navigation';
import { scrollToCatalog } from '@/shared/lib/scroll';

interface MobileMenuProps {
  onClose: () => void;
}

const ITEM_CLASS =
  'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-stone-800 transition hover:bg-stone-100';

/**
 * Phone navigation: a full-height panel that slides in from the left over a backdrop.
 * Holds the storefront pages, account actions and the category list.
 */
export function MobileMenu({ onClose }: MobileMenuProps) {
  const { isLoggedIn, user, logout, setLoginOpen } = useAuth();
  const { setCustomerTab, setAccountSubTab } = useNavigation();
  const { products, selectedCategory, setSelectedCategory } = useCatalog();
  const categories = buildCategoryList(products);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const goTo = (tab: CustomerTab) => {
    setCustomerTab(tab);
    onClose();
  };

  const openAccount = (section: 'profile' | 'orders' | 'khata') => {
    setAccountSubTab(section);
    goTo('account');
  };

  const pickCategory = (category: string) => {
    setSelectedCategory(category);
    setCustomerTab('home');
    onClose();
    requestAnimationFrame(scrollToCatalog);
  };

  return (
    <div id="mobile-menu" className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 cursor-pointer bg-stone-950/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <span className="text-sm font-black tracking-tight text-stone-900">
            SRI NIDHI <span className="text-emerald-700">STORE</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main menu" className="space-y-1 p-3">
          <button type="button" onClick={() => goTo('home')} className={ITEM_CLASS}>
            <span>Home</span>
          </button>
          <button type="button" onClick={() => goTo('deals')} className={`${ITEM_CLASS} text-amber-800`}>
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Weekend Deals</span>
          </button>
          <button type="button" onClick={() => goTo('tracking')} className={ITEM_CLASS}>
            <MapPin className="h-4 w-4 text-stone-400" />
            <span>Track Order</span>
          </button>

          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => openAccount('khata')}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-emerald-900 px-4 py-3 text-left text-white shadow-md transition hover:bg-emerald-800"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Wallet className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black tracking-wider text-emerald-300 uppercase">Balance due</span>
                    <span className="block text-[11px] text-emerald-100">Kirana Khata · view & pay</span>
                  </span>
                </span>
                <span className="shrink-0 text-lg font-black tabular-nums">₹{user.balanceDue.toLocaleString('en-IN')}</span>
              </button>
              <button type="button" onClick={() => openAccount('orders')} className={ITEM_CLASS}>
                <Package className="h-4 w-4 text-stone-400" />
                <span>My Orders</span>
              </button>
              <button type="button" onClick={() => openAccount('khata')} className={`${ITEM_CLASS} text-emerald-800`}>
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>Kirana Khata Ledger</span>
              </button>
              <button type="button" onClick={() => openAccount('profile')} className={ITEM_CLASS}>
                <ChevronRight className="h-4 w-4 text-stone-400" />
                <span>Profile &amp; Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className={`${ITEM_CLASS} text-red-600 hover:bg-red-50`}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginOpen(true);
                onClose();
              }}
              className={`${ITEM_CLASS} bg-emerald-700 text-white hover:bg-emerald-800`}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </nav>

        <section aria-labelledby="mobile-categories" className="border-t border-stone-100 p-3">
          <h2 id="mobile-categories" className="px-3 pb-2 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
            Categories
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => pickCategory(cat)}
                    className={`w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {cat === ALL_PRODUCTS ? 'All Products' : cat}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
