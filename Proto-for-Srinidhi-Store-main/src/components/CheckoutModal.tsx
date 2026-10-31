import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User,
  MapPin,
  Clock,
  Wallet,
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CheckoutModalProps {
  onTriggerPaymentGateway: (orderParams: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    amount: number;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onTriggerPaymentGateway }) => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartSubtotal,
    deliveryFee,
    cartFinalTotal,
    isLoggedIn,
    user,
    loginAsDemo,
    placeOrder,
    addAddress,
    setCustomerTab
  } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [customerName, setCustomerName] = useState(user.name);
  const [customerPhone, setCustomerPhone] = useState(user.phone);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<string>('⚡ Express Delivery (30-40 Mins)');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI (Google Pay / PhonePe / Paytm)');

  // New Address Form toggle
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');

  if (!isCheckoutModalOpen) return null;

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrText.trim()) return;
    addAddress({
      title: newAddrTitle,
      text: newAddrText.trim(),
      landmark: newAddrLandmark.trim(),
      pincode: '122001',
      isDefault: false
    });
    setShowNewAddressForm(false);
    setSelectedAddressIndex(user.addresses.length); // select the newly added address
  };

  const handleFinalOrderSubmit = () => {
    const chosenAddress = user.addresses[selectedAddressIndex]?.text || 'Sector 14 Main Market, Gurugram';

    const orderParams = {
      deliveryAddress: chosenAddress,
      deliveryMode,
      paymentMethod,
      customerName: customerName || user.name,
      customerPhone: customerPhone || user.phone,
      amount: cartFinalTotal
    };

    if (paymentMethod.startsWith('UPI') || paymentMethod.startsWith('Credit / Debit')) {
      // Launch simulated payment gateway
      setIsCheckoutModalOpen(false);
      onTriggerPaymentGateway(orderParams);
    } else {
      // Direct placement for COD or Khata
      placeOrder(orderParams);
      setIsCheckoutModalOpen(false);
      setCustomerTab('tracking');
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Sri Nidhi Express Checkout</h3>
              <p className="text-xs text-stone-400">
                Step <span className="font-bold text-emerald-400">{currentStep}</span> of 4 · Guaranteed Same Day Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Progress Header */}
        <div className="grid grid-cols-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold text-center divide-x divide-stone-200">
          <div
            className={`py-3 transition ${
              currentStep === 1
                ? 'text-emerald-800 bg-emerald-50 border-b-2 border-emerald-600 font-bold'
                : currentStep > 1
                ? 'text-emerald-700 bg-white font-medium'
                : 'text-stone-400'
            }`}
          >
            1. Contact
          </div>
          <div
            className={`py-3 transition ${
              currentStep === 2
                ? 'text-emerald-800 bg-emerald-50 border-b-2 border-emerald-600 font-bold'
                : currentStep > 2
                ? 'text-emerald-700 bg-white font-medium'
                : 'text-stone-400'
            }`}
          >
            2. Address
          </div>
          <div
            className={`py-3 transition ${
              currentStep === 3
                ? 'text-emerald-800 bg-emerald-50 border-b-2 border-emerald-600 font-bold'
                : currentStep > 3
                ? 'text-emerald-700 bg-white font-medium'
                : 'text-stone-400'
            }`}
          >
            3. Delivery
          </div>
          <div
            className={`py-3 transition ${
              currentStep === 4
                ? 'text-emerald-800 bg-emerald-50 border-b-2 border-emerald-600 font-bold'
                : 'text-stone-400'
            }`}
          >
            4. Payment
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 flex-1 overflow-y-auto text-xs sm:text-sm">
          {/* STEP 1: Customer Contact / Auth Gate */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Customer Verification</h4>
                <p className="text-xs text-stone-500">
                  We use your phone number to coordinate 30-min doorstep delivery and share order updates.
                </p>
              </div>

              {isLoggedIn ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                    RS
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                      Logged In Customer
                    </span>
                    <p className="font-black text-stone-900 text-sm">{user.name}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{user.phone} · {user.email}</p>
                    <div className="mt-2 text-xs text-emerald-800 font-bold">
                      Kirana Khata Balance: ₹{user.khataBalance.toLocaleString('en-IN')} (Eligible for 0-click credit)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Guest Checkout Mode</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        You can continue without an account, or 1-click test fill as regular customer Rahul Sharma.
                      </p>
                    </div>
                    <button
                      onClick={loginAsDemo}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer"
                    >
                      1-Click Demo Fill
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Verma"
                        className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Mobile Number (For Delivery SMS) *</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <span>Continue to Address Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Delivery Address Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Select Sector 14 Delivery Address</h4>
                  <p className="text-xs text-stone-500">Pick where you want our delivery boy to bring the groceries</p>
                </div>
                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-xs text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {/* New Address Form */}
              {showNewAddressForm ? (
                <form onSubmit={handleSaveNewAddress} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold text-stone-900">
                    <span>New Delivery Location</span>
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Office', 'Parents'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAddrTitle(t)}
                        className={`py-1.5 rounded-lg border font-semibold text-center cursor-pointer ${
                          newAddrTitle === t ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Street Address, Flat / House No *</label>
                    <textarea
                      required
                      value={newAddrText}
                      onChange={(e) => setNewAddrText(e.target.value)}
                      placeholder="e.g. Flat 104, Tower B, Belapu, industrial Area"
                      className="w-full p-2 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Nearby Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newAddrLandmark}
                      onChange={(e) => setNewAddrLandmark(e.target.value)}
                      placeholder="e.g. Opposite Main Market SBI Branch"
                      className="w-full p-2 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Save & Use This Address
                  </button>
                </form>
              ) : (
                <div className="space-y-2.5">
                  {user.addresses.map((addr, idx) => (
                    <label
                      key={addr.id}
                      className={`block p-3.5 border rounded-2xl cursor-pointer transition ${
                        selectedAddressIndex === idx
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="checkoutAddress"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs">{addr.title}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">{addr.text}</p>
                          {addr.landmark && (
                            <p className="text-[11px] text-stone-400 mt-0.5">Landmark: {addr.landmark}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Delivery Speed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Delivery Speed & Mode */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Select Delivery Mode</h4>
                <p className="text-xs text-stone-500">Fast neighborhood delivery directly from Shop 12</p>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    mode: '⚡ Express Delivery (30-40 Mins)',
                    sub: 'Dispatched immediately by local store staff with insulated bag',
                    badge: 'RECOMMENDED'
                  },
                  {
                    mode: 'Standard Evening Slot (6:00 PM – 8:30 PM)',
                    sub: 'Convenient evening delivery when you are back home from work',
                    badge: 'POPULAR'
                  },
                  {
                    mode: 'Self Pickup from Shop Counter (Shop 12)',
                    sub: 'Kept packed and checked ready for you at the front counter'
                  }
                ].map((opt) => (
                  <label
                    key={opt.mode}
                    className={`flex items-start justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                      deliveryMode === opt.mode
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliverySpeed"
                        checked={deliveryMode === opt.mode}
                        onChange={() => setDeliveryMode(opt.mode)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">{opt.mode}</span>
                        <p className="text-[11px] text-stone-500 mt-0.5">{opt.sub}</p>
                      </div>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Method & Place Order */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Select Payment Method</h4>
                <p className="text-xs text-stone-500">Pick from instant UPI, Cards, COD, or Kirana Khata Store Credit</p>
              </div>

              {/* Order Cost Pill */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Items Total ({cart.length} unique items):</span>
                  <span className="font-bold tabular-nums">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charges:</span>
                  <span className="font-bold tabular-nums">
                    {deliveryFee === 0 ? <span className="text-emerald-700 font-bold uppercase">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-black text-stone-900 text-sm pt-2 border-t border-stone-200">
                  <span>Final Amount to Pay:</span>
                  <span className="text-emerald-800 text-base tabular-nums">₹{cartFinalTotal}</span>
                </div>
              </div>

              {/* Payment Options List */}
              <div className="space-y-2 text-xs">
                {/* 1. UPI */}
                <label
                  className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                    paymentMethod.startsWith('UPI')
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod.startsWith('UPI')}
                      onChange={() => setPaymentMethod('UPI (Google Pay / PhonePe / Paytm)')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        UPI Instant (GPay / PhonePe / Paytm / BHIM)
                      </span>
                      <p className="text-[11px] text-stone-500">Zero surcharge, instant confirmation</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    FASTEST
                  </span>
                </label>

                {/* 2. Kirana Khata Store Credit */}
                <label
                  className={`flex items-start justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                    paymentMethod.includes('Kirana Khata')
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod.includes('Kirana Khata')}
                      onChange={() => setPaymentMethod('Kirana Khata (Store Credit)')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-950 text-xs sm:text-sm">
                          Kirana Khata / Monthly Store Credit
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 rounded">
                          KHATA
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Available Balance: <strong className="text-emerald-900">₹{user.khataBalance.toLocaleString('en-IN')}</strong> · Pay end of month
                      </p>
                    </div>
                  </div>
                </label>

                {/* 3. Cards */}
                <label
                  className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                    paymentMethod.startsWith('Credit / Debit')
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod.startsWith('Credit / Debit')}
                      onChange={() => setPaymentMethod('Credit / Debit Card (Visa, RuPay, Mastercard)')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        Credit / Debit Cards
                      </span>
                      <p className="text-[11px] text-stone-500">Visa, RuPay, Mastercard, Diners</p>
                    </div>
                  </div>
                </label>

                {/* 4. Cash on Delivery */}
                <label
                  className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-[11px] text-stone-500">Pay cash or scan QR when delivery boy arrives</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Khata Balance Warning if insufficient */}
              {paymentMethod.includes('Kirana Khata') && user.khataBalance < cartFinalTotal && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    Your current Khata balance (₹{user.khataBalance}) is lower than the order total (₹{cartFinalTotal}). Please select UPI or COD.
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleFinalOrderSubmit}
                  disabled={paymentMethod.includes('Kirana Khata') && user.khataBalance < cartFinalTotal}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-700/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Place Order & Confirm (₹{cartFinalTotal})</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
