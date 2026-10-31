export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number; // MRP
  discountPrice: number; // Mandi selling price
  discount: number; // percentage
  stock: number;
  rating: number;
  reviewsCount?: number;
  featured?: boolean;
  isOffer?: boolean;
  image: string;
  description: string;
  mfg: string;
  origin: string;
  expiry: string;
  fssaiNumber?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Address {
  id: string;
  title: string;
  text: string;
  landmark?: string;
  pincode: string;
  isDefault: boolean;
}

export interface KhataTransaction {
  id: string;
  date: string;
  timestamp: number;
  desc: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  referenceOrder?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  addresses: Address[];
  khataBalance: number;
  khataCreditLimit: number;
  khataLedger: KhataTransaction[];
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  unit: string;
}

export interface Order {
  id: string;
  date: string;
  timestamp: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryMode: string;
  customerName: string;
  customerPhone: string;
  estimatedDelivery?: string;
}

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
  paymentMethod: 'Cash' | 'UPI' | 'Kirana Khata' | 'Card';
  paymentStatus: 'Paid' | 'Added to Khata';
  cashierName?: string;
  notes?: string;
}
