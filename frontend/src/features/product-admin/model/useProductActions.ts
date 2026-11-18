import { useCallback } from 'react';
import { productApi, useCatalog, type Product } from '@/entities/product';
import { useAuth } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

/**
 * Catalog management for the shop owner. Changes go to the API when it is reachable;
 * otherwise they only update the sample catalog on screen.
 */
export function useProductActions() {
  const { setProducts, usingMockCatalog } = useCatalog();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const useRemote = isAdmin && !usingMockCatalog;

  const addProduct = useCallback(
    async (product: Product) => {
      if (useRemote) {
        try {
          const created = await productApi.create(product);
          setProducts((prev) => [created, ...prev]);
          addToast(`Added "${product.name}" to store catalog`, 'success');
        } catch (err) {
          addToast(errorMessage(err, 'Could not add product'), 'error');
        }
        return;
      }
      setProducts((prev) => [product, ...prev]);
      addToast(`Added "${product.name}" to store catalog`, 'success');
    },
    [useRemote, setProducts, addToast]
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      if (useRemote) {
        try {
          const updated = await productApi.update(id, updates);
          setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
          addToast('Product updated successfully', 'success');
        } catch (err) {
          addToast(errorMessage(err, 'Could not update product'), 'error');
        }
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      addToast('Product updated successfully', 'success');
    },
    [useRemote, setProducts, addToast]
  );

  const updateStock = useCallback((id: string, stock: number) => updateProduct(id, { stock }), [updateProduct]);

  const deleteProduct = useCallback(
    async (id: string) => {
      if (useRemote) {
        try {
          await productApi.remove(id);
        } catch (err) {
          addToast(errorMessage(err, 'Could not delete product'), 'error');
          return;
        }
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast('Product removed from catalog', 'info');
    },
    [useRemote, setProducts, addToast]
  );

  return { addProduct, updateProduct, updateStock, deleteProduct };
}
