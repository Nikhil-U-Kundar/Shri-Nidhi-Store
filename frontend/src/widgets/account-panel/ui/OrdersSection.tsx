import { Bike, Printer } from 'lucide-react';
import { OrderStatusBadge, useOrders } from '@/entities/order';
import { useNavigation } from '@/shared/lib/navigation';

export function OrdersSection() {
  const { orders, setReceiptOrder, setActiveTrackingOrderId } = useOrders();
  const { setCustomerTab } = useNavigation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-stone-900">Order History</h3>
        <p className="text-xs text-stone-500">{orders.length} orders placed with Sri Nidhi Store</p>
      </div>

      {orders.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">
          You have not placed any orders yet.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/40 p-4 text-xs transition hover:border-emerald-500/50 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
              <div className="min-w-0">
                <span className="text-sm font-black text-stone-900">Order #{order.id}</span>
                <span className="ml-2 text-stone-400">{order.date}</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <ul className="space-y-1 text-stone-600">
              {order.items.map((item, idx) => (
                <li key={`${item.name}-${idx}`} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    • {item.name} <strong className="text-stone-900">×{item.qty}</strong>
                  </span>
                  <span className="shrink-0 font-semibold text-stone-800 tabular-nums">₹{item.price * item.qty}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-2">
              <div>
                <span className="text-stone-500">Total:</span>
                <span className="ml-1 text-sm font-black text-stone-900 tabular-nums">₹{order.total}</span>
                <span className="ml-2 text-[11px] text-stone-400">via {order.paymentMethod}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptOrder(order)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-300"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTrackingOrderId(order.id);
                    setCustomerTab('tracking');
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <Bike className="h-3.5 w-3.5" />
                  <span>Live Track</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
