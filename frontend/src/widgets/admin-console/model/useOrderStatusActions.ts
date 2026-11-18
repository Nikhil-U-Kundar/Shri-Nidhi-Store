import { useCallback } from 'react';
import { orderApi, useOrders, type OrderStatus } from '@/entities/order';
import { useAuth } from '@/features/auth';
import { useCatalog } from '@/entities/product';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

/** Shop-owner order status changes: API when reachable, local update otherwise. */
export function useOrderStatusActions() {
  const { setOrders } = useOrders();
  const { isAdmin, isLoggedIn } = useAuth();
  const { usingMockCatalog } = useCatalog();
  const { addToast } = useToast();

  return useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (isLoggedIn && isAdmin && !usingMockCatalog) {
        try {
          const updated = await orderApi.updateStatus(orderId, status);
          setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
          addToast(`Order #${orderId} status updated to: ${status}`, 'info');
        } catch (err) {
          addToast(errorMessage(err, 'Could not update status'), 'error');
        }
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      addToast(`Order #${orderId} status updated to: ${status}`, 'info');
    },
    [isLoggedIn, isAdmin, usingMockCatalog, setOrders, addToast]
  );
}
