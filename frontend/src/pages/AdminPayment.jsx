import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Banknote,
  Building2,
  CheckSquare,
  ChevronDown,
  Delete,
  MessageCircle,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { api, formatINR } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const QUICK = [500, 1000, 2000];

export default function AdminPayment() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [customer, setCustomer] = useState(null);
  const [mode, setMode] = useState(params.get('mode') === 'credit' ? 'credit' : 'payment');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [note, setNote] = useState('Festival settlement advance payment');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [groceryItem, setGroceryItem] = useState('Rice, Flour, Oil');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    else if (user?.role !== 'admin') navigate('/passbook');
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!id || user?.role !== 'admin') return;
    api(`/customers/${id}`)
      .then((d) => {
        setCustomer(d.customer);
        if (params.get('mode') !== 'credit' && d.customer.balanceDue > 0) {
          setAmount(String(Math.min(4000, d.customer.balanceDue)));
        }
      })
      .catch((err) => setError(err.message));
  }, [id, user]);

  const amountNum = Number(amount) || 0;
  const due = customer?.balanceDue || 0;

  const preview = useMemo(() => {
    if (mode === 'payment') {
      const next = Math.max(0, Math.round((due - amountNum) * 100) / 100);
      return { from: due, to: next, paid: amountNum };
    }
    const next = Math.round((due + amountNum) * 100) / 100;
    return { from: due, to: next, paid: amountNum };
  }, [mode, due, amountNum]);

  function addQuick(v) {
    setAmount(String((Number(amount) || 0) + v));
  }

  async function saveEntry() {
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (mode === 'payment') {
        await api('/transactions/payment', {
          method: 'POST',
          body: JSON.stringify({
            userId: id,
            amount: amountNum,
            note,
            paymentMode,
          }),
        });
      } else {
        await api('/transactions/credit', {
          method: 'POST',
          body: JSON.stringify({
            userId: id,
            amount: amountNum,
            groceryItem,
            note: note || 'Give Credit',
            paymentMode: 'credit',
          }),
        });
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!customer) {
    return (
      <div className="app-shell flex items-center justify-center text-muted">
        {t('loadingCustomer')}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="villageLedger" />

      <div className="px-4 space-y-4 mt-2 pb-28">
        <section className="card p-4 flex items-center justify-between gap-3 animate-rise">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center">
              {customer.initials}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate">{customer.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky text-brand text-[10px] font-bold px-2 py-0.5 mt-0.5">
                <BadgeCheck size={10} />
                {t('verifiedCustomer')}
              </span>
              <p className="text-xs text-muted mt-1 truncate">
                {customer.phoneFormatted} • Rampura
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold tracking-wide text-muted">{t('currentDue')}</p>
            <p className="text-xl font-bold text-due">{formatINR(due)}</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl shadow-sm animate-rise animate-rise-delay-1">
          <button
            type="button"
            onClick={() => setMode('credit')}
            className={`rounded-xl px-3 py-3 text-sm font-bold ${
              mode === 'credit' ? 'bg-sky text-brand' : 'text-muted'
            }`}
          >
            {t('giveCredit')}
          </button>
          <button
            type="button"
            onClick={() => setMode('payment')}
            className={`rounded-xl px-3 py-3 text-sm font-bold border ${
              mode === 'payment'
                ? 'border-brand text-brand bg-white'
                : 'border-transparent text-muted'
            }`}
          >
            {t('acceptPayment')}
          </button>
        </div>

        <div className="rounded-2xl bg-brand text-white px-4 py-3 flex items-center justify-between gap-2 animate-rise animate-rise-delay-1">
          <p className="text-xs font-bold tracking-wide">
            {mode === 'payment' ? t('balanceReduction') : t('balanceIncrease')}{' '}
            {formatINR(preview.from)} → {formatINR(preview.to)}
          </p>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap">
            {mode === 'payment'
              ? `${t('remainingDuePaid')} ${formatINR(preview.paid)}`
              : `${t('newDueCredit')} ${formatINR(preview.paid)}`}
          </span>
        </div>

        <section className="card p-4 space-y-3 animate-rise animate-rise-delay-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">
              {mode === 'payment' ? t('paymentAmount') : t('creditAmount')}
            </label>
            <span className="text-xs font-semibold text-brand">{t('zeroLedgerFee')}</span>
          </div>
          <div className="relative">
            <input
              className="input-field !pl-4 !pr-12 text-2xl font-bold"
              value={amount ? `₹ ${amount}` : ''}
              placeholder="₹ 0"
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^\d.]/g, ''))
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              onClick={() => setAmount('')}
            >
              <Delete size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => addQuick(v)}
                className="rounded-full bg-sky px-3 py-1.5 text-xs font-bold text-brand"
              >
                + ₹{v.toLocaleString('en-IN')}
              </button>
            ))}
            {mode === 'payment' && due > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(due))}
                className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand"
              >
                Full {formatINR(due)}
              </button>
            )}
          </div>
        </section>

        {mode === 'payment' && (
          <section className="animate-rise animate-rise-delay-2">
            <p className="text-sm font-semibold mb-2">{t('paymentMode')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: t('cash'), icon: Banknote },
                { id: 'upi', label: t('upi'), icon: QrCode },
                { id: 'bank', label: t('bankTransfer'), icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`rounded-2xl p-3 text-center text-[11px] font-bold ${
                      active ? 'bg-brand-soft text-brand' : 'bg-sky text-ink'
                    }`}
                  >
                    <Icon size={18} className="mx-auto mb-1" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3 animate-rise animate-rise-delay-3">
          <div className="relative">
            <input
              className="input-field !pl-4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
            />
          </div>
          {mode === 'credit' && (
            <input
              className="input-field !pl-4"
              value={groceryItem}
              onChange={(e) => setGroceryItem(e.target.value)}
              placeholder={t('groceryItems')}
            />
          )}
          <button
            type="button"
            className="w-full rounded-2xl bg-white shadow-sm px-4 py-3 text-sm flex items-center justify-between"
          >
            <span>
              {t('selectGrocery')}{' '}
              <span className="text-muted text-xs">{t('optional')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
              {t('showQuickItems')} <ChevronDown size={14} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSendReceipt((v) => !v)}
            className="card p-4 flex items-start gap-3 text-left w-full"
          >
            <CheckSquare
              size={20}
              className={sendReceipt ? 'text-brand' : 'text-muted'}
            />
            <div className="flex-1">
              <p className="text-sm font-bold">{t('sendReceipt')}</p>
              <p className="text-xs text-muted mt-1">{t('receiptHint')}</p>
            </div>
            <MessageCircle size={18} className="text-brand mt-0.5" />
          </button>
        </section>

        {error && (
          <p className="text-sm text-due bg-due-soft rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={saveEntry}
          className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} />
          {saving
            ? t('saving')
            : mode === 'payment'
              ? `${t('saveDeduct')} ${formatINR(amountNum || 0)}`
              : `${t('saveAdd')} ${formatINR(amountNum || 0)}`}
        </button>

        <p className="text-center text-[11px] text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-brand" />
          {t('encrypted')}
        </p>
      </div>

      <BottomNav active="/new-bill" />
    </div>
  );
}
