import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from './types';
import { initialProducts } from './mock-data';
import { productApi } from '../api/productApi';
import { ALL_PRODUCTS, type ProductSort } from '../lib/filter';

interface CatalogValue {
  products: Product[];
  setProducts: (update: Product[] | ((prev: Product[]) => Product[])) => void;
  catalogLoading: boolean;
  /** True when the API is unreachable and the bundled sample catalog is shown instead. */
  usingMockCatalog: boolean;
  refreshCatalog: () => Promise<void>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: ProductSort;
  setSortBy: (sort: ProductSort) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
}

interface CatalogProviderProps {
  children: ReactNode;
  /** Shoppers only see visible products; the admin console sees everything. */
  visibleOnly: boolean;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children, visibleOnly }: CatalogProviderProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [usingMockCatalog, setUsingMockCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSort>('popular');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const list = await productApi.list(visibleOnly);
      setProducts(list.length ? list : initialProducts);
      setUsingMockCatalog(false);
    } catch {
      setProducts(initialProducts);
      setUsingMockCatalog(true);
    } finally {
      setCatalogLoading(false);
    }
  }, [visibleOnly]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const value = useMemo<CatalogValue>(
    () => ({
      products,
      setProducts,
      catalogLoading,
      usingMockCatalog,
      refreshCatalog,
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      quickViewProduct,
      setQuickViewProduct,
    }),
    [products, catalogLoading, usingMockCatalog, refreshCatalog, selectedCategory, searchQuery, sortBy, quickViewProduct]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
