import { Printer, X } from 'lucide-react';
import { useOrders, type OrderItem } from '@/entities/order';
import { STORE } from '@/shared/config/store';
import { Modal } from '@/shared/ui/Modal';

/** Printable tax-invoice receipt for an order. Print CSS in index.css isolates #printable-receipt. */
export function ReceiptModal() {
  const { receiptOrder: order, setReceiptOrder } = useOrders();

  if (!order) return null;

  const close = () => setReceiptOrder(null);

  return (
    <Modal label="Order receipt" onClose={close} size="sm:max-w-md">
      <div className="flex items-center justify-between bg-stone-900 p-4 text-white">
        <span className="text-xs font-bold uppercase tracking-wider">Kirana Tax Invoice Receipt</span>
        <button type="button" onClick={close} className="cursor-pointer rounded p-1 text-stone-400 hover:text-white" aria-label="Close receipt">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div id="printable-receipt" className="space-y-4 p-6 font-mono text-xs text-stone-900">
        <div className="space-y-1 border-b border-dashed border-stone-300 pb-4 text-center">
          <h3 className="text-base font-black uppercase tracking-wider">{STORE.legalName}</h3>
          <p className="text-[11px] text-stone-600">{STORE.billAddress}</p>
          <p className="text-[10px] text-stone-500">Ph: {STORE.phoneDisplay}</p>
        </div>

        <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-[11px]">
          <Row label="Invoice / Order:" value={`#${order.id}`} bold />
          <Row label="Date & Time:" value={order.date} />
          <Row label="Customer:" value={order.customerName} bold />
          <Row label="Payment Mode:" value={order.paymentMethod} bold />
        </div>

        <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
          <div className="flex justify-between text-[11px] font-bold">
            <span>Item Description</span>
            <span>Qty x Rate = Total</span>
          </div>
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={`${item.name}-${idx}`} className="flex justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="shrink-0 font-semibold tabular-nums">
                {item.qty} × ₹{item.price} = ₹{item.price * item.qty}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-[11px]">
          <Row label="Items Subtotal:" value={`₹${order.subtotal}`} />
          <Row label="Delivery Charges:" value={order.deliveryFee === 0 ? 'FREE (Threshold ₹499+)' : `₹${order.deliveryFee}`} />
          <div className="flex justify-between border-t border-stone-800 pt-2 text-sm font-black">
            <span>GRAND TOTAL:</span>
            <span className="tabular-nums">₹{order.total}</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-dashed border-stone-300 pt-4 text-center text-[10px] text-stone-500">
          <p>Thank you for shopping at Sri Nidhi Store!</p>
          <p>For replacement / Khata questions, call {STORE.phoneDisplay}</p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-stone-200 bg-stone-50 p-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
        >
          <Printer className="h-4 w-4" />
          <span>Print This Receipt</span>
        </button>
        <button type="button" onClick={close} className="cursor-pointer rounded-xl bg-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-300">
          Close
        </button>
      </div>
    </Modal>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className={`text-right ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}
