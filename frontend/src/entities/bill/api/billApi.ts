import { apiRequest } from '@/shared/api/client';
import type { Bill, NewBill } from '../model/types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const billApi = {
  async list(): Promise<Bill[]> {
    const data = await apiRequest<{ bills?: Bill[] }>('/bills');
    return data.bills ?? [];
  },

  async create(bill: NewBill): Promise<Bill> {
    const data = await apiRequest<{ bill: Bill }>('/bills', {
      method: 'POST',
      body: JSON.stringify({
        ...bill,
        items: bill.items.map((item) => ({
          // Only catalog lines carry a product id (a UUID); quick and loose lines have none.
          productId: UUID_PATTERN.test(item.id) ? item.id : undefined,
          name: item.name,
          unit: item.unit,
          price: item.price,
          qty: item.qty,
        })),
      }),
    });
    return data.bill;
  },

  remove(id: string): Promise<unknown> {
    return apiRequest(`/bills/${id}`, { method: 'DELETE' });
  },
};
