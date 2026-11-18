import { BadgePercent, BookOpen, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';

const GUARANTEES: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Zap,
    title: '30-Min Fast Delivery',
    text: 'Dispatched directly from our Sector 14 market counter in insulated bags',
  },
  {
    icon: BadgePercent,
    title: 'True Mandi Prices',
    text: 'Genuine bulk wholesale rates passed down without surge markups',
  },
  {
    icon: BookOpen,
    title: 'Kirana Khata (Udhar)',
    text: 'Order on trusted monthly credit. Settle directly at the store counter',
  },
  {
    icon: ShieldCheck,
    title: '100% Sealed Packaging',
    text: 'Original manufacturer packaging with strict expiry & FSSAI checks',
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-stone-200 bg-white py-10 sm:py-12">
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:gap-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {GUARANTEES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-row items-start gap-4 text-left sm:flex-col sm:items-center sm:text-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{title}</h3>
              <p className="mt-1 max-w-xs text-xs text-stone-500">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
