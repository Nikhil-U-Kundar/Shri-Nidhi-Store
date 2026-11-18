import { apiRequest } from '@/shared/api/client';
import type { Bill, NewBill } from '../model/types';

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
          productId: item.id.startsWith('bill-') ? undefined : item.id,
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
