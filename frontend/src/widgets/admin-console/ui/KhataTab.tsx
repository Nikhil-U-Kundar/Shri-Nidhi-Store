import { useState, type FormEvent } from 'react';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useRecordKhataPayment } from '@/features/khata-repayment';

export function KhataTab() {
  const { user } = useAuth();
  const recordPayment = useRecordKhataPayment();
  const [amount, setAmount] = useState('500');
  const [note, setNote] = useState('Cash payment settled at Shop 12');

  const handleRecord = (event: FormEvent) => {
    event.preventDefault();
    const value = parseInt(amount, 10);
    if (value > 0) void recordPayment(value, note);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-stone-900">Kirana Khata Management</h3>
        <p className="text-xs text-stone-500">Record counter cash payments and credit additions for {user.name || 'customers'}</p>
      </div>

      <form onSubmit={handleRecord} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h4 className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <Wallet className="h-4 w-4 text-emerald-700" />
          <span>Record Counter Repayment (Shop 12 Counter)</span>
        </h4>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
          <div>
            <label htmlFor="khata-customer" className="mb-1 block font-semibold text-stone-600">Customer</label>
            <input id="khata-customer" type="text" value={`${user.name} (${user.phone})`} readOnly className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 font-medium text-stone-700" />
          </div>
          <div>
            <label htmlFor="khata-received" className="mb-1 block font-semibold text-stone-600">Amount Received (₹)</label>
            <input id="khata-received" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-2.5 font-bold text-stone-900" />
          </div>
          <div>
            <label htmlFor="khata-note" className="mb-1 block font-semibold text-stone-600">Payment Method / Note</label>
            <input id="khata-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-stone-900" />
          </div>
        </div>

        <button type="submit" className="cursor-pointer rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-emerald-800">
          Record Cash Payment &amp; Update Balance
        </button>
      </form>

      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h4 className="font-bold text-stone-900">{user.name}</h4>
            <p className="text-xs text-stone-500">{user.phone}</p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-semibold text-stone-400">Current Balance</span>
            <span className="text-2xl font-black text-emerald-800 tabular-nums">₹{user.khataBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <ul className="divide-y divide-stone-100 text-xs">
          {user.khataLedger.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-bold text-stone-900">{tx.desc}</p>
                <span className="text-[10px] text-stone-400">{tx.date}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className={`font-black tabular-nums ${tx.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                </span>
                <span className="block text-[10px] text-stone-400 tabular-nums">Balance: ₹{tx.balanceAfter}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
