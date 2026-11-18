import { apiRequest } from '@/shared/api/client';
import type { Address, KhataTransaction } from '../model/types';

/** Customer or owner record as returned by the auth and profile endpoints. */
export interface ApiUser {
  id?: string | null;
  balanceDue?: number | string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: 'customer' | 'admin' | null;
  addresses?: Address[] | null;
  khataBalance?: number | string | null;
  khataCreditLimit?: number | string | null;
  khataLedger?: KhataTransaction[] | null;
}

export const userApi = {
  async profile(): Promise<ApiUser> {
    const data = await apiRequest<{ user: ApiUser }>('/profile/me');
    return data.user;
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const data = await apiRequest<{ address: Address }>('/profile/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
    return data.address;
  },

  removeAddress(id: string): Promise<unknown> {
    return apiRequest(`/profile/addresses/${id}`, { method: 'DELETE' });
  },

};
