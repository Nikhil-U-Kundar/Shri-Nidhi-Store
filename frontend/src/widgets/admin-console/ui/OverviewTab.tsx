import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { useCatalog } from '@/entities/product';
import { useOrders } from '@/entities/order';
import { LOW_STOCK_THRESHOLD } from '@/shared/config/store';
import { AddProductDialog } from '@/features/product-admin';

const DAILY_TREND = [
  { x: 50, y: 110, day: 'Mon', val: '₹4.2k' },
  { x: 150, y: 85, day: 'Tue', val: '₹5.8k' },
  { x: 250, y: 90, day: 'Wed', val: '₹6.1k' },
  { x: 350, y: 75, day: 'Thu', val: '₹6.9k' },
  { x: 450, y: 45, day: 'Fri', val: '₹8.4k' },
  { x: 550, y: 20, day: 'Sat', val: '₹12.2k' },
  { x: 650, y: 40, day: 'Sun', val: '₹9.8k' },
] as const;

const KPI_CARD = 'space-y-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5';
const KPI_LABEL = 'block text-[11px] font-bold tracking-wider text-stone-400 uppercase';

export function OverviewTab() {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Placeholder baselines kept from the original dashboard until real sales history exists.
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.total, 48500);
  const todaySales = orders.slice(0, 3).reduce((sum, o) => sum + o.total, 8420);
  const pendingOrders = orders.filter((o) => o.status !== 'Delivered').length;
  const lowStockCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-stone-900 sm:text-2xl">Store Operations Command Center</h2>
          <p className="text-xs text-stone-500">Live metrics, stock refills, and delivery dispatch for Sector 14</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddProduct(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className={KPI_CARD}>
          <span className={KPI_LABEL}>Today&apos;s Store Sales</span>
          <p className="text-2xl font-black text-stone-900 tabular-nums sm:text-3xl">₹{todaySales.toLocaleString('en-IN')}</p>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <TrendingUp className="h-3 w-3" /> ↑ 18% vs yesterday
          </span>
        </div>
        <div className={KPI_CARD}>
          <span className={KPI_LABEL}>Pending Orders</span>
          <p className="text-2xl font-black text-amber-600 tabular-nums sm:text-3xl">{pendingOrders}</p>
          <span className="text-[11px] text-stone-500">Awaiting packaging / rider dispatch</span>
        </div>
        <div className={KPI_CARD}>
          <span className={KPI_LABEL}>Low Stock Alerts</span>
          <p className="text-2xl font-black text-red-600 tabular-nums sm:text-3xl">{lowStockCount}</p>
          <span className="text-[11px] font-bold text-red-600">Needs distributor reorder</span>
        </div>
        <div className={KPI_CARD}>
          <span className={KPI_LABEL}>Total Khata Credit</span>
          <p className="text-2xl font-black text-emerald-800 tabular-nums sm:text-3xl">₹18,450</p>
          <span className="text-[11px] text-stone-500">Across 14 regular families</span>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900">7-Day Mandi Sales Trajectory (₹ INR)</h3>
            <p className="text-xs text-stone-500">Monday through Sunday daily store billing</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Weekly Gross: ₹{totalSalesRevenue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="h-48 w-full pt-4">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 700 160" role="img" aria-label="Seven day sales trend">
            {[40, 80, 120].map((y) => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="50,110 150,85 250,90 350,75 450,45 550,20 650,40 650,150 50,150" fill="url(#chartGradient)" />
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="50,110 150,85 250,90 350,75 450,45 550,20 650,40"
            />
            {DAILY_TREND.map((pt) => (
              <g key={pt.day}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">
                  {pt.val}
                </text>
                <text x={pt.x} y="155" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                  {pt.day}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {showAddProduct && <AddProductDialog onClose={() => setShowAddProduct(false)} />}
    </div>
  );
}
