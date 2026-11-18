import { apiRequest } from '@/shared/api/client';
import type { Order, OrderStatus } from '../model/types';

export interface NewOrderRequest {
  deliveryAddress: string;
  deliveryMode: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; qty: number; unit: string }[];
}

export const orderApi = {
  async list(): Promise<Order[]> {
    const data = await apiRequest<{ orders?: Order[] }>('/orders');
    return data.orders ?? [];
  },

  async create(order: NewOrderRequest): Promise<Order> {
    const data = await apiRequest<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return data.order;
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const data = await apiRequest<{ order: Order }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return data.order;
  },
};
