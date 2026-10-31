import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, HelpCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerKhataView: React.FC = () => {
  const { user, recordKhataRepayment } = useApp();
  const [repayAmount, setRepayAmount] = useState<string>('500');
  const [showRepayForm, setShowRepayForm] = useState(false);

  const handleSimulateRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(repayAmount, 10);
    if (!val || val <= 0) return;
    recordKhataRepayment(val, 'Customer Counter UPI / Cash Settlement (Shop 12)');
    setShowRepayForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Khata Hero Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-black flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Kirana Khata & Monthly Udhar Line
            </span>
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
              VERIFIED NEIGHBOR
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
              ₹{user.khataBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-200 font-medium">
              Available Store Credit (Limit: ₹{user.khataCreditLimit.toLocaleString('en-IN')})
            </span>
          </div>

          <p className="text-xs text-emerald-100 max-w-xl leading-relaxed pt-1">
            As a verified neighborhood resident of Sector 14, you can place daily grocery orders without cards or OTPs. Simply choose <strong>"Kirana Khata"</strong> at checkout and clear your monthly balance at the store counter.
          </p>

          <div className="pt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowRepayForm(!showRepayForm)}
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Counter Cash Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Repayment Simulator Form */}
      {showRepayForm && (
        <form
          onSubmit={handleSimulateRepayment}
          className="p-4 sm:p-5 bg-stone-50 border border-emerald-200 rounded-2xl space-y-3 text-xs"
        >
          <div className="flex items-center justify-between font-bold text-stone-900">
            <span>Simulate Payment at Shop Counter</span>
            <span className="text-stone-400 text-[11px]">Instant Khata credit reload</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
              <input
                type="number"
                min="100"
                step="50"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:border-emerald-600 font-bold"
                placeholder="Enter amount"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
            >
              Record Payment
            </button>
          </div>
        </form>
      )}

      {/* Khata Ledger Audit Trail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider">
            Khata Transaction Ledger ({user.khataLedger.length} entries)
          </h4>
          <span className="text-xs text-stone-500">Official Shop 12 Audit Records</span>
        </div>

        <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs bg-white shadow-sm">
          {user.khataLedger.map((tx) => (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    tx.type === 'credit'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-stone-900">{tx.desc}</p>
                  <span className="text-[11px] text-stone-500">{tx.date}</span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`font-black text-sm tabular-nums ${
                    tx.type === 'credit' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                </span>
                <span className="block text-[11px] text-stone-400 tabular-nums">
                  Balance: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
