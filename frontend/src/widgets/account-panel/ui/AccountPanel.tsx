import { Lock, LogOut, MapPin, Package, User, Wallet } from 'lucide-react';
import { useOrders } from '@/entities/order';
import { useAuth } from '@/features/auth';
import { useNavigation, type AccountSubTab } from '@/shared/lib/navigation';
import { AddressesSection } from './AddressesSection';
import { KhataSection } from './KhataSection';
import { OrdersSection } from './OrdersSection';
import { ProfileSection } from './ProfileSection';

interface SectionLink {
  id: AccountSubTab;
  label: string;
  icon: typeof User;
  badge?: string;
  tone?: 'default' | 'khata';
}

/** Signed-in customer area: profile, order history, Khata ledger and saved addresses. */
export function AccountPanel() {
  const { isLoggedIn, user, logout, setLoginOpen } = useAuth();
  const { orders } = useOrders();
  const { accountSubTab, setAccountSubTab } = useNavigation();

  if (!isLoggedIn) {
    return (
      <div className="mx-auto my-10 max-w-md space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-lg sm:my-14 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-black text-stone-900">Sign in to Access Your Account</h2>
        <p className="text-xs leading-relaxed text-stone-500">
          Guest shopping is 100% open without sign-in barriers! However, checking your past orders, delivery addresses, and{' '}
          <strong>Kirana Khata (Store Credit)</strong> requires mobile sign-in.
        </p>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="w-full cursor-pointer rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 sm:text-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  const links: SectionLink[] = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package, badge: String(orders.length) },
    { id: 'khata', label: 'Kirana Khata', icon: Wallet, badge: `₹${user.balanceDue}`, tone: 'khata' },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full min-w-0 self-start rounded-3xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4 md:w-64">
          <div className="mb-2 hidden items-center gap-3 border-b border-stone-100 pb-4 md:flex">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-800">
              {user.name.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-bold text-stone-900">{user.name}</h3>
              <p className="truncate text-[11px] text-stone-500">{user.phone}</p>
            </div>
          </div>

          <nav aria-label="Account sections" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 md:flex-col md:overflow-visible">
            {links.map(({ id, label, icon: Icon, badge, tone }) => {
              const isActive = accountSubTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccountSubTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex shrink-0 cursor-pointer items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition md:w-full md:shrink ${
                    isActive
                      ? tone === 'khata'
                        ? 'bg-emerald-50 font-bold text-emerald-900'
                        : 'bg-emerald-50 font-bold text-emerald-800'
                      : tone === 'khata'
                        ? 'text-emerald-800 hover:bg-emerald-50/50'
                        : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${tone === 'khata' ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <span>{label}</span>
                  </span>
                  {badge && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tone === 'khata' ? 'bg-emerald-200 font-black text-emerald-950' : 'bg-stone-100 text-stone-700'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-2 border-t border-stone-100 pt-2 md:mt-3 md:pt-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          {accountSubTab === 'profile' && <ProfileSection />}
          {accountSubTab === 'orders' && <OrdersSection />}
          {accountSubTab === 'khata' && <KhataSection />}
          {accountSubTab === 'addresses' && <AddressesSection />}
        </main>
      </div>
    </div>
  );
}
