import { useNavigation } from '@/shared/lib/navigation';
import { AdminPage } from '@/pages/admin';
import { AccountPage } from '@/pages/account';
import { DealsPage } from '@/pages/deals';
import { StorefrontPage } from '@/pages/storefront';
import { TrackingPage } from '@/pages/tracking';
import { CategoryNav } from '@/widgets/category-nav';
import { SiteHeader } from '@/widgets/site-header';
import { GlobalOverlays } from './GlobalOverlays';
import { useAdminRedirects } from './useAdminRedirects';

/** Chooses between the shop-owner console and the customer storefront. */
export function AppShell() {
  const { isAdminPath, customerTab } = useNavigation();
  useAdminRedirects();

  return (
    <div className="min-h-screen min-w-0 max-w-full overflow-x-hidden bg-stone-50 font-sans text-stone-900 selection:bg-emerald-600 selection:text-white">
      {isAdminPath ? (
        <AdminPage />
      ) : (
        <div className="flex min-w-0 max-w-full flex-col overflow-x-hidden">
          <SiteHeader />
          <CategoryNav />
          <main className="flex-1">
            {customerTab === 'home' && <StorefrontPage />}
            {customerTab === 'deals' && <DealsPage />}
            {customerTab === 'account' && <AccountPage />}
            {customerTab === 'tracking' && <TrackingPage />}
          </main>
        </div>
      )}
      <GlobalOverlays />
    </div>
  );
}
