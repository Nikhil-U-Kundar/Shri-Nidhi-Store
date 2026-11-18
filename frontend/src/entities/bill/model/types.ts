export type BillPaymentMethod = 'Cash' | 'UPI' | 'Kirana Khata' | 'Card';

export interface BillLineItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  time: string;
  timestamp: number;
  customerName: string;
  customerPhone: string;
  customerType: 'walk-in' | 'regular' | 'khata';
  items: BillLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: BillPaymentMethod;
  paymentStatus: 'Paid' | 'Added to Khata';
  cashierName?: string;
  notes?: string;
}

/** Everything the counter sends when generating a bill; the server assigns id and billNumber. */
export type NewBill = Omit<Bill, 'id' | 'billNumber' | 'date' | 'time' | 'timestamp'>;
