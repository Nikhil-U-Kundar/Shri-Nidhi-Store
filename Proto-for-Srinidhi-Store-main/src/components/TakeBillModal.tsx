import React from 'react';
import { X, Printer, Share2, Download, CheckCircle2, ShoppingBasket } from 'lucide-react';
import { Bill } from '../types';
import { useApp } from '../context/AppContext';

export const TakeBillModal: React.FC = () => {
  const { activeBillToTake: bill, setActiveBillToTake, addToast } = useApp();

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const itemsList = bill.items.map((i) => `${i.name} (${i.unit}) x${i.qty} = ₹${i.total}`).join('\n');
    const msg = `*SRI NIDHI STORE & GENERAL STORE*\nShop 12, Main Market, Sector 14\nPh: +91 98765 43210\n-------------------------------\n*BILL NO:* ${bill.billNumber}\n*DATE:* ${bill.date} ${bill.time}\n*CUSTOMER:* ${bill.customerName} (${bill.customerPhone})\n-------------------------------\n*ITEMS:*\n${itemsList}\n-------------------------------\n*Subtotal:* ₹${bill.subtotal}\n*Discount:* -₹${bill.discount}\n*GRAND TOTAL:* ₹${bill.total}\n*Payment:* ${bill.paymentMethod} (${bill.paymentStatus})\n-------------------------------\nThank you for shopping at Sri Nidhi Store!`;

    const url = `https://wa.me/${bill.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    addToast('Opening WhatsApp to send bill to customer', 'info');
  };

  const handleDownloadTxt = () => {
    const itemsList = bill.items.map((i) => `${i.name.padEnd(28)} ${i.qty.toString().padStart(2)} x ₹${i.price.toString().padStart(4)} = ₹${i.total.toString().padStart(5)}`).join('\n');
    const content = `================================================
          SRI NIDHI STORE & GENERAL STORE
       Shop 12, Main Market, Belapu, industrial Area
      GSTIN: 06AABCU9603R1ZM  |  FSSAI: 10012031000085
               Phone: +91 98765 43210
================================================
BILL NUMBER : ${bill.billNumber}
DATE & TIME : ${bill.date} ${bill.time}
CASHIER     : ${bill.cashierName || 'Suresh Kumar'}
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

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_${bill.billNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Bill ${bill.billNumber} downloaded as text file`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] relative">
        {/* Modal Top Actions */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider">
              Take Bill · Retail Cash Memo
            </h3>
          </div>
          <button
            onClick={() => setActiveBillToTake(null)}
            className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
            aria-label="Close bill preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Bill Area */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-stone-900 bg-white space-y-4">
          <div id="printable-receipt" className="space-y-4">
            {/* Store Header */}
            <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
              <h2 className="font-black text-base sm:text-lg uppercase tracking-wider text-stone-900">
                SRI NIDHI STORE &amp; GENERAL STORE
              </h2>
              <p className="text-[11px] text-stone-600">
                Shop 12, Main Market, Belapu, industrial Area, Haryana - 122001
              </p>
              <p className="text-[10px] text-stone-500">
                GSTIN: 06AABCU9603R1ZM · FSSAI Lic: 10012031000085
              </p>
              <p className="text-[10px] text-stone-500">Phone: +91 98765 43210</p>
              <div className="inline-block bg-stone-100 px-2 py-0.5 rounded text-[10px] font-bold text-stone-700 mt-1">
                RETAIL INVOICE / CASH MEMO
              </div>
            </div>

            {/* Bill Meta */}
            <div className="text-[11px] space-y-1 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>Bill Number:</span>
                <span className="font-bold text-stone-900">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date &amp; Time:</span>
                <span>{bill.date} {bill.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold text-stone-900">{bill.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile:</span>
                <span>{bill.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-emerald-800">
                  {bill.paymentMethod} ({bill.paymentStatus})
                </span>
              </div>
              {bill.notes && (
                <div className="flex justify-between text-[10px] text-stone-500">
                  <span>Note:</span>
                  <span>{bill.notes}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between font-bold text-[11px] text-stone-700 border-b border-stone-200 pb-1">
                <span>Item [Unit]</span>
                <span>Qty x Rate = Total</span>
              </div>

              {bill.items.map((it) => (
                <div key={it.id} className="flex justify-between text-[11px] items-baseline">
                  <div className="truncate max-w-[200px]">
                    <span className="font-bold text-stone-900">{it.name}</span>
                    <span className="text-[10px] text-stone-500 ml-1">({it.unit})</span>
                  </div>
                  <span className="tabular-nums font-semibold shrink-0 text-stone-800">
                    {it.qty} × ₹{it.price} = ₹{it.total}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Totals */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="tabular-nums font-semibold">₹{bill.subtotal}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount / Round Off:</span>
                  <span className="tabular-nums">-₹{bill.discount}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span className="tabular-nums font-semibold">+₹{bill.tax}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-2 border-t-2 border-stone-800 text-stone-950">
                <span>NET TOTAL PAID:</span>
                <span className="tabular-nums text-emerald-800">₹{bill.total}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-stone-500 pt-3 border-t border-dashed border-stone-300 space-y-1">
              <p className="font-bold text-stone-700">Thank you for visiting Sri Nidhi Store!</p>
              <p>For Khata balance or returns, please bring this bill slip.</p>
              <p className="text-[9px] text-stone-400">Software powered by Sri Nidhi POS</p>
            </div>
          </div>
        </div>

        {/* Bottom "Take Bill" Quick Action Toolbar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
              title="Print Thermal Cash Slip / Bill"
            >
              <Printer className="w-4 h-4" />
              <span>Take Bill (Print)</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Send bill directly to customer on WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Download text receipt copy"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          <button
            onClick={() => setActiveBillToTake(null)}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold py-1.5 rounded-lg text-xs transition cursor-pointer"
          >
            Close Cash Memo
          </button>
        </div>
      </div>
    </div>
  );
};
