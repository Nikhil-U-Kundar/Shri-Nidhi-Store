import { Download, Printer, Share2, X } from 'lucide-react';
import { useBilling, type Bill } from '@/entities/bill';
import { STORE } from '@/shared/config/store';
import { Modal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/ui/toast';

const CASHIER_FALLBACK = 'Suresh Kumar';

function buildWhatsAppMessage(bill: Bill): string {
  const itemsList = bill.items.map((i) => `${i.name} (${i.unit}) x${i.qty} = ₹${i.total}`).join('\n');
  return [
    `*${STORE.legalName}*`,
    'Shop 12, Main Market, Sector 14',
    `Ph: ${STORE.phoneDisplay}`,
    '-------------------------------',
    `*BILL NO:* ${bill.billNumber}`,
    `*DATE:* ${bill.date} ${bill.time}`,
    `*CUSTOMER:* ${bill.customerName} (${bill.customerPhone})`,
    '-------------------------------',
    '*ITEMS:*',
    itemsList,
    '-------------------------------',
    `*Subtotal:* ₹${bill.subtotal}`,
    `*Discount:* -₹${bill.discount}`,
    `*GRAND TOTAL:* ₹${bill.total}`,
    `*Payment:* ${bill.paymentMethod} (${bill.paymentStatus})`,
    '-------------------------------',
    'Thank you for shopping at Sri Nidhi Store!',
  ].join('\n');
}

function buildTextReceipt(bill: Bill): string {
  const itemsList = bill.items
    .map((i) => `${i.name.padEnd(28)} ${i.qty.toString().padStart(2)} x ₹${i.price.toString().padStart(4)} = ₹${i.total.toString().padStart(5)}`)
    .join('\n');
  return `================================================
          SRI NIDHI STORE & GENERAL STORE
       Shop 12, Main Market, Belapu, industrial Area
      GSTIN: ${STORE.gstin}  |  FSSAI: ${STORE.fssai}
               Phone: ${STORE.phoneDisplay}
================================================
BILL NUMBER : ${bill.billNumber}
DATE & TIME : ${bill.date} ${bill.time}
CASHIER     : ${bill.cashierName || CASHIER_FALLBACK}
CUSTOMER    : ${bill.customerName}
MOBILE      : ${bill.customerPhone}
PAYMENT     : ${bill.paymentMethod} [${bill.paymentStatus}]
================================================
ITEM DESCRIPTION               QTY   RATE      TOTAL
------------------------------------------------
${itemsList}
------------------------------------------------
Subtotal:                                  ₹${bill.subtotal}
Discount:                                 -₹${bill.discount}
------------------------------------------------
GRAND TOTAL:                               ₹${bill.total}
================================================
      Thank you for shopping at Sri Nidhi Store!
  Visit again for fresh grains & Mandi discounts!
================================================`;
}

/** Cash-memo preview with print, WhatsApp and text-download actions. */
export function TakeBillModal() {
  const { activeBill: bill, setActiveBill } = useBilling();
  const { addToast } = useToast();

  if (!bill) return null;

  const close = () => setActiveBill(null);

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/${bill.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildWhatsAppMessage(bill))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    addToast('Opening WhatsApp to send bill to customer', 'info');
  };

  const downloadText = () => {
    const blob = new Blob([buildTextReceipt(bill)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_${bill.billNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Bill ${bill.billNumber} downloaded as text file`, 'success');
  };

  return (
    <Modal label="Take bill" onClose={close} size="sm:max-w-md">
      <div className="flex items-center justify-between bg-stone-900 p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider sm:text-sm">Take Bill · Retail Cash Memo</h3>
        </div>
        <button type="button" onClick={close} className="cursor-pointer rounded-lg p-1 text-stone-400 hover:text-white" aria-label="Close bill preview">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-white p-6 font-mono text-xs text-stone-900">
        <div id="printable-receipt" className="space-y-4">
          <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-center">
            <h2 className="text-base font-black uppercase tracking-wider text-stone-900 sm:text-lg">{STORE.legalName}</h2>
            <p className="text-[11px] text-stone-600">Shop 12, Main Market, Belapu, industrial Area, Haryana - 122001</p>
            <p className="text-[10px] text-stone-500">GSTIN: {STORE.gstin} · FSSAI Lic: {STORE.fssai}</p>
            <p className="text-[10px] text-stone-500">Phone: {STORE.phoneDisplay}</p>
            <div className="mt-1 inline-block rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
              RETAIL INVOICE / CASH MEMO
            </div>
          </div>

          <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-[11px]">
            <MetaRow label="Bill Number:" value={bill.billNumber} bold />
            <MetaRow label="Date & Time:" value={`${bill.date} ${bill.time}`} />
            <MetaRow label="Customer:" value={bill.customerName} bold />
            <MetaRow label="Mobile:" value={bill.customerPhone} />
            <MetaRow label="Payment Mode:" value={`${bill.paymentMethod} (${bill.paymentStatus})`} emphasis />
            {bill.notes && <MetaRow label="Note:" value={bill.notes} muted />}
          </div>

          <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between border-b border-stone-200 pb-1 text-[11px] font-bold text-stone-700">
              <span>Item [Unit]</span>
              <span>Qty x Rate = Total</span>
            </div>
            {bill.items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-2 text-[11px]">
                <div className="min-w-0 truncate">
                  <span className="font-bold text-stone-900">{item.name}</span>
                  <span className="ml-1 text-[10px] text-stone-500">({item.unit})</span>
                </div>
                <span className="shrink-0 font-semibold text-stone-800 tabular-nums">
                  {item.qty} × ₹{item.price} = ₹{item.total}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold tabular-nums">₹{bill.subtotal}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Discount / Round Off:</span>
                <span className="tabular-nums">-₹{bill.discount}</span>
              </div>
            )}
            {bill.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span className="font-semibold tabular-nums">+₹{bill.tax}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-stone-800 pt-2 text-base font-black text-stone-950">
              <span>NET TOTAL PAID:</span>
              <span className="text-emerald-800 tabular-nums">₹{bill.total}</span>
            </div>
          </div>

          <div className="space-y-1 border-t border-dashed border-stone-300 pt-3 text-center text-[10px] text-stone-500">
            <p className="font-bold text-stone-700">Thank you for visiting Sri Nidhi Store!</p>
            <p>For Khata balance or returns, please bring this bill slip.</p>
            <p className="text-[9px] text-stone-400">Software powered by Sri Nidhi POS</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-stone-200 bg-stone-50 p-4">
        <div className="grid grid-cols-3 gap-2">
          <ActionButton onClick={() => window.print()} title="Print thermal cash slip / bill" variant="primary" icon={<Printer className="h-4 w-4" />} label="Print" />
          <ActionButton onClick={shareOnWhatsApp} title="Send bill to customer on WhatsApp" variant="soft" icon={<Share2 className="h-4 w-4" />} label="WhatsApp" />
          <ActionButton onClick={downloadText} title="Download text receipt copy" variant="muted" icon={<Download className="h-4 w-4" />} label="Download" />
        </div>
        <button type="button" onClick={close} className="w-full cursor-pointer rounded-lg bg-stone-100 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200">
          Close Cash Memo
        </button>
      </div>
    </Modal>
  );
}

const ACTION_VARIANTS = {
  primary: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  soft: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300',
  muted: 'bg-stone-200 hover:bg-stone-300 text-stone-800',
} as const;

function ActionButton({
  onClick,
  title,
  variant,
  icon,
  label,
}: {
  onClick: () => void;
  title: string;
  variant: keyof typeof ACTION_VARIANTS;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition sm:flex-row sm:text-xs ${ACTION_VARIANTS[variant]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MetaRow({
  label,
  value,
  bold = false,
  emphasis = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  emphasis?: boolean;
  muted?: boolean;
}) {
  const valueClass = [bold && 'font-bold text-stone-900', emphasis && 'font-bold text-emerald-800', muted && 'text-[10px] text-stone-500']
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex justify-between gap-2">
      <span className={muted ? 'text-[10px] text-stone-500' : ''}>{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
