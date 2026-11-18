import { useMemo } from 'react';
import { useCatalog, ALL_PRODUCTS } from '@/entities/product';
import { CATEGORIES } from '@/shared/config/categories';
import { useNavigation } from '@/shared/lib/navigation';

/** Horizontally scrolling category strip; keeps the shared category order and appends any new ones. */
export function CategoryNav() {
  const { products, selectedCategory, setSelectedCategory } = useCatalog();
  const { setCustomerTab } = useNavigation();

  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
    const merged = [ALL_PRODUCTS, ...fromProducts];
    const ordered = CATEGORIES.filter((c) => merged.includes(c));
    const extras = merged.filter((c) => !ordered.includes(c));
    return [...ordered, ...extras];
  }, [products]);

  const countFor = (category: string) =>
    category === ALL_PRODUCTS ? products.length : products.filter((p) => p.category === category).length;

  return (
    <nav aria-label="Grocery categories" className="no-scrollbar overflow-x-auto border-b border-stone-200 bg-stone-100/70">
      <ul className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2 text-xs font-semibold whitespace-nowrap sm:gap-2 sm:px-6 lg:px-8">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <li key={cat} className="shrink-0">
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCustomerTab('home');
                }}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  isActive
                    ? 'bg-emerald-700 font-bold text-white shadow-sm'
                    : 'font-medium text-stone-700 hover:bg-stone-200/80 hover:text-stone-950'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded px-1 text-[10px] font-bold ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {countFor(cat)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
