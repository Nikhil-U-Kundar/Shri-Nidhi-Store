import { useState, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Plus, ShieldCheck, X } from 'lucide-react';
import { useCart } from '@/entities/cart';
import { useAuth } from '@/entities/user';
import { NewAddressForm } from '@/features/address-book';
import { SchedulePicker } from '@/features/schedule-picker';
import { useNavigation } from '@/shared/lib/navigation';
import { Modal } from '@/shared/ui/Modal';
import { usePlaceOrder } from '../model/usePlaceOrder';
import { checkoutApi, newCheckoutSessionId, type CheckoutDetails, type CheckoutStep } from '@/entities/checkout';
import { useToast } from '@/shared/ui/toast';
import { PaymentGatewayModal, type GatewayRequest } from './PaymentGatewayModal';

const STEPS = ['Contact', 'Address', 'Delivery', 'Payment'] as const;

const DELIVERY_MODES = [
  {
    mode: 'Scheduled Home Delivery',
    sub: 'Pre-book at least 24 hours ahead and pick a delivery time slot',
    badge: 'RECOMMENDED',
  },
  {
    mode: 'Self Pickup from Shop Counter (Shop 12)',
    sub: 'Collect your packed order at the front counter in your chosen slot',
    badge: '',
  },
] as const;

const UPI_METHOD = 'UPI (Google Pay / PhonePe / Paytm)';
const CARD_METHOD = 'Credit / Debit Card (Visa, RuPay, Mastercard)';
const KHATA_METHOD = 'Kirana Khata (Store Credit)';
const COD_METHOD = 'Cash on Delivery';
const FALLBACK_ADDRESS = 'Sector 14 Main Market, Gurugram';

const INPUT_CLASS = 'w-full rounded-xl border border-stone-200 p-2.5 focus:border-emerald-600 focus:outline-none';
const PRIMARY_BUTTON = 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 sm:text-sm';
const BACK_BUTTON = 'flex cursor-pointer items-center gap-1 rounded-xl bg-stone-100 px-4 py-3 text-xs font-bold text-stone-700 hover:bg-stone-200';

