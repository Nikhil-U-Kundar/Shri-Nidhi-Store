import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useCart } from '@/entities/cart';
import { useCatalog } from '@/entities/product';
import { orderApi, useOrders, type Order } from '@/entities/order';
import { useAuth } from '@/entities/user';
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

/**
 * Place the basket as an order on the server. Orders are only confirmed once the server has saved
 * them, so an order the store never receives can't look confirmed to the customer.
 */
export function usePlaceOrder() {
  const { items, totals, clearCart } = useCart();
  const { refreshCatalog } = useCatalog();
  const { setOrders, setActiveTrackingOrderId } = useOrders();
  const { isLoggedIn, user, refreshProfile, setLoginOpen } = useAuth();
  const { addToast } = useToast();

  return useCallback(
    async (request: OrderRequest): Promise<Order> => {
      if (!isLoggedIn) {
        addToast('Please sign in to place an order', 'info');
        setLoginOpen(true);
        throw new Error('Sign in required');
      }

      const isKhata = KHATA_METHODS.includes(request.paymentMethod);
      if (isKhata && user.khataBalance < totals.finalTotal) {
        addToast(`Insufficient Khata balance (₹${user.khataBalance}). Please choose UPI or COD.`, 'error');
        throw new Error('Insufficient Khata balance');
      }

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
        addToast(errorMessage(err, 'Could not place the order. Please try again.'), 'error');
        throw err;
      }
    },
    [
      isLoggedIn,
      setLoginOpen,
      user,
      totals,
      items,
      clearCart,
      setOrders,
      setActiveTrackingOrderId,
      refreshCatalog,
      refreshProfile,
      addToast,
    ]
  );
}
