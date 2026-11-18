import { AlertTriangle } from 'lucide-react';
import { useCatalog } from '@/entities/product';
import { useProductActions } from '@/features/product-admin';

const RESTOCK_UNITS = 24;
const REORDER_THRESHOLD = 10;

export function InventoryTab() {
  const { products } = useCatalog();
  const { updateStock } = useProductActions();
  const lowStock = products.filter((p) => p.stock <= REORDER_THRESHOLD);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-stone-900">Inventory Stock &amp; Refill Alerts</h3>
        <p className="text-xs text-stone-500">Items with stock &lt; {REORDER_THRESHOLD} units require reordering from the Mandi supplier</p>
      </div>

      {lowStock.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-xs text-stone-500">
          All products are above the reorder level.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {lowStock.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h4 className="truncate text-xs font-bold text-stone-900 sm:text-sm">{p.name}</h4>
                  <span className="text-xs font-extrabold text-red-600">Only {p.stock} units left on shelf</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void updateStock(p.id, p.stock + RESTOCK_UNITS)}
                className="shrink-0 cursor-pointer rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-stone-800"
              >
                +{RESTOCK_UNITS} Restock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
