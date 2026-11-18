import type { Bill } from './types';

export const initialBills: Bill[] = [
  {
    id: 'bill-101',
    billNumber: 'SN-2026-0891',
    date: '26 Oct 2026',
    time: '11:15 AM',
    timestamp: Date.now() - 3600000 * 2,
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    customerType: 'khata',
    items: [
      { id: 'bi-1', name: 'Aashirvaad Shudh Chakki Atta', unit: '5 kg', price: 245, qty: 1, total: 245 },
      { id: 'bi-2', name: 'Fortune Refined Sunflower Oil', unit: '1L', price: 138, qty: 2, total: 276 },
      { id: 'bi-3', name: 'Tata Salt Vacuum Evaporated', unit: '1 kg', price: 24, qty: 2, total: 48 },
    ],
    subtotal: 569,
    discount: 19,
    tax: 0,
    total: 550,
    paymentMethod: 'Kirana Khata',
    paymentStatus: 'Added to Khata',
    cashierName: 'Suresh Kumar',
    notes: 'Billed at Counter 1'
  },
  {
    id: 'bill-102',
    billNumber: 'SN-2026-0890',
    date: '26 Oct 2026',
    time: '10:04 AM',
    timestamp: Date.now() - 3600000 * 3.5,
    customerName: 'Sunita Verma',
    customerPhone: '+91 98112 34567',
    customerType: 'walk-in',
    items: [
      { id: 'bi-4', name: 'Amul Butter Pasteurized', unit: '500 g', price: 260, qty: 1, total: 260 },
      { id: 'bi-5', name: 'Maggi 2-Minute Masala Noodles Pack of 12', unit: '840 g', price: 155, qty: 1, total: 155 },
      { id: 'bi-6', name: 'Dettol Bathing Soap (5x125g)', unit: 'Pack', price: 179, qty: 1, total: 179 },
    ],
    subtotal: 594,
    discount: 14,
    tax: 0,
    total: 580,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    cashierName: 'Suresh Kumar',
    notes: 'Paid via PhonePe QR'
  }
];