/** Four-step express checkout: contact, address, delivery mode, payment. */
export function CheckoutModal() {
  const { isCheckoutOpen, setCheckoutOpen, setCartOpen, setCustomerTab } = useNavigation();
  const { items, totals } = useCart();
  const { isLoggedIn, user, setLoginOpen } = useAuth();
  const placeOrder = usePlaceOrder();
  const { addToast } = useToast();
  // One id per checkout attempt, so every step of this attempt is stored together.
  const [sessionId] = useState(newCheckoutSessionId);

  /** Save a checkout step. A failed save is reported, so the shopper knows it was not recorded. */
  const recordStep = (step: CheckoutStep, details: CheckoutDetails) => {
    checkoutApi.saveStep(sessionId, step, details).catch(() => addToast('Could not save this checkout step', 'error'));
  };

  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState(user.name);
  const [customerPhone, setCustomerPhone] = useState(user.phone);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<string>(DELIVERY_MODES[0].mode);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleSlotId, setScheduleSlotId] = useState('');
  const scheduleReady = Boolean(scheduleDate && scheduleSlotId);
  const [paymentMethod, setPaymentMethod] = useState<string>(UPI_METHOD);
  const [gateway, setGateway] = useState<GatewayRequest | null>(null);

  if (!isCheckoutOpen && !gateway) return null;

  const close = () => setCheckoutOpen(false);
  const khataInsufficient = paymentMethod === KHATA_METHOD && user.khataBalance < totals.finalTotal;
  const chosenAddress =
    user.addresses.find((a) => a.id === selectedAddressId) ?? user.addresses[0];

  const submit = () => {
    const request = {
      deliveryAddress: chosenAddress?.text || FALLBACK_ADDRESS,
      deliveryMode,
      deliveryDate: scheduleDate,
      deliveryTimeSlot: scheduleSlotId,
      paymentMethod,
      customerName: customerName || user.name,
      customerPhone: customerPhone || user.phone,
    };

    recordStep('payment', {
      paymentMethod,
      deliveryAddress: request.deliveryAddress,
      deliveryMode,
      deliveryDate: scheduleDate,
      deliverySlotId: scheduleSlotId,
      contactName: request.customerName,
      contactPhone: request.customerPhone,
      itemsTotal: totals.subtotal,
      orderTotal: totals.finalTotal,
    });

    if (paymentMethod === UPI_METHOD || paymentMethod === CARD_METHOD) {
      setCheckoutOpen(false);
      setGateway({ ...request, amount: totals.finalTotal });
      return;
    }

    placeOrder(request)
      .then((order) => {
        recordStep('placed', { orderNumber: order.id });
        setCheckoutOpen(false);
        setCustomerTab('tracking');
      })
      .catch(() => {
        /* the failure toast is raised inside placeOrder */
      });
  };

  const paymentOptions: { method: string; title: string; detail: ReactNode; badge?: string }[] = [
    { method: UPI_METHOD, title: 'UPI Instant (GPay / PhonePe / Paytm / BHIM)', detail: 'Zero surcharge, instant confirmation', badge: 'FASTEST' },
    {
      method: KHATA_METHOD,
      title: 'Kirana Khata / Monthly Store Credit',
      detail: (
        <>
          Available Balance: <strong className="text-emerald-900">₹{user.khataBalance.toLocaleString('en-IN')}</strong> · Pay end of month
        </>
      ),
      badge: 'KHATA',
    },
    { method: CARD_METHOD, title: 'Credit / Debit Cards', detail: 'Visa, RuPay, Mastercard, Diners' },
    { method: COD_METHOD, title: 'Cash on Delivery (COD)', detail: 'Pay cash or scan QR when delivery boy arrives' },
  ];

  return (
    <>
      {isCheckoutOpen && (
        <Modal label="Express checkout" onClose={close} size="sm:max-w-2xl">
          <header className="flex items-center justify-between bg-stone-900 p-4 text-white sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold sm:text-base">Sri Nidhi Express Checkout</h3>
                <p className="text-xs text-stone-400">
                  Step <span className="font-bold text-emerald-400">{step}</span> of {STEPS.length} · Same day dispatch
                </p>
              </div>
            </div>
            <button type="button" onClick={close} className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white" aria-label="Close checkout">
              <X className="h-5 w-5" />
            </button>
          </header>

          <ol className="grid grid-cols-4 divide-x divide-stone-200 border-b border-stone-200 bg-stone-50 text-center text-[11px] font-semibold sm:text-xs">
            {STEPS.map((label, idx) => {
              const number = idx + 1;
              const isCurrent = number === step;
              const isDone = number < step;
              return (
                <li
                  key={label}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`py-3 transition ${
                    isCurrent
                      ? 'border-b-2 border-emerald-600 bg-emerald-50 font-bold text-emerald-800'
                      : isDone
                        ? 'bg-white font-medium text-emerald-700'
                        : 'text-stone-400'
                  }`}
                >
                  {number}. {label}
                </li>
              );
            })}
          </ol>

          <div className="space-y-4 p-5 text-xs sm:p-6 sm:text-sm">
            {step === 1 && (
              <section className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Customer Verification</h4>
                  <p className="text-xs text-stone-500">
                    We use your phone number to coordinate 30-min doorstep delivery and share order updates.
                  </p>
                </div>

                {isLoggedIn ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-900">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Logged In Customer</span>
                      <p className="text-sm font-black text-stone-900">{user.name}</p>
                      <p className="mt-0.5 break-words text-xs text-stone-600">{user.phone} · {user.email}</p>
                      <p className="mt-2 text-xs font-bold text-emerald-800">
                        Kirana Khata Balance: ₹{user.khataBalance.toLocaleString('en-IN')} (Eligible for 0-click credit)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold">Guest Checkout Mode</p>
                        <p className="mt-0.5 text-[11px] text-amber-800">
                          You can continue as a guest, or sign in to use Khata credit and saved addresses.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLoginOpen(true)}
                        className="cursor-pointer self-start whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                      >
                        Sign In
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="checkout-name" className="mb-1 block font-semibold text-stone-700">Your Full Name *</label>
                        <input id="checkout-name" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Ramesh Verma" className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label htmlFor="checkout-phone" className="mb-1 block font-semibold text-stone-700">Mobile Number (For Delivery SMS) *</label>
                        <input id="checkout-phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" className={INPUT_CLASS} />
                      </div>
                    </div>
                  </div>
                )}

                <button type="button" onClick={() => { recordStep('contact', { contactName: customerName, contactPhone: customerPhone }); setStep(2); }} className={`${PRIMARY_BUTTON} w-full`}>
                  <span>Continue to Address Selection</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Select Sector 14 Delivery Address</h4>
                    <p className="text-xs text-stone-500">Pick where you want our delivery boy to bring the groceries</p>
                  </div>
                  {!showNewAddress && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(true)}
                      className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Address</span>
                    </button>
                  )}
                </div>

                {showNewAddress ? (
                  <NewAddressForm
                    defaultTitle="Home"
                    withLandmark
                    submitLabel="Save & Use This Address"
                    onCancel={() => setShowNewAddress(false)}
                    onSaved={(saved) => {
                      setSelectedAddressId(saved.id);
                      setShowNewAddress(false);
                    }}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {user.addresses.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone-500">
                        No saved addresses yet. Add one to continue.
                      </p>
                    )}
                    {user.addresses.map((addr) => {
                      const isSelected = chosenAddress?.id === addr.id;
                      return (
                        <label
                          key={addr.id}
                          className={`block cursor-pointer rounded-2xl border p-3.5 transition ${
                            isSelected ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="checkoutAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 accent-emerald-600"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-900">{addr.title}</span>
                                {addr.isDefault && (
                                  <span className="rounded bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-800">DEFAULT</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-stone-600">{addr.text}</p>
                              {addr.landmark && <p className="mt-0.5 text-[11px] text-stone-400">Landmark: {addr.landmark}</p>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {!showNewAddress && (
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setStep(1)} className={BACK_BUTTON}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                    <button type="button" onClick={() => { recordStep('address', { deliveryAddress: chosenAddress?.text ?? '' }); setStep(3); }} className={PRIMARY_BUTTON}>
                      <span>Continue to Delivery Speed</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Schedule Your Delivery</h4>
                  <p className="text-xs text-stone-500">Choose how you want to receive your order, then a date and time slot</p>
                </div>

                <div className="space-y-2.5">
                  {DELIVERY_MODES.map((opt) => (
                    <OptionCard key={opt.mode} selected={deliveryMode === opt.mode}>
                      <label className="flex cursor-pointer items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <input
                            type="radio"
                            name="deliverySpeed"
                            checked={deliveryMode === opt.mode}
                            onChange={() => setDeliveryMode(opt.mode)}
                            className="mt-1 accent-emerald-600"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 sm:text-sm">{opt.mode}</span>
                            <p className="mt-0.5 text-[11px] text-stone-500">{opt.sub}</p>
                          </div>
                        </div>
                        {opt.badge && (
                          <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900">{opt.badge}</span>
                        )}
                      </label>
                    </OptionCard>
                  ))}
                </div>

                <SchedulePicker
                  date={scheduleDate}
                  slotId={scheduleSlotId}
                  onChange={({ date, slotId }) => {
                    setScheduleDate(date);
                    setScheduleSlotId(slotId);
                  }}
                />

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(2)} className={BACK_BUTTON}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { recordStep('delivery', { deliveryMode, deliveryDate: scheduleDate, deliverySlotId: scheduleSlotId }); setStep(4); }}
                    disabled={!scheduleReady}
                    className={`${PRIMARY_BUTTON} disabled:cursor-not-allowed disabled:bg-stone-300`}
                    >
                    <span>Continue to Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Select Payment Method</h4>
                  <p className="text-xs text-stone-500">Pick from instant UPI, Cards, COD, or Kirana Khata Store Credit</p>
                </div>

                <dl className="space-y-1.5 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <dt>Items Total ({items.length} unique items):</dt>
                    <dd className="font-bold tabular-nums">₹{totals.subtotal}</dd>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <dt>Delivery Charges:</dt>
                    <dd className="font-bold tabular-nums">
                      {totals.deliveryFee === 0 ? <span className="uppercase text-emerald-700">FREE</span> : `₹${totals.deliveryFee}`}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-black text-stone-900">
                    <dt>Final Amount to Pay:</dt>
                    <dd className="text-base text-emerald-800 tabular-nums">₹{totals.finalTotal}</dd>
                  </div>
                </dl>

                <div className="space-y-2">
                  {paymentOptions.map((opt) => (
                    <OptionCard key={opt.method} selected={paymentMethod === opt.method}>
                      <label className="flex cursor-pointer items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={paymentMethod === opt.method}
                            onChange={() => setPaymentMethod(opt.method)}
                            className="mt-1 accent-emerald-600"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 sm:text-sm">{opt.title}</span>
                            <p className="mt-0.5 text-[11px] text-stone-500">{opt.detail}</p>
                          </div>
                        </div>
                        {opt.badge && (
                          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800">{opt.badge}</span>
                        )}
                      </label>
                    </OptionCard>
                  ))}
                </div>

                {khataInsufficient && (
                  <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>
                      Your current Khata balance (₹{user.khataBalance}) is lower than the order total (₹{totals.finalTotal}). Please select UPI or COD.
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(3)} className={BACK_BUTTON}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={khataInsufficient || items.length === 0}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:text-sm"
                  >
                    <span>Place Order &amp; Confirm (₹{totals.finalTotal})</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}
          </div>
        </Modal>
      )}

      {gateway && (
        <PaymentGatewayModal
          request={gateway}
          onClose={() => setGateway(null)}
          onPaid={async (request) => {
            const order = await placeOrder(request);
            recordStep('placed', { orderNumber: order.id });
            setGateway(null);
            setCustomerTab('tracking');
          }}
          onRetry={() => {
            setGateway(null);
            setCheckoutOpen(true);
          }}
          onReturnToCart={() => {
            setGateway(null);
            setCartOpen(true);
          }}
        />
      )}
    </>
  );
}

function OptionCard({ selected, children }: { selected: boolean; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 transition ${
        selected ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      {children}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SN';
}
