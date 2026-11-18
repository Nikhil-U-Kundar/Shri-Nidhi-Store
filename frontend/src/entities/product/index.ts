export type { Product } from './model/types';
export { CatalogProvider, useCatalog } from './model/CatalogProvider';
export { initialProducts } from './model/mock-data';
export { productApi } from './api/productApi';
export { ACCEPTED_IMAGE_TYPES } from './lib/imageTypes';
export { filterProducts, ALL_PRODUCTS, SORT_OPTIONS } from './lib/filter';
export type { ProductSort } from './lib/filter';
export { ProductCard } from './ui/ProductCard';
export { buildCategoryList } from './lib/categories';
