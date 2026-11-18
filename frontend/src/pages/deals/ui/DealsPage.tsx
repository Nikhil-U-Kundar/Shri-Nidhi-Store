import { ArrowLeft } from 'lucide-react';
import { filterProducts, useCatalog, ALL_PRODUCTS } from '@/entities/product';
import { useNavigation } from '@/shared/lib/navigation';
import { ProductGrid } from '@/widgets/product-catalog';

const MIN_DEAL_DISCOUNT = 10;

export function DealsPage() {
  const { products } = useCatalog();
  const { setCustomerTab } = useNavigation();
  const deals = filterProducts(products, { category: ALL_PRODUCTS, query: '', sort: 'discount' }).filter(
    (p) => p.discount >= MIN_DEAL_DISCOUNT
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={() => setCustomerTab('home')}
        className="flex cursor-pointer items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Groceries</span>
      </button>

      <section className="rounded-3xl bg-linear-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white shadow-xl sm:p-10">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black tracking-wider uppercase backdrop-blur">
          Weekend Mandi Savings Fair
        </span>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">Bumper Grocery &amp; Combo Mandi Deals</h2>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-amber-100 sm:text-sm">
          Bulk savings passed directly from manufacturer distributors to your neighborhood basket. Genuine discounts up to 22%
          OFF on Atta, Edible Oil, Rice, and Spices.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-black text-stone-900 sm:text-lg">
            Featured Deals ({deals.length} items with &gt;{MIN_DEAL_DISCOUNT}% off)
          </h3>
          <span className="text-xs text-stone-500">Mandi verified prices</span>
        </div>

        {deals.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center text-xs text-stone-500">
            No deals are running right now. Check back at the weekend.
          </p>
        ) : (
          <ProductGrid products={deals} />
        )}
      </section>
    </div>
  );
}
