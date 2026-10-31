import React from 'react';
import { Zap, BadgePercent, BookOpen, ShieldCheck, Phone, MapPin, Mail, Clock, Facebook, Instagram } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HeroBanner } from './HeroBanner';
import { ProductCard } from './ProductCard';

export const StorefrontView: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useApp();

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All Products' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.discountPrice - b.discountPrice;
    if (sortBy === 'price-high') return b.discountPrice - a.discountPrice;
    if (sortBy === 'discount') return b.discount - a.discount;
    return b.rating - a.rating; // default: popular
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroBanner />

      {/* Main Catalog Section */}
      <section id="catalogSection" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 min-w-0 w-full">
        {/* Header with Sort Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight break-words">
              {selectedCategory === 'All Products'
                ? "Today's Mandi Fresh Stock & Daily Essentials"
                : selectedCategory}
            </h2>
            <p className="text-xs text-stone-500">
              Showing {sortedProducts.length} verified products available at Sector 14 shelf
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs min-w-0 w-full sm:w-auto">
            <span className="text-stone-500 font-semibold shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm min-w-0 flex-1 sm:flex-none max-w-full"
            >
              <option value="popular">Popularity & Rating</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200 mt-6 space-y-3">
            <p className="font-bold text-stone-800 text-sm">No Kirana products found</p>
            <p className="text-xs text-stone-400">
              Try clearing your search query or selecting another grocery category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Products');
              }}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mt-6">
            {sortedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Store Trust / Guarantees Strip */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">30-Min Fast Delivery</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Dispatched directly from our Sector 14 market counter in insulated bags
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <BadgePercent className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">True Mandi Prices</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Genuine bulk wholesale rates passed down without surge markups
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">Kirana Khata (Udhar)</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Order on trusted monthly credit. Settle directly at the store counter
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">100% Sealed Packaging</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Original manufacturer packaging with strict expiry &amp; FSSAI checks
            </p>
          </div>
        </div>
      </section>

      {/* Professional Local Store Footer */}
      <footer className="bg-stone-900 text-stone-300 text-xs pt-12 pb-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                SN
              </div>
              <span className="text-base sm:text-lg font-black text-white tracking-tight break-words">
                SRI NIDHI STORE &amp; GENERAL STORE
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              Your trusted neighborhood grocery partner in Gurugram Sector 14. Delivering freshly ground stone chakki atta, pure cooking oils, dals, dairy, and home essentials with traditional store warmth and modern speed.
            </p>
            <div className="flex items-center space-x-3 text-stone-400 pt-1">
              <span className="p-2 bg-stone-800 rounded-lg hover:text-white transition cursor-pointer">
                <Facebook className="w-4 h-4" />
              </span>
              <span className="p-2 bg-stone-800 rounded-lg hover:text-white transition cursor-pointer">
                <Instagram className="w-4 h-4" />
              </span>
              <span className="p-2 bg-stone-800 rounded-lg hover:text-white transition cursor-pointer">
                <Phone className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Mandi Categories
            </h5>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => setSelectedCategory('Atta, Rice & Dal')}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  Atta, Rice &amp; Dal
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Cooking Oil & Ghee')}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  Cooking Oil &amp; Ghee
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Spices & Masalas')}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  Spices &amp; Seasonings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Dairy & Breakfast')}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  Dairy &amp; Fresh Milk
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('Household & Cleaning')}
                  className="hover:text-emerald-400 cursor-pointer"
                >
                  Household Cleaning
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Store Policies
            </h5>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li>Local Delivery: Free above ₹499 (Within 5km radius)</li>
              <li>Fast 30-Min Express Dispatch</li>
              <li>Kirana Khata: 0% Interest for 30 Days</li>
              <li>Same-Day Replacement on Unopened Packs</li>
              <li>FSSAI Certified Sourcing: 10012031000085</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Store Contact
            </h5>
            <div className="space-y-2.5 text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Shop 12, Main Market, Belapu, industrial Area, Haryana - 122001</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>support@srinidhistore.local</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Daily: 7:00 AM – 10:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-stone-800 text-stone-500 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Sri Nidhi Store &amp; General Store. All rights reserved.</span>
          <div className="flex items-center space-x-3">
            <span>Verified Local Mandi Partner</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Kirana Khata Credit Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
