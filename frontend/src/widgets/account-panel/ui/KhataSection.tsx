import { useState, type FormEvent } from 'react';
import { ArrowDownRight, ArrowUpRight, Plus, Wallet } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useRecordKhataPayment } from '@/features/khata-repayment';

const COUNTER_NOTE = 'Customer Counter UPI / Cash Settlement (Shop 12)';

export function KhataSection() {
  const { user } = useAuth();
  const recordPayment = useRecordKhataPayment();
  const [amount, setAmount] = useState('500');
  const [showForm, setShowForm] = useState(false);

  const handleRecord = async (event: FormEvent) => {
    event.preventDefault();
    const value = parseInt(amount, 10);
    if (!value || value <= 0) return;
    await recordPayment(value, COUNTER_NOTE);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-900 via-emerald-800 to-stone-900 p-6 text-white shadow-xl sm:p-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-emerald-300 uppercase">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Kirana Khata &amp; Monthly Udhar Line
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-200">
              VERIFIED NEIGHBOR
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 pt-2">
            <span className="text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
              ₹{user.khataBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-200">
              Available Store Credit (Limit: ₹{user.khataCreditLimit.toLocaleString('en-IN')})
            </span>
          </div>

          <p className="max-w-xl text-xs leading-relaxed text-emerald-100">
            As a verified neighborhood resident of Sector 14, you can place daily grocery orders without cards or OTPs. Simply
            choose <strong>&quot;Kirana Khata&quot;</strong> at checkout and clear your monthly balance at the store counter.
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              aria-expanded={showForm}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-stone-950 shadow-md transition hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Counter Cash Payment</span>
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleRecord} className="space-y-3 rounded-2xl border border-emerald-200 bg-stone-50 p-4 text-xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-stone-900">
            <span>Record Payment at Shop Counter</span>
            <span className="text-[11px] font-normal text-stone-400">Khata credit reloads instantly</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <label htmlFor="khata-amount" className="sr-only">Amount in rupees</label>
              <span className="absolute top-2.5 left-3 font-bold text-stone-400">₹</span>
              <input
                id="khata-amount"
                type="number"
                min="1"
                step="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-stone-300 bg-white py-2 pr-3 pl-7 font-bold focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <button type="submit" className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow hover:bg-emerald-800">
              Record
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold tracking-wider text-stone-900 uppercase sm:text-sm">
            Khata Transaction Ledger ({user.khataLedger.length} entries)
          </h4>
          <span className="text-xs text-stone-500">Official Shop 12 Audit Records</span>
        </div>

        {user.khataLedger.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white text-xs shadow-sm">
            {user.khataLedger.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <li key={tx.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-stone-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                      {isCredit ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-stone-900">{tx.desc}</p>
                      <span className="text-[11px] text-stone-500">{tx.date}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-sm font-black tabular-nums ${isCredit ? 'text-emerald-700' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[11px] text-stone-400 tabular-nums">
                      Balance: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
