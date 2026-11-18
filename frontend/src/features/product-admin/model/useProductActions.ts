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
    async (product: Product, imageFile?: File | null) => {
      if (useRemote) {
        try {
          let created = await productApi.create(product);
          if (imageFile) {
            const imageUrl = await productApi.uploadImage(created.id, imageFile);
            created = { ...created, image: imageUrl };
          }
          setProducts((prev) => [created, ...prev]);
          addToast(`Added "${product.name}" to store catalog`, 'success');
        } catch (err) {
          addToast(errorMessage(err, 'Could not add product'), 'error');
        }
        return;
      }
      const image = imageFile ? URL.createObjectURL(imageFile) : product.image;
      setProducts((prev) => [{ ...product, image }, ...prev]);
      addToast(`Added "${product.name}" to store catalog`, 'success');
    },
    [useRemote, setProducts, addToast]
  );

  /** Replace an existing product's photo. */
  const uploadImage = useCallback(
    async (id: string, file: File) => {
      if (useRemote) {
        try {
          const imageUrl = await productApi.uploadImage(id, file);
          setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, image: imageUrl } : p)));
          addToast('Product photo updated', 'success');
        } catch (err) {
          addToast(errorMessage(err, 'Could not upload photo'), 'error');
        }
        return;
      }
      const image = URL.createObjectURL(file);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, image } : p)));
      addToast('Product photo updated', 'success');
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

  return { addProduct, uploadImage, updateProduct, updateStock, deleteProduct };
}
