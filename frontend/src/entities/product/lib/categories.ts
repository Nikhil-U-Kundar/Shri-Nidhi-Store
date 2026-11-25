import { CATEGORIES } from '@/shared/config';
import { ALL_PRODUCTS } from './filter';

/** Category names in shop order, with "All Products" first and any unlisted categories appended. */
export function buildCategoryList(products: { category: string }[]): string[] {
  const fromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  const merged = [ALL_PRODUCTS, ...fromProducts];
  const ordered = CATEGORIES.filter((c) => merged.includes(c));
  const extras = merged.filter((c) => !ordered.includes(c));
  return [...ordered, ...extras];
}
