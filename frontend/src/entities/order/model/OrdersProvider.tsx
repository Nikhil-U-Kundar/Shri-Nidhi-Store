import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Order } from './types';
import { initialOrders } from './mock-data';
import { orderApi } from '../api/orderApi';

const DEFAULT_TRACKING_ORDER = 'ORD-9412';

interface OrdersValue {
  orders: Order[];
  setOrders: (update: Order[] | ((prev: Order[]) => Order[])) => void;
  activeTrackingOrderId: string;
  setActiveTrackingOrderId: (id: string) => void;
  /** Order currently shown in the print-receipt dialog. */
  receiptOrder: Order | null;
  setReceiptOrder: (order: Order | null) => void;
  refreshOrders: () => Promise<void>;
}

interface OrdersProviderProps {
  children: ReactNode;
  /** Whether a customer or admin is signed in; guests see the sample orders. */
  hasSession: boolean;
}

const OrdersContext = createContext<OrdersValue | null>(null);

export function OrdersProvider({ children, hasSession }: OrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(DEFAULT_TRACKING_ORDER);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const refreshOrders = useCallback(async () => {
    try {
      const list = await orderApi.list();
      setOrders(list);
      if (list[0]) setActiveTrackingOrderId(list[0].id);
    } catch {
      /* keep what is already on screen */
    }
  }, []);

  useEffect(() => {
    if (hasSession) {
      void refreshOrders();
    } else {
      setOrders(initialOrders);
    }
  }, [hasSession, refreshOrders]);

  const value = useMemo<OrdersValue>(
    () => ({
      orders,
      setOrders,
      activeTrackingOrderId,
      setActiveTrackingOrderId,
      receiptOrder,
      setReceiptOrder,
      refreshOrders,
    }),
    [orders, activeTrackingOrderId, receiptOrder, refreshOrders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
