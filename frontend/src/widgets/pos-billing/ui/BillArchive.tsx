import { useState } from 'react';
import { Printer, Search, Trash2 } from 'lucide-react';
import { useBilling } from '@/entities/bill';
import { useBillActions } from '../model/useBillActions';

export function BillArchive() {
  const { bills, setActiveBill } = useBilling();
  const { deleteBill } = useBillActions();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = bills.filter(
    (b) =>
      !needle ||
      b.billNumber.toLowerCase().includes(needle) ||
      b.customerName.toLowerCase().includes(needle) ||
      b.customerPhone.includes(query.trim())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-stone-900">Generated Bills &amp; Take Bill Archive</h3>
          <p className="text-xs text-stone-500">Use &quot;Take Bill&quot; on any row to reprint the receipt or share via WhatsApp</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="archive-search" className="sr-only">Search bills</label>
          <input
            id="archive-search"
            type="search"
            placeholder="Search Bill #, Customer, Phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pr-3 pl-9 text-xs focus:border-emerald-600 focus:outline-none"
          />
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 text-[10px] text-stone-500 uppercase">
            <tr>
              <th scope="col" className="p-3.5">Bill Number</th>
              <th scope="col" className="p-3.5">Date &amp; Time</th>
              <th scope="col" className="p-3.5">Customer</th>
              <th scope="col" className="p-3.5">Items</th>
              <th scope="col" className="p-3.5">Amount</th>
              <th scope="col" className="p-3.5">Payment</th>
              <th scope="col" className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {visible.map((b) => (
              <tr key={b.id} className="transition hover:bg-stone-50/80">
                <td className="p-3.5 font-bold text-stone-900">{b.billNumber}</td>
                <td className="p-3.5 text-stone-500">
                  {b.date} <span className="block text-[10px] text-stone-400">{b.time}</span>
                </td>
                <td className="p-3.5 font-semibold text-stone-900">
                  {b.customerName}
                  <span className="block text-[10px] font-normal text-stone-500">{b.customerPhone}</span>
                </td>
                <td className="max-w-[220px] truncate p-3.5 text-stone-600">{b.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}</td>
                <td className="p-3.5 font-black text-stone-900 tabular-nums">₹{b.total}</td>
                <td className="p-3.5">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{b.paymentMethod}</span>
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setActiveBill(b)}
                    className="mr-2 inline-flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                    title="View and print bill"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Take Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete bill ${b.billNumber}?`)) void deleteBill(b.id);
                    }}
                    className="cursor-pointer rounded-lg p-1.5 text-stone-400 transition hover:text-red-600"
                    title="Delete bill"
                    aria-label={`Delete bill ${b.billNumber}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-8 text-center text-xs text-stone-500">No bills match this search.</p>}
      </div>
    </div>
  );
}
