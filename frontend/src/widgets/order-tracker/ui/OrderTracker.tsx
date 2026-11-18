import { Bike, ChevronLeft, Phone, Printer, Share2 } from 'lucide-react';
import { ORDER_STATUSES, useOrders } from '@/entities/order';
import { STORE } from '@/shared/config/store';
import { useNavigation } from '@/shared/lib/navigation';
import { useToast } from '@/shared/ui/toast';

/** Live status timeline for the selected order, with receipt and share actions. */
export function OrderTracker() {
  const { orders, activeTrackingOrderId, setReceiptOrder } = useOrders();
  const { setCustomerTab } = useNavigation();
  const { addToast } = useToast();

  const order = orders.find((o) => o.id === activeTrackingOrderId) ?? orders[0];

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center text-stone-500">
        <p className="text-sm font-bold">No recent orders found to track.</p>
        <button
          type="button"
          onClick={() => setCustomerTab('home')}
          className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
        >
          Browse Mandi Catalog
        </button>
      </div>
    );
  }

  const currentIdx = Math.max(0, ORDER_STATUSES.indexOf(order.status));
  const isDelivered = order.status === 'Delivered';
  const progress = (currentIdx / (ORDER_STATUSES.length - 1)) * 100;

  const shareOnWhatsApp = () => {
    const text = [
      'Sri Nidhi Store Order Update!',
      `Order ID: ${order.id}`,
      `Status: ${order.status}`,
      `Total Amount: ₹${order.total}`,
      `Items: ${order.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}`,
      `Delivery To: ${order.deliveryAddress}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    addToast('Opening WhatsApp to share order summary', 'info');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:space-y-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCustomerTab('account')}
          className="flex cursor-pointer items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to My Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReceiptOrder(order)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={shareOnWhatsApp}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-700" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-5">
          <div>
            <span className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase">Live Order Tracker</span>
            <h2 className="mt-0.5 text-xl font-black text-stone-900 sm:text-2xl">Order #{order.id}</h2>
            <p className="mt-0.5 text-xs text-stone-500">{order.date} · Paid via {order.paymentMethod}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-xs font-medium text-stone-400">Expected Arrival</span>
            <span className="text-base font-black text-emerald-700 sm:text-lg">
              {isDelivered ? 'Delivered successfully' : 'Today within 25 Mins'}
            </span>
          </div>
        </div>

        <ol className="relative grid grid-cols-5 gap-1 py-2" aria-label={`Order status: ${order.status}`}>
          <div className="absolute top-4 left-[10%] right-[10%] h-1 rounded bg-stone-200" />
          <div
            className="absolute top-4 left-[10%] h-1 rounded bg-emerald-600 transition-all duration-500"
            style={{ width: `${progress * 0.8}%` }}
          />
          {ORDER_STATUSES.map((stage, i) => {
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <li key={stage} className="relative z-10 flex flex-col items-center text-center" aria-current={isCurrent ? 'step' : undefined}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isCurrent
                      ? 'scale-110 bg-emerald-700 text-white shadow-md ring-4 ring-emerald-100'
                      : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span
                  className={`mt-2 text-[10px] leading-tight sm:text-xs ${
                    isCurrent ? 'font-black text-emerald-950' : isDone ? 'font-bold text-stone-900' : 'font-semibold text-stone-400'
                  }`}
                >
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>

        {!isDelivered && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                <Bike className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 sm:text-sm">Ramesh Kumar (Store Delivery Boy)</p>
                <p className="truncate text-xs text-stone-600">Dispatched from Shop 12, Sector 14 Main Market</p>
              </div>
            </div>
            <a
              href={`tel:${STORE.phoneTel}`}
              aria-label="Call rider"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Call Rider</span>
            </a>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50 p-4 text-xs sm:p-5">
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-200 pb-2 font-bold text-stone-900">
            <span>Delivering To:</span>
            <span className="max-w-full text-right font-normal break-words text-stone-600">{order.deliveryAddress}</span>
          </div>

          <ul className="space-y-2 pt-1 text-stone-700">
            {order.items.map((item, idx) => (
              <li key={`${item.name}-${idx}`} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.name} <strong className="text-stone-900">×{item.qty}</strong>
                </span>
                <span className="shrink-0 font-bold tabular-nums text-stone-900">₹{item.price * item.qty}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1 border-t border-stone-200 pt-3 text-stone-600">
            <div className="flex justify-between">
              <dt>Items Subtotal:</dt>
              <dd className="font-semibold tabular-nums">₹{order.subtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery Fee:</dt>
              <dd className="font-semibold tabular-nums">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-black text-stone-900">
              <dt>Total Paid:</dt>
              <dd className="text-base text-emerald-800 tabular-nums">₹{order.total}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
