import type { Product } from '../model/types';

export type ProductSort = 'popular' | 'price-low' | 'price-high' | 'discount';

export const SORT_OPTIONS: readonly { value: ProductSort; label: string }[] = [
  { value: 'popular', label: 'Popularity & Rating' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
];

export const ALL_PRODUCTS = 'All Products';

/** Filter by category and free-text query (name, brand or category), then sort. */
export function filterProducts(
  products: Product[],
  { category, query, sort }: { category: string; query: string; sort: ProductSort }
): Product[] {
  const needle = query.trim().toLowerCase();
  const matches = products.filter((p) => {
    const inCategory = category === ALL_PRODUCTS || p.category === category;
    const matchesQuery =
      !needle ||
      p.name.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle) ||
      p.category.toLowerCase().includes(needle);
    return inCategory && matchesQuery;
  });

  return [...matches].sort((a, b) => {
    if (sort === 'price-low') return a.discountPrice - b.discountPrice;
    if (sort === 'price-high') return b.discountPrice - a.discountPrice;
    if (sort === 'discount') return b.discount - a.discount;
    return b.rating - a.rating;
  });
}
