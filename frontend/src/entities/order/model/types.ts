export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

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
