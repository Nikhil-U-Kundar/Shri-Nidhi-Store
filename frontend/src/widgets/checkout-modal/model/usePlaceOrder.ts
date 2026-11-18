import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useCart } from '@/entities/cart';
import { useCatalog } from '@/entities/product';
import { orderApi, useOrders, type Order } from '@/entities/order';
import type { KhataTransaction } from '@/entities/user';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/shared/lib/navigation';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

export interface OrderRequest {
  deliveryAddress: string;
  deliveryMode: string;
  /** Pre-booked delivery date (YYYY-MM-DD, store time). */
  deliveryDate: string;
  /** Id of the delivery slot chosen from the schedule. */
  deliveryTimeSlot: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
}

const KHATA_METHODS = ['Kirana Khata (Store Credit)', 'Kirana Khata'];

function celebrate(): void {
  try {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  } catch {
    /* animation is decorative */
  }
}

/** Submit the basket as an order (API when reachable, otherwise a local simulation). */
export function usePlaceOrder() {
  const { items, totals, clearCart } = useCart();
  const { usingMockCatalog, refreshCatalog, setProducts } = useCatalog();
  const { setOrders, setActiveTrackingOrderId } = useOrders();
  const { isLoggedIn, user, patchUser, refreshProfile } = useAuth();
  const { setCustomerTab } = useNavigation();
  const { addToast } = useToast();

  return useCallback(
    async (request: OrderRequest): Promise<Order> => {
      const isKhata = KHATA_METHODS.includes(request.paymentMethod);
      if (isKhata && user.khataBalance < totals.finalTotal) {
        addToast(`Insufficient Khata balance (₹${user.khataBalance}). Please choose UPI or COD.`, 'error');
        throw new Error('Insufficient Khata balance');
      }

      if (isLoggedIn && !usingMockCatalog) {
        try {
          const order = await orderApi.create({
            ...request,
            items: items.map((item) => ({ productId: item.id, qty: item.qty, unit: item.unit })),
          });
          setOrders((prev) => [order, ...prev]);
          clearCart();
          setActiveTrackingOrderId(order.id);
          await refreshCatalog();
          await refreshProfile();
          celebrate();
          addToast(`Order #${order.id} confirmed!`, 'success');
          return order;
        } catch (err) {
          addToast(errorMessage(err, 'Could not place order'), 'error');
          throw err;
        }
      }

      // Offline / sample-data fallback: mirror the order locally.
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentStatus =
        request.paymentMethod === 'Cash on Delivery'
          ? 'Pending Cash at Doorstep'
          : request.paymentMethod.includes('Khata')
            ? 'Settled via Ledger'
            : 'Paid Online via Gateway';

      const order: Order = {
        id: orderId,
        date: 'Just now',
        timestamp: Date.now(),
        items: items.map((item) => ({ name: item.name, qty: item.qty, price: item.discountPrice, unit: item.unit })),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.finalTotal,
        status: 'Order Placed',
        paymentMethod: request.paymentMethod,
        paymentStatus,
        deliveryAddress: request.deliveryAddress,
        deliveryMode: request.deliveryMode,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        estimatedDelivery: `${request.deliveryDate} · scheduled slot`,
      };

      setProducts((prev) =>
        prev.map((p) => {
          const line = items.find((c) => c.id === p.id);
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
        })
      );

      if (isKhata) {
        patchUser((prev) => {
          const balance = prev.khataBalance - totals.finalTotal;
          const entry: KhataTransaction = {
            id: `tx-${Date.now()}`,
            date: 'Today',
            timestamp: Date.now(),
            desc: `Order #${orderId} Grocery Purchase`,
            type: 'debit',
            amount: totals.finalTotal,
            balanceAfter: balance,
            referenceOrder: orderId,
          };
          return { ...prev, khataBalance: balance, khataLedger: [entry, ...prev.khataLedger] };
        });
      }

      setOrders((prev) => [order, ...prev]);
      clearCart();
      setActiveTrackingOrderId(orderId);
      celebrate();
      addToast(`Order #${orderId} confirmed!`, 'success');
      return order;
    },
    [
      items,
      totals,
      clearCart,
      usingMockCatalog,
      refreshCatalog,
      setProducts,
      setOrders,
      setActiveTrackingOrderId,
      isLoggedIn,
      user,
      patchUser,
      refreshProfile,
      addToast,
    ]
  );
}
