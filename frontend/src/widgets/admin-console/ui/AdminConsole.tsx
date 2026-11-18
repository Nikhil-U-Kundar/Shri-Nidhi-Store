import { useState } from 'react';
import { AlertTriangle, BarChart3, BookOpen, Boxes, FileText, LayoutDashboard, LogOut, Package } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useCatalog } from '@/entities/product';
import { useOrders } from '@/entities/order';
import { LOW_STOCK_THRESHOLD } from '@/shared/config/store';
import { PosBilling } from '@/widgets/pos-billing';
import { OverviewTab } from './OverviewTab';
import { OrdersTab } from './OrdersTab';
import { CatalogTab } from './CatalogTab';
import { KhataTab } from './KhataTab';
import { InventoryTab } from './InventoryTab';
import { ReportsTab } from './ReportsTab';

type AdminTab = 'dashboard' | 'orders' | 'products' | 'khata' | 'inventory' | 'reports' | 'billing';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: typeof Boxes;
  badge?: { value: number; tone: 'amber' | 'red' };
}

/** Shop-owner console: sidebar navigation on desktop, a scrolling tab bar on phones. */
export function AdminConsole() {
  const { user, logout } = useAuth();
  const { products } = useCatalog();
  const { orders } = useOrders();
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const pendingOrders = orders.filter((o) => o.status !== 'Delivered').length;
  const lowStockCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard & Metrics', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders Pipeline', icon: Package, badge: { value: pendingOrders, tone: 'amber' } },
    { id: 'products', label: 'Catalog (CRUD)', icon: Boxes },
    { id: 'khata', label: 'Khata / Udhar Ledger', icon: BookOpen },
    { id: 'inventory', label: 'Stock & Low Alerts', icon: AlertTriangle, badge: { value: lowStockCount, tone: 'red' } },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'billing', label: 'Counter Billing (POS)', icon: FileText },
  ];

  const initials = user.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-stone-800 bg-stone-900 text-stone-300 md:w-64 md:border-r md:border-b-0">
        <div>
          <div className="flex h-14 items-center gap-3 border-b border-stone-800 bg-stone-950 px-4 md:h-16 md:px-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white">Sri Nidhi Store Admin</h1>
              <p className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Store Operations</p>
            </div>
          </div>

          <nav aria-label="Admin sections" className="no-scrollbar flex gap-1 overflow-x-auto p-2 text-xs font-semibold md:flex-col md:space-y-1 md:p-4">
            {items.map(({ id, label, icon: Icon, badge }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 whitespace-nowrap transition md:w-full ${
                    isActive ? 'bg-emerald-600 text-white shadow' : 'text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${id === 'khata' || id === 'billing' ? 'text-emerald-400' : ''}`} />
                    <span>{label}</span>
                  </span>
                  {badge && badge.value > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-px text-[10px] font-black ${
                        badge.tone === 'amber' ? 'bg-amber-400 text-stone-950' : 'bg-red-500 text-white'
                      }`}
                    >
                      {badge.value}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto hidden border-t border-stone-800 bg-stone-950 p-4 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-xs font-bold text-emerald-100">{initials}</div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-bold text-white">{user.name || 'Shop Owner'}</p>
              <p className="truncate text-[10px] text-stone-400">{user.email || 'Store operations'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-800 py-2 text-xs font-bold text-stone-200 transition hover:bg-stone-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:h-screen md:overflow-y-auto lg:p-8">
        {tab === 'dashboard' && <OverviewTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'products' && <CatalogTab />}
        {tab === 'khata' && <KhataTab />}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'billing' && <PosBilling />}
      </main>
    </div>
  );
}
