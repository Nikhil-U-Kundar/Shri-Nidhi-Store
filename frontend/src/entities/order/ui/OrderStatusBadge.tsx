import type { OrderStatus } from '../model/types';

function statusClasses(status: OrderStatus): string {
  if (status === 'Delivered') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Out for Delivery') return 'bg-blue-100 text-blue-800 animate-pulse';
  return 'bg-amber-100 text-amber-800';
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${statusClasses(status)}`}>
      {status}
    </span>
  );
}
