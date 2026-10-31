import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Minus,
  Trash2,
  Printer,
  Search,
  User,
  Wallet,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BillLineItem, Product } from '../types';
import { useApp } from '../context/AppContext';

export const BillingCounterView: React.FC = () => {
  const {
    products,
    bills,
    createBill,
    deleteBill,
    setActiveBillToTake,
    user,
    setCustomerTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');

  // Bill Creator State
  const [customerMode, setCustomerMode] = useState<'walkin' | 'rahul' | 'custom'>('walkin');
  const [customCustName, setCustomCustName] = useState('');
  const [customCustPhone, setCustomCustPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Kirana Khata' | 'Card'>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [includeGst, setIncludeGst] = useState<boolean>(false);
  const [cashierNote, setCashierNote] = useState('');

  // Bill Items
  const [billItems, setBillItems] = useState<BillLineItem[]>([
    {
      id: 'item-1',
      name: 'Aashirvaad Shudh Chakki Atta',
      unit: '5 kg',
      price: 245,
      qty: 1,
      total: 245
    },
    {
      id: 'item-2',
      name: 'Fortune Sunlite Refined Sunflower Oil',
      unit: '1 Litre Pouch',
      price: 138,
      qty: 1,
      total: 138
    }
  ]);

  // Catalog search
  const [itemSearch, setItemSearch] = useState('');

  // Custom Item Form state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemUnit, setCustomItemUnit] = useState('1 kg');
  const [customItemPrice, setCustomItemPrice] = useState('60');
  const [customItemQty, setCustomItemQty] = useState('1');

  // Archive Search State
  const [archiveSearch, setArchiveSearch] = useState('');

  // Add catalog product to bill
  const handleAddProductToBill = (product: Product) => {
    setBillItems((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) {
        return prev.map((i) =>
          i.name === product.name
            ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: product.name,
          unit: product.unit,
          price: product.discountPrice,
          qty: 1,
          total: product.discountPrice
        }
      ];
    });
  };

  // Add custom loose mandi item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const price = parseFloat(customItemPrice) || 0;
    const qty = parseInt(customItemQty, 10) || 1;

    setBillItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: customItemName.trim(),
        unit: customItemUnit.trim(),
        price,
        qty,
        total: price * qty
      }
    ]);

    setCustomItemName('');
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setBillItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0
              ? { ...item, qty: nextQty, total: nextQty * item.price }
              : null;
          }
          return item;
        })
        .filter((item): item is BillLineItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setBillItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearBill = () => {
    if (confirm('Clear all items from the current bill?')) {
      setBillItems([]);
    }
  };

  // Calculations
  const subtotal = billItems.reduce((sum, it) => sum + it.total, 0);
  const tax = includeGst ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + tax);

  // Submit & Take Bill
  const handleGenerateAndTakeBill = () => {
    if (billItems.length === 0) {
      alert('Please add at least one item to generate a bill.');
      return;
    }

    let customerName = 'Walk-in Cash Customer';
    let customerPhone = 'Counter 1';
    let customerType: 'walk-in' | 'regular' | 'khata' = 'walk-in';

    if (customerMode === 'rahul') {
      customerName = user.name;
      customerPhone = user.phone;
      customerType = paymentMethod === 'Kirana Khata' ? 'khata' : 'regular';
    } else if (customerMode === 'custom') {
      customerName = customCustName.trim() || 'Walk-in Customer';
      customerPhone = customCustPhone.trim() || 'Counter Sale';
      customerType = 'regular';
    }

    if (paymentMethod === 'Kirana Khata') {
      if (customerMode !== 'rahul') {
        alert('Kirana Khata is only enabled for verified registered customers (Rahul Sharma).');
        return;
      }
      if (user.khataBalance < grandTotal) {
        alert(`Insufficient Khata balance (₹${user.khataBalance}). Please choose Cash or UPI.`);
        return;
      }
    }

    void createBill({
      customerName,
      customerPhone,
      customerType,
      items: billItems,
      subtotal,
      discount: discountAmount,
      tax,
      total: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Kirana Khata' ? 'Added to Khata' : 'Paid',
      cashierName: 'Suresh Kumar',
      notes: cashierNote.trim() || 'Retail Counter Bill'
    })
      .then(() => {
        setBillItems([]);
        setDiscountAmount(0);
        setCashierNote('');
      })
      .catch(() => {
        /* toast shown in context */
      });
  };

  // Filter catalog items
  const filteredProducts = products.filter(
    (p) =>
      !itemSearch.trim() ||
      p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(itemSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Filter archive bills
  const filteredBills = bills.filter(
    (b) =>
      !archiveSearch.trim() ||
      b.billNumber.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      b.customerName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      b.customerPhone.includes(archiveSearch)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Page Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Sri Nidhi Store · POS &amp; Billing Desk
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Create instant cash memos, loose Mandi bills, and Take Bill (Print thermal slip or share via WhatsApp)
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-emerald-900 shadow-sm font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'archive'
                ? 'bg-white text-emerald-900 shadow-sm font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Take Bill Archive</span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
              {bills.length}
            </span>
          </button>
        </div>
      </div>

      {/* CREATE NEW BILL VIEW */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Item Picker & Custom Loose Item Form */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Catalog Search */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                  1. Quick Add Store Products
                </h3>
                <span className="text-[11px] text-stone-400">Tap to add</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick search Atta, Oil, Salt, Rice..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 bg-stone-50"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>

              {/* Product Quick-Add Chips Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredProducts.slice(0, 10).map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddProductToBill(prod)}
                    className="p-2 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-400 rounded-xl text-left transition flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate group-hover:text-emerald-900">
                        {prod.name}
                      </p>
                      <span className="text-[10px] text-stone-500 block">
                        {prod.unit} · ₹{prod.discountPrice}
                      </span>
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition">
                      +
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Loose Mandi Items Entry Form */}
            <form
              onSubmit={handleAddCustomItem}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                  2. Add Custom / Loose Mandi Item
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                  Loose Ration
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sugar Loose, Fresh Eggs, Onion 2kg"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Unit</label>
                    <input
                      type="text"
                      value={customItemUnit}
                      onChange={(e) => setCustomItemUnit(e.target.value)}
                      placeholder="1 kg"
                      className="w-full p-2 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customItemQty}
                      onChange={(e) => setCustomItemQty(e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line Item to Current Bill</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Live Bill Register & Bill Generation Desk */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
            {/* Customer Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Customer For Bill
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('walkin')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    customerMode === 'walkin'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="font-bold">Walk-in Customer</div>
                  <span className="text-[10px] text-stone-500">Cash / Spot Counter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerMode('rahul')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    customerMode === 'rahul'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Rahul Sharma</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded">KHATA</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Credit: ₹{user.khataBalance}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerMode('custom')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    customerMode === 'custom'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="font-bold">Enter Details</div>
                  <span className="text-[10px] text-stone-500">Name &amp; Mobile</span>
                </button>
              </div>

              {/* Custom Details Inputs */}
              {customerMode === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customCustName}
                    onChange={(e) => setCustomCustName(e.target.value)}
                    className="p-2 border border-stone-200 rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number (e.g. +91 98765 00000)"
                    value={customCustPhone}
                    onChange={(e) => setCustomCustPhone(e.target.value)}
                    className="p-2 border border-stone-200 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Bill Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  Bill Line Items ({billItems.length} items)
                </h4>
                {billItems.length > 0 && (
                  <button
                    onClick={handleClearBill}
                    className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Register</span>
                  </button>
                )}
              </div>

              {billItems.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-1">
                  <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="font-bold text-stone-700 text-xs">Bill register is empty</p>
                  <p className="text-[11px] text-stone-400">
                    Click products from the left or add custom items to build the bill.
                  </p>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs">
                  {billItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-stone-50/60 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 truncate">{item.name}</p>
                        <span className="text-[11px] text-stone-400">
                          {item.unit} · ₹{item.price} each
                        </span>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-black tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 w-16">
                        <span className="font-black text-stone-900 tabular-nums">₹{item.total}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-stone-300 hover:text-red-600 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing, Discount & Totals */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-stone-900 tabular-nums">₹{subtotal}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-600">Discount / Round-off (₹):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  placeholder="0"
                  onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 p-1.5 border border-stone-300 rounded-lg text-right font-bold bg-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-600">
                  <input
                    type="checkbox"
                    checked={includeGst}
                    onChange={(e) => setIncludeGst(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Add 5% GST (Tax Invoice)</span>
                </label>
                {includeGst && (
                  <span className="font-bold text-stone-900 tabular-nums">+₹{tax}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-base font-black text-stone-950 pt-2 border-t border-stone-200">
                <span>Total Amount:</span>
                <span className="text-emerald-800 text-lg tabular-nums">₹{grandTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'Cash', label: 'Cash Memo', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Kirana Khata', label: 'Kirana Khata', icon: Wallet },
                  { id: 'Card', label: 'Card Swipe', icon: CreditCard }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-700" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button: Create and Take Bill */}
            <button
              onClick={handleGenerateAndTakeBill}
              disabled={billItems.length === 0}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Generate &amp; Take Bill (₹{grandTotal})</span>
            </button>
          </div>
        </div>
      )}

      {/* ARCHIVE / SAVED BILLS VIEW */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900">
                Generated Bills &amp; Take Bill Archive
              </h3>
              <p className="text-xs text-stone-500">
                Click "Take Bill (Print)" on any row to reprint thermal receipt or share via WhatsApp
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search Bill #, Customer, Phone..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 bg-white"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Bill Number</th>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3.5 font-bold text-stone-900">
                      {b.billNumber}
                    </td>
                    <td className="p-3.5 text-stone-500">
                      {b.date} <span className="block text-[10px] text-stone-400">{b.time}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-stone-900">
                      {b.customerName}
                      <span className="block text-[10px] text-stone-500">{b.customerPhone}</span>
                    </td>
                    <td className="p-3.5 text-stone-600 max-w-[200px] truncate">
                      {b.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                    </td>
                    <td className="p-3.5 font-black text-stone-900 tabular-nums">
                      ₹{b.total}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setActiveBillToTake(b)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        title="View and print bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Take Bill</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete bill ${b.billNumber}?`)) {
                            deleteBill(b.id);
                          }
                        }}
                        className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg transition cursor-pointer"
                        title="Delete bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
