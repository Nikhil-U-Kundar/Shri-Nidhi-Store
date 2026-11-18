import { ArrowRight, Coffee, Cookie, Droplet, Flame, Heart, Sparkle, Sparkles, ShieldCheck, Wallet, Wheat, Zap, type LucideIcon } from 'lucide-react';
import { useCatalog } from '@/entities/product';
import { landingImages } from '@/shared/config/images';
import { useNavigation } from '@/shared/lib/navigation';
import { scrollToCatalog } from '@/shared/lib/scroll';

interface QuickCategory {
  name: string;
  caption: string;
  icon: LucideIcon;
}

const QUICK_CATEGORIES: readonly QuickCategory[] = [
  { name: 'Atta, Rice & Dal', icon: Wheat, caption: 'Grains & Pulses' },
  { name: 'Cooking Oil & Ghee', icon: Droplet, caption: 'Edible Oils' },
  { name: 'Spices & Masalas', icon: Flame, caption: 'Whole & Ground' },
  { name: 'Dairy & Breakfast', icon: Coffee, caption: 'Daily Milk & Butter' },
  { name: 'Snacks & Biscuits', icon: Cookie, caption: 'Munchies & Noodles' },
  { name: 'Household & Cleaning', icon: Sparkle, caption: 'Soaps & Detergents' },
  { name: 'Personal Care', icon: Heart, caption: 'Bathing & Oral Care' },
];

export function HeroBanner() {
  const { setSelectedCategory } = useCatalog();
  const { setCustomerTab } = useNavigation();

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="relative flex min-h-60 items-center overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 text-white shadow-xl sm:min-h-80 sm:rounded-3xl md:min-h-90">
        <div className="absolute inset-0">
          <img src={landingImages.hero} alt="" className="h-full w-full object-cover object-center opacity-40" />
          <div className="absolute inset-0 bg-linear-to-r from-stone-950 via-stone-950/85 to-transparent" />
        </div>

        <div className="relative z-10 min-w-0 max-w-2xl space-y-3 p-5 sm:space-y-4 sm:p-10 md:p-14">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black text-stone-950 shadow sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">SRI NIDHI STORE · MANDI RATES</span>
          </div>

          <h1 className="text-2xl leading-tight font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Daily Ration &amp; Groceries. <br />
            <span className="text-emerald-400">At Pure Local Kirana Prices.</span>
          </h1>

          <p className="max-w-xl text-xs leading-relaxed text-stone-300 sm:text-sm">
            Skip excessive markups and surge delivery fees. Order authentic sealed grains, cooking oils, dairy, and spices
            directly from Sri Nidhi Store with 30-min express dispatch and monthly <strong>Kirana Khata</strong> store credit.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 sm:px-6 sm:text-sm"
            >
              <span>Order Ration Online</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCustomerTab('deals')}
              className="cursor-pointer rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 sm:text-sm"
            >
              View Weekend Offers
            </button>
          </div>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-stone-300">
            <li className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-400" /> 30-Min Fast Delivery</li>
            <li className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-emerald-400" /> Kirana Khata Available</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-blue-400" /> 100% Original Sealed Packs</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-stone-900">Shop Daily Essentials</h2>
          <p className="text-xs text-stone-500">Pick from fresh daily staples stocked directly from the Mandi</p>
        </div>

        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-7">
          {QUICK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCustomerTab('home');
                    scrollToCatalog();
                  }}
                  className="group flex h-full w-full min-w-0 cursor-pointer flex-col items-center justify-between rounded-2xl border border-stone-200 bg-white p-2.5 text-center transition hover:border-emerald-500 hover:shadow-md sm:p-3.5"
                >
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white sm:h-10 sm:w-10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="w-full min-w-0">
                    <span className="line-clamp-2 text-[10px] font-bold text-stone-900 sm:text-xs">{cat.name}</span>
                    <span className="mt-0.5 block text-[10px] text-stone-400">{cat.caption}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
