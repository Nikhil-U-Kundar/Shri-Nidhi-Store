import React from 'react';
import {
  ChevronLeft,
  Clock,
  MapPin,
  Phone,
  Printer,
  Share2,
  CheckCircle2,
  PackageCheck,
  Bike,
  ShieldCheck,
  Building
} from 'lucide-react';
import { OrderStatus } from '../types';
import { useApp } from '../context/AppContext';

export const OrderTrackingView: React.FC = () => {
  const {
    orders,
    activeTrackingOrderId,
    setCustomerTab,
    setPrintReceiptOrder,
    addToast
  } = useApp();

  const order = orders.find((o) => o.id === activeTrackingOrderId) || orders[0];

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-stone-500">
        <p className="font-bold text-sm">No recent orders found to track.</p>
        <button
          onClick={() => setCustomerTab('home')}
          className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Browse Mandi Catalog
        </button>
      </div>
    );
  }

  const stages: OrderStatus[] = [
    'Order Placed',
    'Confirmed',
    'Preparing',
    'Out for Delivery',
    'Delivered'
  ];

  const currentIdx = stages.indexOf(order.status) !== -1 ? stages.indexOf(order.status) : 3;

  const handleShareWhatsApp = () => {
    const text = `Sri Nidhi Store Order Update!\nOrder ID: ${order.id}\nStatus: ${order.status}\nTotal Amount: ₹${order.total}\nItems: ${order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}\nDelivery To: ${order.deliveryAddress}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    addToast('Opening WhatsApp to share order summary', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCustomerTab('account')}
          className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintReceiptOrder(order)}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Top Order Summary Card */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-5 gap-3">
          <div>
            <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider block">
              Live Order Tracker
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">
              Order #{order.id}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{order.date} · Paid via {order.paymentMethod}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-400 block font-medium">Expected Arrival</span>
            <span className="font-black text-emerald-700 text-base sm:text-lg">
              {order.status === 'Delivered' ? 'Delivered successfully' : 'Today within 25 Mins'}
            </span>
          </div>
        </div>

        {/* 5-Stage Live Timeline */}
        <div className="py-4">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 w-full z-0" />
            {/* Active Progress Line */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
              style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
            />

            {stages.map((st, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div key={st} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCurrent
                        ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 scale-110 shadow-md'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mt-2 text-center max-w-[65px] sm:max-w-none leading-tight ${
                      isCurrent
                        ? 'text-emerald-950 font-black'
                        : isDone
                        ? 'text-stone-900 font-bold'
                        : 'text-stone-400'
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Partner Box */}
        {order.status !== 'Delivered' && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-stone-900">Ramesh Kumar (Store Delivery Boy)</p>
                <p className="text-xs text-stone-600">Dispatched from Shop 12, Sector 14 Main Market</p>
              </div>
            </div>

            <a
              href="tel:+919876543210"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call Rider</span>
            </a>
          </div>
        )}

        {/* Itemized Order Details */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 text-xs space-y-3 border border-stone-200/80">
          <div className="flex items-center justify-between font-bold text-stone-900 border-b border-stone-200 pb-2">
            <span>Delivering To:</span>
            <span className="text-stone-600 font-normal truncate max-w-xs">{order.deliveryAddress}</span>
          </div>

          <div className="space-y-2 text-stone-700 pt-1">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>
                  {it.name} <strong className="text-stone-900">×{it.qty}</strong>
                </span>
                <span className="font-bold tabular-nums text-stone-900">
                  ₹{it.price * it.qty}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-3 space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="tabular-nums font-semibold">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="tabular-nums font-semibold">
                {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between font-black text-stone-900 text-sm pt-2 border-t border-stone-200">
              <span>Total Paid:</span>
              <span className="text-emerald-800 text-base tabular-nums">₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
