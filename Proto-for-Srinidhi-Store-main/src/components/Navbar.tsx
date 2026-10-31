import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBasket,
  Search,
  X,
  ShoppingBag,
  User,
  Wallet,
  Clock,
  MapPin,
  Sparkles,
  ChevronDown,
  LogOut,
  Package,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    customerTab,
    setCustomerTab,
    setAccountSubTab,
    cartCount,
    cartSubtotal,
    setIsCartDrawerOpen,
    searchQuery,
    setSearchQuery,
    isLoggedIn,
    user,
    logout,
    loginAsDemo,
    products,
    setSelectedProductDetail
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-9 z-40 bg-white border-b border-stone-200 shadow-sm">
      {/* Top Store Notice Strip */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 font-medium border-b border-emerald-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden lg:flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Store Open: 7:00 AM – 10:00 PM (Daily)</span>
            <span className="text-emerald-500">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Belapu, industrial Area
            </span>
          </div>

          <div className="mx-auto lg:mx-0 flex items-center gap-2">
            <span className="bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.5 rounded font-black uppercase">
              Mandi Rates
            </span>
            <span className="text-stone-200">
              Free delivery on orders above ₹499 <span className="hidden sm:inline">| Instant 30-min local delivery</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-stone-300">
            <span>Call Store: +91 98765 43210</span>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* ZONE 1: Brand Wordmark & Location */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setCustomerTab('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/25 group-hover:scale-105 transition">
                <ShoppingBasket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                  SRI NIDHI <span className="text-emerald-700">STORE</span>
                </span>
                <span className="text-[10px] font-semibold text-stone-500 tracking-wider uppercase block -mt-1">
                  General Store · Best Mandi Prices
                </span>
              </div>
            </button>

            {/* Micro Delivery Location Badge */}
            <div className="hidden xl:flex items-center text-xs bg-stone-100/80 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-700">
              <MapPin className="w-4 h-4 text-emerald-700 mr-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-stone-900 block leading-tight">Sector 14 Hub</span>
                <span className="text-[11px] text-stone-500">Delivering in 30 mins</span>
              </div>
            </div>
          </div>

          {/* ZONE 2: Search Input & Instant Suggestions */}
          <div className="flex-1 max-w-xl mx-2 relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Atta, Fortune Oil, Tata Salt, Dals, Spices..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-stone-100 border border-transparent focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Search Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 z-50 overflow-hidden divide-y divide-stone-100 max-h-96 overflow-y-auto">
                <div className="p-2 bg-stone-50 text-[11px] font-bold text-stone-500 flex justify-between">
                  <span>MATCHING PRODUCTS</span>
                  <span className="text-emerald-700">Sri Nidhi Store Inventory</span>
                </div>
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedProductDetail(item);
                        setIsSearchOpen(false);
                      }}
                      className="p-2.5 hover:bg-stone-50 flex items-center justify-between cursor-pointer text-xs transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 object-contain rounded bg-stone-100 p-0.5"
                        />
                        <div>
                          <p className="font-bold text-stone-900">{item.name}</p>
                          <span className="text-[11px] text-stone-500">{item.unit} · {item.brand}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-800 text-sm">₹{item.discountPrice}</span>
                        {item.price > item.discountPrice && (
                          <span className="text-[10px] text-stone-400 line-through block">₹{item.price}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-stone-400">
                    No grocery items found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ZONE 3: Primary Actions (Nav links, Khata, User, Cart) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Create & Take Bill Link */}
            <button
              onClick={() => setCustomerTab('billing')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                customerTab === 'billing'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Create Bill & Take Bill (Counter POS)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Billing &amp; Take Bill</span>
            </button>

            {/* Deals link */}
            <button
              onClick={() => setCustomerTab('deals')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                customerTab === 'deals'
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Weekend Deals</span>
            </button>

            {/* Kirana Khata Badge (Visible when logged in) */}
            {isLoggedIn && (
              <button
                onClick={() => {
                  setCustomerTab('account');
                  setAccountSubTab('khata');
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                title="Your Kirana Khata / Monthly Store Credit"
              >
                <Wallet className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] block text-emerald-700 uppercase font-black leading-none">
                    Khata Credit
                  </span>
                  <span className="font-black text-sm leading-tight text-emerald-950 tabular-nums">
                    ₹{user.khataBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            )}

            {/* User Account Button with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    loginAsDemo();
                  } else {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition border border-stone-200 sm:border-transparent cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {isLoggedIn ? 'RS' : <User className="w-4 h-4" />}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-[10px] text-stone-400 block leading-tight">
                    {isLoggedIn ? 'Welcome,' : 'Guest'}
                  </span>
                  <span className="font-bold text-xs text-stone-800">
                    {isLoggedIn ? user.name.split(' ')[0] : 'Sign In'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden md:inline" />
              </button>

              {/* Account Dropdown */}
              {isUserMenuOpen && isLoggedIn && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 z-50 py-2 divide-y divide-stone-100">
                  <div className="px-4 py-2 text-xs">
                    <p className="font-bold text-stone-900">{user.name}</p>
                    <p className="text-stone-500 text-[11px] truncate">{user.phone}</p>
                  </div>
                  <div className="py-1 text-xs font-medium text-stone-700">
                    <button
                      onClick={() => {
                        setCustomerTab('account');
                        setAccountSubTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-stone-400" />
                      <span>Profile & Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setCustomerTab('account');
                        setAccountSubTab('orders');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-stone-400" />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        setCustomerTab('account');
                        setAccountSubTab('khata');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-800">Kirana Khata Ledger</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition cursor-pointer"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-amber-400 text-stone-950 font-black text-[11px] px-1.5 py-0.2 rounded-full min-w-[20px] text-center tabular-nums">
                {cartCount}
              </span>
              <span className="hidden md:inline text-xs font-bold border-l border-emerald-600 pl-2 tabular-nums">
                ₹{cartSubtotal}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
