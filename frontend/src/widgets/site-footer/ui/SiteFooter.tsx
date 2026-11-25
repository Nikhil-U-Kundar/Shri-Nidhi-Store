import { Clock, Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import { useCatalog } from '@/entities/product';
import { STORE, DELIVERY } from '@/shared/config';
import { scrollToCatalog } from '@/shared/lib/scroll';
import { BuildBadge } from '@/shared/ui/BuildBadge';

const FOOTER_CATEGORIES = [
  { label: 'Atta, Rice & Dal', category: 'Atta, Rice & Dal' },
  { label: 'Cooking Oil & Ghee', category: 'Cooking Oil & Ghee' },
  { label: 'Spices & Seasonings', category: 'Spices & Masalas' },
  { label: 'Dairy & Fresh Milk', category: 'Dairy & Breakfast' },
  { label: 'Household Cleaning', category: 'Household & Cleaning' },
] as const;

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'Call the store', icon: Phone },
] as const;

export function SiteFooter() {
  const { setSelectedCategory } = useCatalog();

  return (
    <footer className="border-t border-stone-800 bg-stone-900 pt-12 pb-8 text-xs text-stone-300">
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">SN</span>
            <span className="text-base font-black tracking-tight break-words text-white sm:text-lg">{STORE.legalName}</span>
          </div>
          <p className="max-w-sm leading-relaxed text-stone-400">
            Your trusted neighborhood grocery partner in Belapu, Haryana. Delivering freshly ground stone chakki atta, pure
            cooking oils, dals, dairy, and home essentials with traditional store warmth and modern speed.
          </p>
          <div className="flex items-center gap-3 pt-1 text-stone-400">
            {SOCIAL_LINKS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 transition hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <nav aria-label="Footer categories">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-white uppercase">Mandi Categories</h2>
          <ul className="space-y-2 text-stone-400">
            {FOOTER_CATEGORIES.map((item) => (
              <li key={item.category}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.category);
                    scrollToCatalog();
                  }}
                  className="cursor-pointer text-left transition hover:text-emerald-400"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-xs font-bold tracking-wider text-white uppercase">Store Policies</h2>
          <ul className="space-y-2 text-stone-400">
            <li>Local Delivery: Free above ₹{DELIVERY.freeThreshold} (Within 5km radius)</li>
            <li>Fast 30-Min Express Dispatch</li>
            <li>Kirana Khata: 0% Interest for 30 Days</li>
            <li>Same-Day Replacement on Unopened Packs</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold tracking-wider text-white uppercase">Store Contact</h2>
          <ul className="space-y-2.5 text-stone-400">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{STORE.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
              <a href={`tel:${STORE.phoneTel}`} className="hover:text-white">{STORE.phoneDisplay}</a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Daily: {STORE.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-stone-800 px-4 pt-6 text-[11px] text-stone-500 sm:flex-row sm:px-6 lg:px-8">
        <span>© 2026 Sri Nidhi Store &amp; General Store. All rights reserved.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Verified Local Mandi Partner</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-emerald-400">Kirana Khata Credit Enabled</span>
        </div>
      </div>
      <BuildBadge className="pt-4" />
    </footer>
  );
}
