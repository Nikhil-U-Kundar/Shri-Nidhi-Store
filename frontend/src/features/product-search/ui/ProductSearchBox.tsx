import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useCatalog } from '@/entities/product';

const MAX_SUGGESTIONS = 5;

/** Header search with instant product suggestions; picking one opens its quick view. */
export function ProductSearchBox() {
  const { products, searchQuery, setSearchQuery, setQuickViewProduct } = useCatalog();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const needle = searchQuery.trim().toLowerCase();
  const suggestions = needle
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            p.brand.toLowerCase().includes(needle) ||
            p.category.toLowerCase().includes(needle)
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  return (
    <div ref={containerRef} className="relative w-full md:mx-2 md:max-w-xl md:flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search Atta, Fortune Oil, Tata Salt, Dals, Spices..."
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full rounded-xl border border-transparent bg-stone-100 py-2.5 pr-9 pl-10 text-xs transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:outline-none sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-stone-400 hover:text-stone-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && needle.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex justify-between bg-stone-50 p-2 text-[11px] font-bold text-stone-500">
            <span>MATCHING PRODUCTS</span>
            <span className="text-emerald-700">Sri Nidhi Store Inventory</span>
          </div>
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setQuickViewProduct(item);
                  setIsOpen(false);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-3 p-2.5 text-left text-xs transition hover:bg-stone-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img src={item.image} alt="" className="h-9 w-9 shrink-0 rounded bg-stone-100 object-contain p-0.5" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-900">{item.name}</p>
                    <span className="text-[11px] text-stone-500">{item.unit} · {item.brand}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-black text-emerald-800">₹{item.discountPrice}</span>
                  {item.price > item.discountPrice && (
                    <span className="block text-[10px] text-stone-400 line-through">₹{item.price}</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-stone-400">No grocery items found for &quot;{searchQuery}&quot;.</div>
          )}
        </div>
      )}
    </div>
  );
}
