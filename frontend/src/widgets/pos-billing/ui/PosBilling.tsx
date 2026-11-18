import { useState, type FormEvent } from 'react';
import { FileText, Plus, Printer, Search, ShoppingBag, Trash2, Wallet, Banknote, CreditCard, QrCode } from 'lucide-react';
import { useBilling, type BillLineItem, type BillPaymentMethod } from '@/entities/bill';
import { useCatalog, type Product } from '@/entities/product';
import { useAuth } from '@/features/auth';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { useBillActions } from '../model/useBillActions';
import { BillArchive } from './BillArchive';

const CASHIER_NAME = 'Suresh Kumar';
const GST_RATE = 0.05;
const PAYMENT_OPTIONS: { id: BillPaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'Cash', label: 'Cash Memo', icon: Banknote },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
  { id: 'Kirana Khata', label: 'Kirana Khata', icon: Wallet },
  { id: 'Card', label: 'Card Swipe', icon: CreditCard },
];

type CustomerMode = 'walkin' | 'account' | 'custom';

const INPUT_CLASS = 'w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-emerald-600 focus:outline-none';
const LABEL_CLASS = 'mb-1 block font-semibold text-stone-600';

/** Counter point-of-sale: build a bill from catalog items and loose items, then take it. */
export function PosBilling() {
  const [view, setView] = useState<'create' | 'archive'>('create');
  const { bills } = useBilling();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <FileText className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-stone-900 sm:text-2xl">Sri Nidhi Store · POS &amp; Billing Desk</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">Create instant cash memos, loose Mandi bills, and take bills (print or share via WhatsApp)</p>
        </div>

        <div role="tablist" aria-label="Billing views" className="flex w-full items-center gap-1 rounded-xl bg-stone-200/80 p-1 text-xs font-bold sm:w-auto">
          <button
            role="tab"
            aria-selected={view === 'create'}
            type="button"
            onClick={() => setView('create')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2 transition sm:flex-none ${
              view === 'create' ? 'bg-white font-black text-emerald-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Bill</span>
          </button>
          <button
            role="tab"
            aria-selected={view === 'archive'}
            type="button"
            onClick={() => setView('archive')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2 transition sm:flex-none ${
              view === 'archive' ? 'bg-white font-black text-emerald-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Printer className="h-3.5 w-3.5 text-emerald-700" />
            <span>Take Bill Archive</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[10px] text-emerald-900 tabular-nums">{bills.length}</span>
          </button>
        </div>
      </div>

      {view === 'create' ? <CreateBillPanel /> : <BillArchive />}
    </div>
  );
}

function CreateBillPanel() {
  const { products } = useCatalog();
  const { user } = useAuth();
  const { createBill } = useBillActions();

  const [items, setItems] = useState<BillLineItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [customerMode, setCustomerMode] = useState<CustomerMode>('walkin');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<BillPaymentMethod>('Cash');
  const [discount, setDiscount] = useState(0);
  const [includeGst, setIncludeGst] = useState(false);
  const [note, setNote] = useState('');
  const [customName2, setCustomName2] = useState('');
  const [customRate, setCustomRate] = useState('60');
  const [customQty, setCustomQty] = useState('1');
  const [customUnit, setCustomUnit] = useState('1 kg');

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const tax = includeGst ? Math.round(subtotal * GST_RATE) : 0;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  const addProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) {
        return prev.map((i) => (i.name === product.name ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i));
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: product.name,
          unit: product.unit,
          price: product.discountPrice,
          qty: 1,
          total: product.discountPrice,
        },
      ];
    });
  };

  const addLooseItem = (event: FormEvent) => {
    event.preventDefault();
    if (!customName2.trim()) return;
    const price = parseFloat(customRate) || 0;
    const qty = parseInt(customQty, 10) || 1;
    setItems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: customName2.trim(), unit: customUnit.trim(), price, qty, total: price * qty },
    ]);
    setCustomName2('');
  };

  const changeQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const qty = item.qty + delta;
          return qty > 0 ? { ...item, qty, total: qty * item.price } : null;
        })
        .filter((item): item is BillLineItem => item !== null)
    );
  };

  const clearRegister = () => {
    if (window.confirm('Clear all items from the current bill?')) setItems([]);
  };

  const generateBill = () => {
    if (items.length === 0) {
      window.alert('Please add at least one item to generate a bill.');
      return;
    }

    let customerName = 'Walk-in Cash Customer';
    let customerPhone = 'Counter 1';
    let customerType: 'walk-in' | 'regular' | 'khata' = 'walk-in';

    if (customerMode === 'account') {
      customerName = user.name;
      customerPhone = user.phone;
      customerType = paymentMethod === 'Kirana Khata' ? 'khata' : 'regular';
    } else if (customerMode === 'custom') {
      customerName = customName.trim() || 'Walk-in Customer';
      customerPhone = customPhone.trim() || 'Counter Sale';
      customerType = 'regular';
    }

    if (paymentMethod === 'Kirana Khata') {
      if (customerMode !== 'account') {
        window.alert('Kirana Khata is only enabled for verified registered customers.');
        return;
      }
      if (user.khataBalance < grandTotal) {
        window.alert(`Insufficient Khata balance (₹${user.khataBalance}). Please choose Cash or UPI.`);
        return;
      }
    }

    createBill({
      customerName,
      customerPhone,
      customerType,
      items,
      subtotal,
      discount,
      tax,
      total: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Kirana Khata' ? 'Added to Khata' : 'Paid',
      cashierName: CASHIER_NAME,
      notes: note.trim() || 'Retail Counter Bill',
    })
      .then(() => {
        setItems([]);
        setDiscount(0);
        setNote('');
      })
      .catch(() => {
        /* the failure toast is raised inside createBill */
      });
  };

  const needle = itemSearch.trim().toLowerCase();
  const matches = products
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle))
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 sm:text-sm">1. Quick Add Store Products</h3>
            <span className="text-[11px] text-stone-400">Tap to add</span>
          </div>
          <div className="relative">
            <label htmlFor="pos-search" className="sr-only">Search catalog</label>
            <input
              id="pos-search"
              type="text"
              placeholder="Quick search Atta, Oil, Salt, Rice..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-xs focus:border-emerald-600 focus:outline-none"
            />
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
          </div>
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {matches.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => addProduct(prod)}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-stone-900 group-hover:text-emerald-900">{prod.name}</p>
                  <span className="block text-[10px] text-stone-500">{prod.unit} · ₹{prod.discountPrice}</span>
                </div>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">+</span>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={addLooseItem} className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900 sm:text-sm">2. Add Custom / Loose Mandi Item</h3>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">Loose Ration</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label htmlFor="loose-name" className={LABEL_CLASS}>Item Name *</label>
              <input id="loose-name" type="text" required placeholder="e.g. Sugar Loose, Fresh Eggs, Onion 2kg" value={customName2} onChange={(e) => setCustomName2(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="loose-unit" className={LABEL_CLASS}>Unit</label>
                <input id="loose-unit" type="text" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="loose-rate" className={LABEL_CLASS}>Rate (₹) *</label>
                <input id="loose-rate" type="number" required min="1" value={customRate} onChange={(e) => setCustomRate(e.target.value)} className={`${INPUT_CLASS} font-bold`} />
              </div>
              <div>
                <label htmlFor="loose-qty" className={LABEL_CLASS}>Quantity</label>
                <input id="loose-qty" type="number" required min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
            <button type="submit" className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800">
              <Plus className="h-4 w-4" />
              <span>Add Line Item to Current Bill</span>
            </button>
          </div>
        </form>
      </div>

      <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold tracking-wider text-stone-700 uppercase">Select Customer For Bill</legend>
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <CustomerOption active={customerMode === 'walkin'} onClick={() => setCustomerMode('walkin')} title="Walk-in Customer" caption="Cash / Spot Counter" />
            <CustomerOption
              active={customerMode === 'account'}
              onClick={() => setCustomerMode('account')}
              title={user.name || 'Registered customer'}
              caption={`Credit: ₹${user.khataBalance}`}
              badge="KHATA"
            />
            <CustomerOption active={customerMode === 'custom'} onClick={() => setCustomerMode('custom')} title="Enter Details" caption="Name &amp; Mobile" />
          </div>
          {customerMode === 'custom' && (
            <div className="grid grid-cols-1 gap-2 pt-2 text-xs sm:grid-cols-2">
              <label className="sr-only" htmlFor="bill-customer-name">Customer name</label>
              <input id="bill-customer-name" type="text" placeholder="Customer Name" value={customName} onChange={(e) => setCustomName(e.target.value)} className="rounded-xl border border-stone-200 p-2" />
              <label className="sr-only" htmlFor="bill-customer-phone">Customer mobile</label>
              <input id="bill-customer-phone" type="tel" placeholder="Mobile Number (e.g. +91 98765 00000)" value={customPhone} onChange={(e) => setCustomPhone(e.target.value)} className="rounded-xl border border-stone-200 p-2" />
            </div>
          )}
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-900 sm:text-sm">Bill Line Items ({items.length} items)</h4>
            {items.length > 0 && (
              <button type="button" onClick={clearRegister} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Register</span>
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="space-y-1 rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-10 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-stone-300" />
              <p className="text-xs font-bold text-stone-700">Bill register is empty</p>
              <p className="text-[11px] text-stone-400">Click products from the left or add custom items to build the bill.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 text-xs">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-stone-900">{item.name}</p>
                    <span className="text-[11px] text-stone-400">{item.unit} · ₹{item.price} each</span>
                  </div>
                  <div className="w-24 shrink-0">
                    <QuantityStepper quantity={item.qty} itemName={item.name} onDecrement={() => changeQty(item.id, -1)} onIncrement={() => changeQty(item.id, 1)} />
                  </div>
                  <span className="w-16 shrink-0 text-right font-black text-stone-900 tabular-nums">₹{item.total}</span>
                  <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} className="shrink-0 cursor-pointer p-1 text-stone-300 hover:text-red-600" aria-label={`Remove ${item.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <dl className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
          <div className="flex items-center justify-between text-stone-600">
            <dt>Items Subtotal:</dt>
            <dd className="font-bold text-stone-900 tabular-nums">₹{subtotal}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="bill-discount" className="text-stone-600">Discount / Round-off (₹):</label>
            <input id="bill-discount" type="number" min="0" max={subtotal} value={discount || ''} placeholder="0" onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))} className="w-24 rounded-lg border border-stone-300 bg-white p-1.5 text-right font-bold" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-1.5 text-stone-600">
              <input type="checkbox" checked={includeGst} onChange={(e) => setIncludeGst(e.target.checked)} className="accent-emerald-700" />
              <span>Add 5% GST (Tax Invoice)</span>
            </label>
            {includeGst && <span className="font-bold text-stone-900 tabular-nums">+₹{tax}</span>}
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-base font-black text-stone-950">
            <span>Total Amount:</span>
            <span className="text-lg text-emerald-800 tabular-nums">₹{grandTotal}</span>
          </div>
        </dl>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold tracking-wider text-stone-700 uppercase">Select Payment Mode</legend>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
              const selected = paymentMethod === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition ${
                    selected ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-950 shadow-sm' : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input type="radio" name="payment-mode" value={id} checked={selected} onChange={() => setPaymentMethod(id)} className="sr-only" />
                  <Icon className="h-4 w-4 text-emerald-700" />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="bill-note" className={LABEL_CLASS}>Cashier note (optional)</label>
          <input id="bill-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} className={INPUT_CLASS} placeholder="Retail Counter Bill" />
        </div>

        <button
          type="button"
          onClick={generateBill}
          disabled={items.length === 0}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:text-sm"
        >
          <Printer className="h-4 w-4" />
          <span>Generate &amp; Take Bill (₹{grandTotal})</span>
        </button>
      </section>
    </div>
  );
}

function CustomerOption({ active, onClick, title, caption, badge }: { active: boolean; onClick: () => void; title: string; caption: string; badge?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
        active ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-950' : 'border-stone-200 text-stone-700 hover:bg-stone-50'
      }`}
    >
      <span className="flex items-center justify-between gap-2 font-bold">
        <span className="truncate">{title}</span>
        {badge && <span className="rounded bg-emerald-200 px-1 text-[9px] text-emerald-900">{badge}</span>}
      </span>
      <span className="block text-[10px] text-stone-500">{caption}</span>
    </button>
  );
}
