import type { Order } from './types';

export const initialOrders: Order[] = [
  {
    id: 'ORD-9412',
    date: 'Today, 10:45 AM',
    timestamp: Date.now() - 3600000 * 1.5,
    items: [
      { name: 'Aashirvaad Shudh Chakki Atta', qty: 1, price: 245, unit: '5 kg' },
      { name: 'Tata Salt Vacuum Evaporated', qty: 2, price: 24, unit: '1 kg' }
    ],
    subtotal: 293,
    deliveryFee: 40,
    total: 333,
    status: 'Out for Delivery',
    paymentMethod: 'Kirana Khata (Store Credit)',
    paymentStatus: 'Settled via Ledger',
    deliveryAddress: 'Flat 402, Shanti Kunj Apartments, Belapu, industrial Area',
    deliveryMode: '⚡ Express Delivery (30-40 Mins)',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    estimatedDelivery: 'Within 15 minutes'
  },
  {
    id: 'ORD-8821',
    date: '18 Oct 2026, 4:20 PM',
    timestamp: Date.now() - 86400000 * 8,
    items: [
      { name: 'Fortune Sunlite Refined Sunflower Oil', qty: 2, price: 138, unit: '1 Litre Pouch' },
      { name: 'India Gate Basmati Rice Feast Rozzana', qty: 1, price: 389, unit: '5 kg' }
    ],
    subtotal: 665,
    deliveryFee: 0,
    total: 665,
    status: 'Delivered',
    paymentMethod: 'UPI (Google Pay)',
    paymentStatus: 'Paid Online',
    deliveryAddress: 'Flat 402, Shanti Kunj Apartments, Belapu, industrial Area',
    deliveryMode: 'Standard Evening Slot',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210'
  }
];
