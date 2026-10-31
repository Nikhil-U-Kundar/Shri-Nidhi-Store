import React, { useState } from 'react';
import {
  User,
  Package,
  Wallet,
  MapPin,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  Printer,
  Bike
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerKhataView } from './CustomerKhataView';

export const AccountView: React.FC = () => {
  const {
    isLoggedIn,
    loginAsDemo,
    logout,
    user,
    accountSubTab,
    setAccountSubTab,
    orders,
    setActiveTrackingOrderId,
    setCustomerTab,
    setPrintReceiptOrder,
    addAddress,
    removeAddress
  } = useApp();

  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newTitle, setNewTitle] = useState('Office');
  const [newText, setNewText] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-white rounded-3xl border border-stone-200 text-center shadow-lg space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-stone-900">Sign in to Access Your Account</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          Guest shopping is 100% open without sign-in barriers! However, checking your past orders, delivery addresses, and <strong>Kirana Khata (Store Credit)</strong> requires mobile sign-in.
        </p>
        <button
          onClick={loginAsDemo}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
        >
          Sign In as Rahul Sharma (1-Click Demo)
        </button>
      </div>
    );
  }

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    addAddress({
      title: newTitle,
      text: newText.trim(),
      pincode: '122001',
      isDefault: false
    });
    setNewText('');
    setShowAddAddr(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Account Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white rounded-3xl border border-stone-200 p-4 space-y-1 self-start shadow-sm">
          <div className="pb-4 mb-2 border-b border-stone-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
              RS
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-stone-900 text-xs truncate">{user.name}</h3>
              <p className="text-[11px] text-stone-500 truncate">{user.phone}</p>
            </div>
          </div>

          <button
            onClick={() => setAccountSubTab('profile')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              accountSubTab === 'profile'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <User className="w-4 h-4 text-stone-400" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setAccountSubTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              accountSubTab === 'orders'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-stone-400" />
              <span>My Orders</span>
            </span>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-bold">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setAccountSubTab('khata')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
              accountSubTab === 'khata'
                ? 'bg-emerald-50 text-emerald-900 font-bold'
                : 'text-emerald-800 hover:bg-emerald-50/50'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Kirana Khata Credit</span>
            </span>
            <span className="text-[10px] bg-emerald-200 text-emerald-950 px-1.5 py-0.2 rounded font-black">
              ₹{user.khataBalance}
            </span>
          </button>

          <button
            onClick={() => setAccountSubTab('addresses')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              accountSubTab === 'addresses'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-stone-400" />
            <span>Saved Addresses</span>
          </button>

          <div className="pt-3 border-t border-stone-100">
            <button
              onClick={logout}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          {/* PROFILE SUB-TAB */}
          {accountSubTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-black text-stone-900">Personal & Store Details</h3>
                <p className="text-xs text-stone-500">Your profile information for deliveries and billing</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg text-xs">
                <div>
                  <label className="block text-stone-500 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={user.phone}
                    readOnly
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-stone-500 font-semibold mb-1">Email ID</label>
                  <input
                    type="text"
                    value={user.email}
                    readOnly
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ORDERS SUB-TAB */}
          {accountSubTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-stone-900">Order History</h3>
                  <p className="text-xs text-stone-500">{orders.length} orders placed with Sri Nidhi Store</p>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 text-xs hover:border-emerald-500/50 transition bg-stone-50/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                      <div>
                        <span className="font-black text-stone-900 text-sm">Order #{ord.id}</span>
                        <span className="text-stone-400 ml-2">{ord.date}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'Out for Delivery'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-stone-600 space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            • {it.name} <strong className="text-stone-900">×{it.qty}</strong>
                          </span>
                          <span className="font-semibold text-stone-800 tabular-nums">
                            ₹{it.price * it.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-stone-500">Total:</span>
                        <span className="font-black text-sm text-stone-900 ml-1 tabular-nums">
                          ₹{ord.total}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-2">via {ord.paymentMethod}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPrintReceiptOrder(ord)}
                          className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTrackingOrderId(ord.id);
                            setCustomerTab('tracking');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Live Track</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KHATA SUB-TAB */}
          {accountSubTab === 'khata' && <CustomerKhataView />}

          {/* ADDRESSES SUB-TAB */}
          {accountSubTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-stone-900">Saved Addresses</h3>
                  <p className="text-xs text-stone-500">Manage local addresses in Sector 14</p>
                </div>
                {!showAddAddr && (
                  <button
                    onClick={() => setShowAddAddr(true)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {showAddAddr && (
                <form
                  onSubmit={handleCreateAddress}
                  className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs"
                >
                  <div className="font-bold text-stone-900">New Saved Address</div>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Parents'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTitle(t)}
                        className={`px-3 py-1 rounded-lg border font-semibold ${
                          newTitle === t ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div>
                    <textarea
                      required
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Full Street Address..."
                      className="w-full p-2 border border-stone-200 rounded-xl bg-white"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddr(false)}
                      className="bg-stone-200 text-stone-700 font-bold px-3 py-2 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-stone-200 rounded-2xl p-4 text-xs flex justify-between items-start bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600 mt-1">{addr.text}</p>
                    </div>
                    {user.addresses.length > 1 && (
                      <button
                        onClick={() => removeAddress(addr.id)}
                        className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
