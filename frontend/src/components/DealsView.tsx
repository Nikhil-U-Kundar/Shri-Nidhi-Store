import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';

export const DealsView: React.FC = () => {
  const { products, setCustomerTab } = useApp();

  const deals = products.filter((p) => p.discount >= 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCustomerTab('home')}
          className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Groceries</span>
        </button>
      </div>

      {/* Deals Hero */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
          Weekend Mandi Savings Fair
        </span>
        <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">
          Bumper Grocery & Combo Mandi Deals
        </h2>
        <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
          Bulk savings passed directly from manufacturer distributors to your neighborhood basket. Genuine discounts up to 22% OFF on Atta, Edible Oil, Rice, and Spices.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-stone-900">
            Featured Deals ({deals.length} items with &gt;10% off)
          </h3>
          <span className="text-xs text-stone-500">Mandi verified prices</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {deals.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
};
