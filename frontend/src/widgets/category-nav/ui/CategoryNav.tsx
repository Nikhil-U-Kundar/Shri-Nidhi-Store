import { useMemo } from 'react';
import { ALL_PRODUCTS, buildCategoryList, useCatalog } from '@/entities/product';
import { useNavigation } from '@/shared/lib/navigation';

/** Desktop category strip. On phones the same categories live in the hamburger menu. */
export function CategoryNav() {
  const { products, selectedCategory, setSelectedCategory } = useCatalog();
  const { setCustomerTab } = useNavigation();

  const categories = useMemo(() => buildCategoryList(products), [products]);

  const countFor = (category: string) =>
    category === ALL_PRODUCTS ? products.length : products.filter((p) => p.category === category).length;

  return (
    <nav
      aria-label="Grocery categories"
      className="no-scrollbar hidden overflow-x-auto border-b border-stone-200 bg-stone-100/70 md:block"
    >
      <ul className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap sm:px-6 lg:px-8">
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
