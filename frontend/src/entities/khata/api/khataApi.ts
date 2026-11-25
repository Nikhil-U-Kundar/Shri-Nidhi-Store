import { API_BASE, apiRequest } from '@/shared/api';

export interface KhataEntry {
  id: string;
  type: 'credit' | 'payment';
  title: string;
  description: string;
  amount: number;
  /** ISO timestamp of the entry date. */
  date: string;
  balanceAfter: number;
  paymentMode?: string;
  /** Items a payment covers (payments only). */
  items?: string;
  note?: string;
}

export interface KhataPassbook {
  customer: { id: string; name: string; phone: string; phoneFormatted: string; initials: string };
  summary: { balanceDue: number; totalPaid: number; totalCredit: number };
  /** Newest first. */
  entries: KhataEntry[];
}

export interface KhataCustomer {
  id: string;
  name: string;
  phoneFormatted: string;
  balanceDue: number;
  totalCredit: number;
  totalPaid: number;
  status: 'pending' | 'clear';
  initials: string;
}

export interface NewKhataCredit {
  userId: string;
  date: string;
  item: string;
  amount: number;
  note: string;
}

export interface NewKhataPayment {
  userId: string;
  date: string;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'bank';
  /** Which items this payment covers, e.g. "Tea powder, Milk". */
  items: string;
  note: string;
}

export const khataApi = {
  passbook(customerId: string): Promise<KhataPassbook> {
    return apiRequest<KhataPassbook>(`/customers/${encodeURIComponent(customerId)}/passbook`);
  },

  async customers(search = ''): Promise<KhataCustomer[]> {
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    const data = await apiRequest<{ customers: KhataCustomer[] }>(`/admin/customers${q}`);
    return data.customers;
  },

  addCredit(input: NewKhataCredit): Promise<unknown> {
    return apiRequest('/transactions/credit', {
      method: 'POST',
      body: JSON.stringify({
        userId: input.userId,
        date: input.date,
        groceryItem: input.item,
        amount: input.amount,
        note: input.note,
      }),
    });
  },

  addPayment(input: NewKhataPayment): Promise<unknown> {
    return apiRequest('/transactions/payment', {
      method: 'POST',
      body: JSON.stringify({
        userId: input.userId,
        date: input.date,
        amount: input.amount,
        paymentMode: input.paymentMode,
        items: input.items,
        note: input.note,
      }),
    });
  },

  /** Absolute URL of the store's payment QR image. Shown with an <img> tag. */
  paymentQrUrl(cacheBust?: number): string {
    return `${API_BASE}/api/store/payment-qr${cacheBust ? `?v=${cacheBust}` : ''}`;
  },

  async uploadPaymentQr(file: File): Promise<void> {
    await apiRequest('/admin/store/payment-qr', {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  },
};
