import { useState, type FormEvent } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { type BillLineItem, type BillPaymentMethod } from '@/entities/bill';
import { useToast } from '@/shared/ui/toast';
import { useBillActions } from '../model/useBillActions';

const CASHIER_NAME = 'Suresh Kumar';
const PAYMENT_METHODS: readonly BillPaymentMethod[] = ['Cash', 'UPI', 'Card'];

interface QuickLine {
  id: number;
  description: string;
  amount: string;
}

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

/** Today's date in store time, as shown on the bill. */
function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Fast bill: type a description and an amount per line, the total is worked out, then make the bill. */
export function QuickBillPanel() {
  const { createBill } = useBillActions();
  const { addToast } = useToast();
  const [nextId, setNextId] = useState(2);
  const [lines, setLines] = useState<QuickLine[]>([{ id: 1, description: '', amount: '' }]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<BillPaymentMethod>('Cash');
  const [isMaking, setIsMaking] = useState(false);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0);
  const filledLines = lines.filter((l) => l.description.trim() && Number(l.amount) > 0);

  const updateLine = (id: number, patch: Partial<QuickLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLine = (id: number) => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const addLine = () => {
    setLines((prev) => [...prev, { id: nextId, description: '', amount: '' }]);
    setNextId((n) => n + 1);
  };

  const makeBill = async (event: FormEvent) => {
    event.preventDefault();
    if (filledLines.length === 0) {
      addToast('Add at least one description and amount', 'error');
      return;
    }
    const incomplete = lines.some((l) => {
      const hasDescription = Boolean(l.description.trim());
      const hasAmount = Number(l.amount) > 0;
      return hasDescription !== hasAmount;
    });
    if (incomplete) {
      addToast('Each line needs both a description and an amount', 'error');
      return;
    }

    const items: BillLineItem[] = filledLines.map((line) => ({
      id: `quick-${line.id}`,
      name: line.description.trim(),
      unit: '',
      price: Number(line.amount),
      qty: 1,
      total: Number(line.amount),
    }));

    setIsMaking(true);
    try {
      await createBill({
        customerName: customerName.trim() || 'Walk-in Cash Customer',
        customerPhone: 'Counter 1',
        customerType: 'walk-in',
        items,
        subtotal: total,
        discount: 0,
        tax: 0,
        total,
        paymentMethod,
        paymentStatus: 'Paid',
        cashierName: CASHIER_NAME,
        notes: 'Quick bill',
      });
      setLines([{ id: nextId, description: '', amount: '' }]);
      setNextId((n) => n + 1);
      setCustomerName('');
    } catch {
      /* the failure toast is raised inside createBill */
    } finally {
      setIsMaking(false);
    }
  };

  return (
    <form onSubmit={makeBill} className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-stone-900">Quick bill</h2>
          <p className="text-xs text-stone-500">Type what was bought and the amount. The total and today&apos;s date are added for you.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{todayLabel()}</span>
      </div>

      <div>
        <label htmlFor="quick-customer" className="mb-1 block text-xs font-semibold text-stone-600">Customer name (optional)</label>
        <input
          id="quick-customer"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Walk-in Cash Customer"
          className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_7rem_2.5rem] gap-2 px-1 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
          <span>Description</span>
          <span className="text-right">Amount (₹)</span>
          <span />
        </div>
        {lines.map((line) => (
          <div key={line.id} className="grid grid-cols-[1fr_7rem_2.5rem] items-center gap-2">
            <label className="sr-only" htmlFor={`quick-desc-${line.id}`}>Description</label>
            <input
              id={`quick-desc-${line.id}`}
              type="text"
              placeholder="e.g. Tea powder 250g"
              value={line.description}
              onChange={(e) => updateLine(line.id, { description: e.target.value })}
              className="min-w-0 rounded-xl border border-stone-300 bg-white p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
            />
            <label className="sr-only" htmlFor={`quick-amount-${line.id}`}>Amount in rupees</label>
            <input
              id={`quick-amount-${line.id}`}
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              placeholder="0"
              value={line.amount}
              onChange={(e) => updateLine(line.id, { amount: e.target.value })}
              className="min-w-0 rounded-xl border border-stone-300 bg-white p-2.5 text-right text-sm font-bold tabular-nums focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeLine(line.id)}
              disabled={lines.length === 1}
              aria-label="Remove line"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addLine} className="flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">
          <Plus className="h-4 w-4" />
          <span>Add another line</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase">Total</span>
          <span className="text-2xl font-black text-emerald-800 tabular-nums">{formatINR(total)}</span>
        </div>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-stone-600">Paid by</legend>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  paymentMethod === method ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <input type="radio" name="quick-payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="sr-only" />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={isMaking || filledLines.length === 0}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        <Printer className="h-4 w-4" />
        <span>{isMaking ? 'Making bill…' : `Make bill (${formatINR(total)})`}</span>
      </button>
    </form>
  );
}
