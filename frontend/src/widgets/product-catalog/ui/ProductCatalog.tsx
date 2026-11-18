import { ALL_PRODUCTS, SORT_OPTIONS, filterProducts, useCatalog, type ProductSort } from '@/entities/product';
import { CATALOG_SECTION_ID } from '@/shared/lib/scroll';
import { ProductGrid } from './ProductGrid';

/** Filtered, sorted catalog with the sort control and an empty state. */
export function ProductCatalog() {
  const { products, selectedCategory, searchQuery, sortBy, setSortBy, setSearchQuery, setSelectedCategory } = useCatalog();

  const visible = filterProducts(products, { category: selectedCategory, query: searchQuery, sort: sortBy });

  const heading =
    selectedCategory === ALL_PRODUCTS ? "Today's Mandi Fresh Stock & Daily Essentials" : selectedCategory;

  return (
    <section id={CATALOG_SECTION_ID} aria-labelledby="catalog-heading" className="mx-auto w-full min-w-0 max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="catalog-heading" className="text-lg font-black tracking-tight break-words text-stone-900 sm:text-2xl">
            {heading}
          </h2>
          <p className="text-xs text-stone-500">Showing {visible.length} verified products available at Sector 14 shelf</p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 text-xs sm:w-auto">
          <label htmlFor="catalog-sort" className="shrink-0 font-semibold text-stone-500">Sort by:</label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductSort)}
            className="max-w-full min-w-0 flex-1 cursor-pointer rounded-xl border border-stone-300 bg-white px-3 py-2 font-semibold text-stone-800 shadow-sm focus:border-emerald-600 focus:outline-none sm:flex-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 space-y-3 rounded-3xl border border-dashed border-stone-200 bg-white px-4 py-16 text-center">
          <p className="text-sm font-bold text-stone-800">No Kirana products found</p>
          <p className="text-xs text-stone-400">Try clearing your search query or selecting another grocery category.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(ALL_PRODUCTS);
            }}
            className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid products={visible} />
        </div>
      )}
    </section>
  );
}
