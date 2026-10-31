import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  TrendingUp,
  Wallet,
  FileText
} from 'lucide-react';
import { OrderStatus, Product } from '../types';
import { useApp } from '../context/AppContext';
import { BillingCounterView } from './BillingCounterView';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProductStock,
    deleteProduct,
    orders,
    updateOrderStatus,
    user,
    recordKhataRepayment,
    toggleViewMode,
    setPrintReceiptOrder
  } = useApp();

  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'products' | 'khata' | 'inventory' | 'reports' | 'billing'>('dashboard');

  // Product Add Form State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Atta, Rice & Dal');
  const [newProdBrand, setNewProdBrand] = useState('Fortune');
  const [newProdUnit, setNewProdUnit] = useState('1 kg');
  const [newProdPrice, setNewProdPrice] = useState('180');
  const [newProdDiscountPrice, setNewProdDiscountPrice] = useState('155');
  const [newProdStock, setNewProdStock] = useState('25');

  // Khata Counter Payment Form State
  const [khataPayAmount, setKhataPayAmount] = useState('500');
  const [khataPayNote, setKhataPayNote] = useState('Cash payment settled at Shop 12');

  // Calculations
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.total, 48500);
  const todaySales = orders.slice(0, 3).reduce((sum, o) => sum + o.total, 8420);
  const pendingOrders = orders.filter((o) => o.status !== 'Delivered').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const mrp = parseInt(newProdPrice, 10) || 100;
    const sellingPrice = parseInt(newProdDiscountPrice, 10) || 90;
    const stock = parseInt(newProdStock, 10) || 20;
    const discount = Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100));

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory,
      brand: newProdBrand.trim(),
      unit: newProdUnit.trim(),
      price: mrp,
      discountPrice: sellingPrice,
      discount,
      stock,
      rating: 4.8,
      reviewsCount: 1,
      featured: false,
      isOffer: discount > 10,
      image: '/src/assets/images/hero_apna_kirana_1793038571237.jpg',
      description: 'Sourced directly from authorized wholesale Mandi distributor for Sri Nidhi Store.',
      mfg: `${newProdBrand} Ltd`,
      origin: 'India',
      expiry: '12 Months'
    };

    addProduct(newProd);
    setShowAddProductModal(false);
    setNewProdName('');
  };

  const handleQuickRestock = (id: string, current: number) => {
    updateProductStock(id, current + 24);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-stone-800 bg-stone-950">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white mr-3 font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Sri Nidhi Store Admin</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Store Operations
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Metrics</span>
            </button>

            <button
              onClick={() => setAdminTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <span className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Orders Pipeline</span>
              </span>
              {pendingOrders > 0 && (
                <span className="bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'products'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Catalog (CRUD)</span>
            </button>

            <button
              onClick={() => setAdminTab('khata')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'khata'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Khata / Udhar Ledger</span>
            </button>

            <button
              onClick={() => setAdminTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <span className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Stock & Low Alerts</span>
              </span>
              {lowStockCount > 0 && (
                <span className="bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full text-[10px]">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales Reports</span>
            </button>

            <button
              onClick={() => setAdminTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                adminTab === 'billing'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'hover:bg-stone-800 text-stone-300'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Counter Billing (POS)</span>
            </button>
          </nav>
        </div>

        {/* Store Owner Card */}
        <div className="p-4 border-t border-stone-800 bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xs">
              SK
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Suresh Kumar</p>
              <p className="text-[10px] text-stone-400">Shop 12 Owner (Sector 14)</p>
            </div>
          </div>
          <button
            onClick={toggleViewMode}
            className="mt-3 w-full bg-stone-800 hover:bg-stone-700 text-stone-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen">
        {/* DASHBOARD TAB */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Store Operations Command Center
                </h2>
                <p className="text-xs text-stone-500">
                  Live metrics, stock refills, and delivery dispatch for Sector 14
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Today's Store Sales
                </span>
                <p className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                  ₹{todaySales.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> ↑ 18% vs yesterday
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Pending Orders
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums">
                  {pendingOrders}
                </p>
                <span className="text-[11px] text-stone-500">Awaiting packaging / rider dispatch</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Low Stock Alerts
                </span>
                <p className="text-2xl sm:text-3xl font-black text-red-600 tabular-nums">
                  {lowStockCount}
                </p>
                <span className="text-[11px] text-red-600 font-bold">Needs distributor reorder</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Total Khata Credit
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-800 tabular-nums">
                  ₹18,450
                </p>
                <span className="text-[11px] text-stone-500">Across 14 regular families</span>
              </div>
            </div>

            {/* Responsive Visual SVG Sales Trajectory Chart */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    7-Day Mandi Sales Trajectory (₹ INR)
                  </h3>
                  <p className="text-xs text-stone-500">Monday through Sunday daily store billing</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Weekly Gross: ₹{totalSalesRevenue.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-48 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Gradient Area */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <polygon
                    points="50,110 150,85 250,90 350,75 450,45 550,20 650,40 650,150 50,150"
                    fill="url(#chartGradient)"
                  />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="50,110 150,85 250,90 350,75 450,45 550,20 650,40"
                  />

                  {/* Data Points */}
                  {[
                    { x: 50, y: 110, day: 'Mon', val: '₹4.2k' },
                    { x: 150, y: 85, day: 'Tue', val: '₹5.8k' },
                    { x: 250, y: 90, day: 'Wed', val: '₹6.1k' },
                    { x: 350, y: 75, day: 'Thu', val: '₹6.9k' },
                    { x: 450, y: 45, day: 'Fri', val: '₹8.4k' },
                    { x: 550, y: 20, day: 'Sat', val: '₹12.2k' },
                    { x: 650, y: 40, day: 'Sun', val: '₹9.8k' },
                  ].map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">
                        {pt.val}
                      </text>
                      <text x={pt.x} y="155" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                        {pt.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">Live Order Dispatch Pipeline</h3>
                <p className="text-xs text-stone-500">
                  Changing status updates customer live tracking instantly
                </p>
              </div>
              <span className="text-xs text-stone-500 font-bold">{orders.length} orders total</span>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Customer & Items</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Live Status</th>
                    <th className="p-3.5 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80">
                      <td className="p-3.5 font-bold text-stone-900">
                        {ord.id}
                        <span className="block text-[10px] text-stone-400">{ord.date}</span>
                      </td>
                      <td className="p-3.5 text-stone-700 max-w-[220px]">
                        <p className="font-bold text-stone-900">{ord.customerName}</p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {ord.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                        </p>
                      </td>
                      <td className="p-3.5 font-black text-stone-900 tabular-nums">₹{ord.total}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'Out for Delivery'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB (CRUD) */}
        {adminTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">Store Catalog Management</h3>
                <p className="text-xs text-stone-500">{products.length} products listed</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price / MRP</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-stone-50/80">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-9 h-9 object-contain rounded bg-stone-100 p-0.5"
                        />
                        <div>
                          <span className="font-bold text-stone-900 block">{prod.name}</span>
                          <span className="text-[10px] text-stone-400">
                            {prod.brand} · {prod.unit}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-600">{prod.category}</td>
                      <td className="p-3.5 font-bold text-stone-900 tabular-nums">
                        ₹{prod.discountPrice}{' '}
                        <span className="text-stone-400 line-through text-[11px] font-normal">
                          ₹{prod.price}
                        </span>{' '}
                        <span className="text-emerald-700 text-[10px]">({prod.discount}% off)</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            prod.stock <= 5
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            const val = prompt(`Update shelf stock for ${prod.name}:`, String(prod.stock));
                            if (val !== null) {
                              updateProductStock(prod.id, parseInt(val, 10) || 0);
                            }
                          }}
                          className="text-stone-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          Edit Stock
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${prod.name}" from store catalog?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KHATA TAB */}
        {adminTab === 'khata' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">Kirana Khata Management</h3>
                <p className="text-xs text-stone-500">
                  Record counter cash payments and credit additions for Rahul Sharma
                </p>
              </div>
            </div>

            {/* Quick Record Counter Cash Payment Form */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>Record Counter Repayment (Shop 12 Counter)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Customer</label>
                  <input
                    type="text"
                    value={`${user.name} (${user.phone})`}
                    readOnly
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={khataPayAmount}
                    onChange={(e) => setKhataPayAmount(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Payment Method / Note</label>
                  <input
                    type="text"
                    value={khataPayNote}
                    onChange={(e) => setKhataPayNote(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const amt = parseInt(khataPayAmount, 10);
                  if (amt > 0) {
                    recordKhataRepayment(amt, khataPayNote);
                  }
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition cursor-pointer"
              >
                Record Cash Payment & Update Balance
              </button>
            </div>

            {/* Current Khata Balance & Transactions */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h4 className="font-bold text-stone-900">{user.name}</h4>
                  <p className="text-xs text-stone-500">{user.phone} · Flat 402, Sector 14</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-semibold">Current Balance</span>
                  <span className="text-2xl font-black text-emerald-800 tabular-nums">
                    ₹{user.khataBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {user.khataLedger.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900">{tx.desc}</p>
                      <span className="text-stone-400 text-[10px]">{tx.date}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black tabular-nums ${
                          tx.type === 'credit' ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                      </span>
                      <span className="block text-[10px] text-stone-400 tabular-nums">
                        Balance: ₹{tx.balanceAfter}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {adminTab === 'inventory' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-stone-900">Inventory Stock & Refill Alerts</h3>
              <p className="text-xs text-stone-500">
                Items with stock &lt; 10 units require reordering from the Mandi supplier
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter((p) => p.stock <= 10)
                .map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-5 rounded-2xl border border-red-200 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900">{p.name}</h4>
                        <span className="text-xs text-red-600 font-extrabold">
                          Only {p.stock} units left on shelf
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickRestock(p.id, p.stock)}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      +24 Restock
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {adminTab === 'reports' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">Monthly Store Summary & Audit</h3>
                <p className="text-xs text-stone-500">Sri Nidhi Store & General Store (Sector 14)</p>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Daily Closing</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 text-xs space-y-3 shadow-sm">
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-stone-500">Gross Sales (October 2026):</span>
                <span className="font-black text-stone-900 tabular-nums">₹1,84,320</span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-stone-500">Khata Recoveries Collected:</span>
                <span className="font-black text-emerald-700 tabular-nums">₹42,100</span>
              </div>
              <div className="flex justify-between border-b pb-2.5">
                <span className="text-stone-500">Total Fulfilled Orders:</span>
                <span className="font-black text-stone-900 tabular-nums">412 Deliveries</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-stone-500">Average Basket Value:</span>
                <span className="font-black text-stone-900 tabular-nums">₹447 per order</span>
              </div>
            </div>
          </div>
        )}

        {/* Counter Billing (POS & Take Bill) */}
        {adminTab === 'billing' && <BillingCounterView />}
      </main>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-black text-stone-900 mb-4">Add New Kirana Product</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortune Kachi Ghani Mustard Oil"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                  >
                    <option value="Atta, Rice & Dal">Atta, Rice & Dal</option>
                    <option value="Cooking Oil & Ghee">Cooking Oil & Ghee</option>
                    <option value="Spices & Masalas">Spices & Masalas</option>
                    <option value="Dairy & Breakfast">Dairy & Breakfast</option>
                    <option value="Snacks & Biscuits">Snacks & Biscuits</option>
                    <option value="Household & Cleaning">Household & Cleaning</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit / Pack</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={newProdDiscountPrice}
                    onChange={(e) => setNewProdDiscountPrice(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Initial Stock (Units)</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-stone-200 text-stone-700 font-bold px-4 py-2.5 rounded-xl text-xs flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex-1"
                >
                  Save to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
