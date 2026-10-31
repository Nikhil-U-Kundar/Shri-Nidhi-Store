import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { categoriesList } from '../data/mockData';

export const CategoryNav: React.FC = () => {
  const { selectedCategory, setSelectedCategory, setCustomerTab, products } = useApp();

  const categories = useMemo(() => {
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
    const merged = ['All Products', ...fromProducts];
    // Keep proto order when categories overlap
    const ordered = categoriesList.filter((c) => merged.includes(c));
    const extras = merged.filter((c) => !ordered.includes(c));
    return [...ordered, ...extras];
  }, [products]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'All Products') return products.length;
    return products.filter((p) => p.category === cat).length;
  };

  return (
    <nav
      aria-label="Grocery categories"
      className="border-b border-stone-200 bg-stone-100/70 overflow-x-auto no-scrollbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 sm:gap-2 py-2 text-xs font-semibold whitespace-nowrap">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const count = getCategoryCount(cat);

          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCustomerTab('home');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm font-bold'
                  : 'text-stone-700 hover:bg-stone-200/80 hover:text-stone-950 font-medium'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1 rounded font-bold ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
