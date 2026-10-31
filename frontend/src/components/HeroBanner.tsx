import React from 'react';
import { Sparkles, ArrowRight, Zap, ShieldCheck, Wallet, Clock, Wheat, Droplet, Flame, Coffee, Cookie, Sparkle, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HeroBanner: React.FC = () => {
  const { setSelectedCategory, setCustomerTab } = useApp();

  const quickCategories = [
    { name: 'Atta, Rice & Dal', icon: Wheat, count: 'Grains & Pulses' },
    { name: 'Cooking Oil & Ghee', icon: Droplet, count: 'Edible Oils' },
    { name: 'Spices & Masalas', icon: Flame, count: 'Whole & Ground' },
    { name: 'Dairy & Breakfast', icon: Coffee, count: 'Daily Milk & Butter' },
    { name: 'Snacks & Biscuits', icon: Cookie, count: 'Munchies & Noodles' },
    { name: 'Household & Cleaning', icon: Sparkle, count: 'Soaps & Detergents' },
    { name: 'Personal Care', icon: Heart, count: 'Bathing & Oral Care' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 min-w-0 w-full">
      {/* Hero Showcase Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-stone-900 border border-stone-800 text-white min-h-[240px] sm:min-h-[320px] md:min-h-[360px] flex items-center">
        {/* Background Image with Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_apna_kirana_1793038571237.jpg"
            alt="Sri Nidhi Store Shelves"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-10 md:p-14 max-w-2xl space-y-3 sm:space-y-4 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-amber-400 text-stone-950 shadow max-w-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SRI NIDHI STORE · MANDI RATES</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            Daily Ration &amp; Groceries. <br />
            <span className="text-emerald-400">At Pure Local Kirana Prices.</span>
          </h1>

          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Skip excessive markups and surge delivery fees. Order authentic sealed grains, cooking oils, dairy, and spices directly from Sri Nidhi Store with 30-min express dispatch and monthly <strong>Kirana Khata</strong> store credit.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('catalogSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Order Ration Online</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCustomerTab('deals')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/25 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              View Weekend Offers
            </button>
          </div>

          {/* Micro Trust Pills */}
          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-stone-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> 30-Min Fast Delivery
            </span>
            <span className="text-stone-600">·</span>
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" /> Kirana Khata Available
            </span>
            <span className="text-stone-600">·</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> 100% Original Sealed Packs
            </span>
          </div>
        </div>
      </div>

      {/* Categories Visual Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">Shop Daily Essentials</h2>
            <p className="text-xs text-stone-500">Pick from fresh daily staples stocked directly from the Mandi</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  const el = document.getElementById('catalogSection');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white p-2 sm:p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-500 hover:shadow-md text-center group transition cursor-pointer flex flex-col items-center justify-between min-w-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="font-bold text-[10px] sm:text-xs text-stone-900 line-clamp-2">{cat.name}</h3>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{cat.count}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
