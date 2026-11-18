import { ORDER_STATUSES, OrderStatusBadge, useOrders, type OrderStatus } from '@/entities/order';
import { useOrderStatusActions } from '../model/useOrderStatusActions';

export function OrdersTab() {
  const { orders } = useOrders();
  const updateStatus = useOrderStatusActions();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black text-stone-900">Live Order Dispatch Pipeline</h3>
          <p className="text-xs text-stone-500">Changing status updates customer live tracking instantly</p>
        </div>
        <span className="text-xs font-bold text-stone-500">{orders.length} orders total</span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 text-[10px] text-stone-500 uppercase">
            <tr>
              <th scope="col" className="p-3.5">Order ID</th>
              <th scope="col" className="p-3.5">Customer &amp; Items</th>
              <th scope="col" className="p-3.5">Total Amount</th>
              <th scope="col" className="p-3.5">Payment</th>
              <th scope="col" className="p-3.5">Live Status</th>
              <th scope="col" className="p-3.5 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-stone-50/80">
                <td className="p-3.5 font-bold text-stone-900">
                  {order.id}
                  <span className="block text-[10px] font-normal text-stone-400">{order.date}</span>
                </td>
                <td className="max-w-[240px] p-3.5 text-stone-700">
                  <p className="font-bold text-stone-900">{order.customerName}</p>
                  <p className="truncate text-[11px] text-stone-500">{order.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}</p>
                </td>
                <td className="p-3.5 font-black text-stone-900 tabular-nums">₹{order.total}</td>
                <td className="p-3.5">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{order.paymentMethod}</span>
                </td>
                <td className="p-3.5">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-3.5 text-right">
                  <label className="sr-only" htmlFor={`status-${order.id}`}>Status for order {order.id}</label>
                  <select
                    id={`status-${order.id}`}
                    value={order.status}
                    onChange={(e) => void updateStatus(order.id, e.target.value as OrderStatus)}
                    className="cursor-pointer rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
