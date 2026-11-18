import { useCallback, useEffect, useState } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';
import { khataApi, type KhataPassbook } from '@/entities/khata';
import { useAuth } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errors';

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Customer's khata: what they owe, the store's payment QR, and the dated ledger. */
export function KhataSection() {
  const { user } = useAuth();
  const [passbook, setPassbook] = useState<KhataPassbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrMissing, setQrMissing] = useState(false);

  const load = useCallback(async () => {
    if (!user.id) return;
    setLoading(true);
    setError('');
    try {
      setPassbook(await khataApi.passbook(user.id));
    } catch (err) {
      setError(errorMessage(err, 'Could not load your khata'));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !passbook) {
    return <p className="py-10 text-center text-xs text-stone-500">Loading your khata…</p>;
  }

  if (error || !passbook) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
        <p>{error || 'Your khata is not available right now.'}</p>
        <button type="button" onClick={() => void load()} className="cursor-pointer rounded-lg bg-white px-3 py-1.5 font-bold text-red-700">
          Try again
        </button>
      </div>
    );
  }

  const { summary, entries } = passbook;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-linear-to-br from-emerald-900 via-emerald-800 to-stone-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black tracking-wider text-emerald-300 uppercase">Balance due to Sri Nidhi Store</p>
            <p className="mt-2 text-4xl font-black tracking-tight tabular-nums sm:text-5xl">{formatINR(summary.balanceDue)}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Refresh khata"
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-white/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <dt className="text-emerald-200">Total on khata</dt>
            <dd className="mt-1 text-base font-black tabular-nums">{formatINR(summary.totalCredit)}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <dt className="text-emerald-200">Paid so far</dt>
            <dd className="mt-1 text-base font-black tabular-nums">{formatINR(summary.totalPaid)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="khata-ledger-heading" className="min-w-0 space-y-3 lg:col-span-2">
          <h3 id="khata-ledger-heading" className="text-sm font-black text-stone-900">
            Khata ledger ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
          </h3>
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
              No khata entries yet. Purchases the store adds to your khata appear here, day by day.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="bg-stone-50 text-[10px] tracking-wider text-stone-500 uppercase">
                  <tr>
                    <th scope="col" className="p-3">Date</th>
                    <th scope="col" className="p-3">Item / details</th>
                    <th scope="col" className="p-3 text-right">Amount</th>
                    <th scope="col" className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {entries.map((entry) => {
                    const isPayment = entry.type === 'payment';
                    return (
                      <tr key={entry.id} className="align-top">
                        <td className="p-3 whitespace-nowrap text-stone-600 tabular-nums">{formatDate(entry.date)}</td>
                        <td className="p-3">
                          <p className="font-bold text-stone-900">{entry.description}</p>
                          {entry.title && <p className="text-[11px] text-stone-500">{entry.title}</p>}
                          {isPayment && <p className="text-[11px] font-semibold text-emerald-700">Payment received</p>}
                        </td>
                        <td className={`p-3 text-right font-black whitespace-nowrap tabular-nums ${isPayment ? 'text-emerald-700' : 'text-stone-900'}`}>
                          {isPayment ? '−' : '+'} {formatINR(entry.amount)}
                        </td>
                        <td className="p-3 text-right font-bold whitespace-nowrap text-stone-700 tabular-nums">
                          {formatINR(entry.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside aria-labelledby="khata-pay-heading" className="space-y-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
            <h3 id="khata-pay-heading" className="flex items-center justify-center gap-2 text-sm font-black text-stone-900">
              <QrCode className="h-4 w-4 text-emerald-700" />
              Pay with UPI
            </h3>
            <p className="mt-1 text-[11px] text-stone-500">Scan this code with any UPI app, then tell the counter the amount you paid.</p>
            {qrMissing ? (
              <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
                The payment QR is not set up yet. Please pay at the shop counter.
              </p>
            ) : (
              <img
                src={khataApi.paymentQrUrl()}
                alt="Sri Nidhi Store UPI payment QR code"
                onError={() => setQrMissing(true)}
                className="mx-auto mt-4 aspect-square w-full max-w-56 rounded-xl border border-stone-100 bg-white object-contain p-2"
              />
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-stone-500">
            Payments are recorded by the store once received. Your balance updates after that.
          </p>
        </aside>
      </div>
    </div>
  );
}
