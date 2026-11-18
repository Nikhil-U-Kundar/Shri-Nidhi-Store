import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { BookOpen, Search, Upload } from 'lucide-react';
import { khataApi, type KhataCustomer, type KhataPassbook } from '@/entities/khata';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const INPUT = 'w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs focus:border-emerald-600 focus:outline-none';
const LABEL = 'mb-1 block text-xs font-semibold text-stone-600';

/** Calendar date (YYYY-MM-DD) in store time, used as the default for new entries. */
function storeToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
}

/** Shop-owner khata: pick a customer, add dated entries and payments, see the ledger, manage the payment QR. */
export function KhataTab() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [passbook, setPassbook] = useState<KhataPassbook | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [qrVersion, setQrVersion] = useState(() => Date.now());
  const [qrMissing, setQrMissing] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [entryDate, setEntryDate] = useState(storeToday());
  const [entryItem, setEntryItem] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryAmount, setEntryAmount] = useState('');

  const [payDate, setPayDate] = useState(storeToday());
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [payNote, setPayNote] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      setCustomers(await khataApi.customers(search));
    } catch (err) {
      addToast(errorMessage(err, 'Could not load customers'), 'error');
    } finally {
      setLoadingCustomers(false);
    }
  }, [search, addToast]);

  const loadBook = useCallback(async (customerId: string) => {
    setLoadingBook(true);
    try {
      setPassbook(await khataApi.passbook(customerId));
    } catch (err) {
      setPassbook(null);
      addToast(errorMessage(err, 'Could not load this khata'), 'error');
    } finally {
      setLoadingBook(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadCustomers]);

  useEffect(() => {
    if (selectedId) void loadBook(selectedId);
    else setPassbook(null);
  }, [selectedId, loadBook]);

  const refreshAfterChange = async () => {
    await Promise.all([loadCustomers(), selectedId ? loadBook(selectedId) : Promise.resolve()]);
  };

  const submitEntry = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(entryAmount);
    if (!selectedId || !(amount > 0) || !entryItem.trim()) return;
    try {
      await khataApi.addCredit({ userId: selectedId, date: entryDate, item: entryItem.trim(), amount, note: entryTitle.trim() });
      addToast(`Added ${formatINR(amount)} to khata`, 'success');
      setEntryItem('');
      setEntryTitle('');
      setEntryAmount('');
      await refreshAfterChange();
    } catch (err) {
      addToast(errorMessage(err, 'Could not add the khata entry'), 'error');
    }
  };

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(payAmount);
    if (!selectedId || !(amount > 0)) return;
    try {
      await khataApi.addPayment({
        userId: selectedId,
        date: payDate,
        amount,
        paymentMode: payMode,
        note: payNote.trim() || 'Payment received',
      });
      addToast(`Recorded ${formatINR(amount)} payment`, 'success');
      setPayAmount('');
      setPayNote('');
      await refreshAfterChange();
    } catch (err) {
      addToast(errorMessage(err, 'Could not record the payment'), 'error');
    }
  };

  const uploadQr = async (file: File | undefined) => {
    if (!file) return;
    try {
      await khataApi.uploadPaymentQr(file);
      setQrMissing(false);
      setQrVersion(Date.now());
      addToast('Payment QR updated', 'success');
    } catch (err) {
      addToast(errorMessage(err, 'Could not upload the QR code'), 'error');
    }
  };

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-stone-900">Kirana Khata Ledger</h2>
        <p className="text-xs text-stone-500">Add dated entries and payments for each customer. Customers see the same ledger in their account.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section aria-label="Customers" className="space-y-3 xl:col-span-1">
          <div className="relative">
            <label htmlFor="khata-search" className="sr-only">Search customers</label>
            <input
              id="khata-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email"
              className={`${INPUT} pl-9`}
            />
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
          </div>

          <ul className="max-h-[420px] divide-y divide-stone-100 overflow-y-auto rounded-2xl border border-stone-200 bg-white">
            {loadingCustomers && customers.length === 0 && <li className="p-4 text-xs text-stone-500">Loading customers…</li>}
            {!loadingCustomers && customers.length === 0 && <li className="p-4 text-xs text-stone-500">No customers match.</li>}
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  aria-current={c.id === selectedId ? 'true' : undefined}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 p-3 text-left transition ${
                    c.id === selectedId ? 'bg-emerald-50' : 'hover:bg-stone-50'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-stone-900">{c.name}</span>
                    <span className="block text-[11px] text-stone-500">{c.phoneFormatted}</span>
                  </span>
                  <span className={`shrink-0 text-xs font-black tabular-nums ${c.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatINR(c.balanceDue)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Selected customer khata" className="min-w-0 space-y-6 xl:col-span-2">
          {!selected && (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-500">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-stone-300" />
              Select a customer to see their khata and add entries.
            </div>
          )}

          {selected && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-base font-black text-stone-900">{selected.name}</h3>
                  <p className="text-xs text-stone-500">{selected.phoneFormatted}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase">Balance due</span>
                  <span className={`text-2xl font-black tabular-nums ${selected.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatINR(selected.balanceDue)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <form onSubmit={submitEntry} className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-black text-stone-900">Add khata entry</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="entry-date" className={LABEL}>Date</label>
                      <input id="entry-date" type="date" required max={storeToday()} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="entry-amount" className={LABEL}>Amount (₹)</label>
                      <input id="entry-amount" type="number" min="1" step="1" required value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="entry-item" className={LABEL}>Item</label>
                    <input id="entry-item" type="text" required placeholder="e.g. Tea powder 250g" value={entryItem} onChange={(e) => setEntryItem(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label htmlFor="entry-title" className={LABEL}>Title (optional)</label>
                    <input id="entry-title" type="text" placeholder="e.g. Aki Hata" value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} className={INPUT} />
                  </div>
                  <button type="submit" className="w-full cursor-pointer rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">
                    Add to khata
                  </button>
                </form>

                <form onSubmit={submitPayment} className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-black text-stone-900">Record payment received</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="pay-date" className={LABEL}>Date</label>
                      <input id="pay-date" type="date" required max={storeToday()} value={payDate} onChange={(e) => setPayDate(e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pay-amount" className={LABEL}>Amount (₹)</label>
                      <input id="pay-amount" type="number" min="1" step="1" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pay-mode" className={LABEL}>Received by</label>
                    <select id="pay-mode" value={payMode} onChange={(e) => setPayMode(e.target.value as 'cash' | 'upi' | 'bank')} className={INPUT}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank">Bank transfer</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pay-note" className={LABEL}>Note (optional)</label>
                    <input id="pay-note" type="text" placeholder="e.g. Paid via QR" value={payNote} onChange={(e) => setPayNote(e.target.value)} className={INPUT} />
                  </div>
                  <button type="submit" className="w-full cursor-pointer rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white hover:bg-stone-800">
                    Record payment
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-stone-900">Ledger</h4>
                {loadingBook && !passbook && <p className="text-xs text-stone-500">Loading ledger…</p>}
                {passbook && passbook.entries.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">No entries yet.</p>
                )}
                {passbook && passbook.entries.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="bg-stone-50 text-[10px] tracking-wider text-stone-500 uppercase">
                        <tr>
                          <th scope="col" className="p-3">Date</th>
                          <th scope="col" className="p-3">Type</th>
                          <th scope="col" className="p-3">Item / details</th>
                          <th scope="col" className="p-3 text-right">Amount</th>
                          <th scope="col" className="p-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {passbook.entries.map((e) => (
                          <tr key={e.id}>
                            <td className="p-3 whitespace-nowrap tabular-nums text-stone-600">{formatDate(e.date)}</td>
                            <td className="p-3">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${e.type === 'payment' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                {e.type === 'payment' ? 'Payment' : 'Khata'}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-stone-900">{e.description}</p>
                              {e.title && <p className="text-[11px] text-stone-500">{e.title}</p>}
                            </td>
                            <td className={`p-3 text-right font-black whitespace-nowrap tabular-nums ${e.type === 'payment' ? 'text-emerald-700' : 'text-stone-900'}`}>
                              {e.type === 'payment' ? '−' : '+'} {formatINR(e.amount)}
                            </td>
                            <td className="p-3 text-right font-bold whitespace-nowrap tabular-nums text-stone-700">{formatINR(e.balanceAfter)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-black text-stone-900">Store payment QR</h4>
            <p className="text-xs text-stone-500">Customers see this code on their khata page to pay by UPI.</p>
            <div className="flex flex-wrap items-center gap-4">
              {qrMissing ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">No QR uploaded yet.</p>
              ) : (
                <img
                  src={khataApi.paymentQrUrl(qrVersion)}
                  alt="Current payment QR code"
                  onError={() => setQrMissing(true)}
                  className="h-28 w-28 rounded-xl border border-stone-200 bg-white object-contain p-1"
                />
              )}
              <div>
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    void uploadQr(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload QR image
                </button>
                <p className="mt-1 text-[11px] text-stone-400">JPEG, PNG or WebP, up to 3 MB.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
