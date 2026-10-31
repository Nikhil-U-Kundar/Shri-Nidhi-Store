import React from 'react';
import { X, Printer, ShoppingBasket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderItem } from '../types';

export const PrintReceiptModal: React.FC = () => {
  const { printReceiptOrder: order, setPrintReceiptOrder } = useApp();

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden relative">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider">Kirana Tax Invoice Receipt</span>
          <button
            onClick={() => setPrintReceiptOrder(null)}
            className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-6 font-mono text-xs text-stone-900 space-y-4">
          <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-4">
            <h3 className="font-black text-base uppercase tracking-wider">
              SRI NIDHI STORE &amp; GENERAL STORE
            </h3>
            <p className="text-[11px] text-stone-600">
              Shop 12, Main Market, Belapu, industrial Area, Haryana
            </p>
            <p className="text-[10px] text-stone-500">GSTIN: 06AABCU9603R1ZM · FSSAI: 10012031000085</p>
            <p className="text-[10px] text-stone-500">Ph: +91 98765 43210</p>
          </div>

          <div className="text-[11px] space-y-1 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between">
              <span>Invoice / Order:</span>
              <span className="font-bold">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Date &amp; Time:</span>
              <span>{order.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between font-bold text-[11px]">
              <span>Item Description</span>
              <span>Qty x Rate = Total</span>
            </div>
            {order.items.map((it: OrderItem, idx: number) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span className="truncate max-w-[180px]">{it.name}</span>
                <span className="tabular-nums font-semibold">
                  {it.qty} × ₹{it.price} = ₹{it.price * it.qty}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="tabular-nums">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges:</span>
              <span className="tabular-nums">
                {order.deliveryFee === 0 ? 'FREE (Threshold ₹499+)' : `₹${order.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-stone-800">
              <span>GRAND TOTAL:</span>
              <span className="tabular-nums">₹{order.total}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-stone-500 pt-4 border-t border-dashed border-stone-300 space-y-1">
            <p>Thank you for shopping at Sri Nidhi Store!</p>
            <p>For replacement / Khata questions, call +91 98765 43210</p>
          </div>
        </div>

        {/* Print Action Bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print This Receipt</span>
          </button>
          <button
            onClick={() => setPrintReceiptOrder(null)}
            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
