import { apiRequest } from '@/shared/api/client';
import type { Product } from '../model/types';
import { mapApiProduct, resolveImageUrl, toApiProductBody, toApiProductPatch, type ApiProduct } from '../lib/mapper';

export const productApi = {
  async list(visibleOnly: boolean): Promise<Product[]> {
    const data = await apiRequest<{ products?: ApiProduct[] }>(
      `/products${visibleOnly ? '?visible=true' : ''}`
    );
    return (data.products ?? []).map(mapApiProduct);
  },

  async create(product: Partial<Product>): Promise<Product> {
    const data = await apiRequest<{ product: ApiProduct }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(toApiProductBody(product)),
    });
    return mapApiProduct(data.product);
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const data = await apiRequest<{ product: ApiProduct }>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toApiProductPatch(updates)),
    });
    return mapApiProduct(data.product);
  },

  /** Upload a product photo; returns the stored image URL (relative to the API). */
  async uploadImage(id: string, file: File): Promise<string> {
    const data = await apiRequest<{ imageUrl: string }>(`/admin/products/${id}/image`, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    return resolveImageUrl(data.imageUrl);
  },

  remove(id: string): Promise<unknown> {
    return apiRequest(`/admin/products/${id}`, { method: 'DELETE' });
  },
};
