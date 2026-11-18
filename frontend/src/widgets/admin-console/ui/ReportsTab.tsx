import { Printer } from 'lucide-react';
import { STORE } from '@/shared/config/store';

// Summary figures are the original dashboard's placeholders until reporting is backed by real data.
const SUMMARY_ROWS = [
  { label: 'Gross Sales (October 2026):', value: '₹1,84,320', tone: 'text-stone-900' },
  { label: 'Khata Recoveries Collected:', value: '₹42,100', tone: 'text-emerald-700' },
  { label: 'Total Fulfilled Orders:', value: '412 Deliveries', tone: 'text-stone-900' },
  { label: 'Average Basket Value:', value: '₹447 per order', tone: 'text-stone-900' },
] as const;

export function ReportsTab() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-stone-900">Monthly Store Summary &amp; Audit</h3>
          <p className="text-xs text-stone-500">{STORE.legalName} (Sector 14)</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-stone-800"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Daily Closing</span>
        </button>
      </div>

      <dl className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 text-xs shadow-sm sm:p-6">
        {SUMMARY_ROWS.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
            <dt className="text-stone-500">{row.label}</dt>
            <dd className={`text-right font-black tabular-nums ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
