import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Send,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { api, formatINR } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [reminderMsg, setReminderMsg] = useState('');
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/passbook');
    }
  }, [isAuthenticated, user, navigate]);

  async function load() {
    try {
      const [s, c] = await Promise.all([
        api('/admin/summary'),
        api(`/admin/customers?filter=${filter}&q=${encodeURIComponent(q)}`),
      ]);
      setSummary(s);
      setCustomers(c.customers);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [filter, user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const counts = useMemo(() => {
    return {
      all: summary?.customerCount || customers.length,
      pending: summary?.pendingCount || customers.filter((c) => c.status === 'pending').length,
    };
  }, [summary, customers]);

  async function addCustomer(e) {
    e.preventDefault();
    try {
      await api('/admin/customers', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendReminder(customerId) {
    setSendingId(customerId);
    setReminderMsg('');
    setError('');
    try {
      const data = await api(`/customers/${customerId}/reminder`, {
        method: 'POST',
      });
      // Push notification to customer's phone via WhatsApp
      if (data.whatsappHref) {
        window.open(data.whatsappHref, '_blank', 'noopener,noreferrer');
      } else if (data.smsHref) {
        window.location.href = data.smsHref;
      }
      setReminderMsg(
        `${t('reminderSent')} ${data.customerName} (${data.phone})`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="customerLedger" />

      <div className="px-4 space-y-4 mt-2 pb-24">
        <section className="card p-4 animate-rise">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-due">
                <Wallet size={16} />
                {t('totalOutstanding')}
              </div>
              <p className="text-3xl font-bold text-due mt-1">
                {formatINR(summary?.totalOutstanding || 0)}
              </p>
              <p className="text-xs text-muted mt-1">
                ({summary?.customerCount || 0} {t('customers')})
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-due-soft flex items-center justify-center">
              <TrendingUp className="text-due" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl bg-sky p-3">
              <div className="flex items-center gap-1.5 text-brand text-xs font-semibold">
                <ArrowDownLeft size={14} />
                {t('todaysReceived')}
              </div>
              <p className="text-lg font-bold text-brand mt-1">
                {formatINR(summary?.todayReceived || 0)}
              </p>
              <p className="text-[11px] text-muted">{t('collectedToday')}</p>
            </div>
            <div className="rounded-2xl bg-[#f3e8ff] p-3">
              <div className="flex items-center gap-1.5 text-due text-xs font-semibold">
                <ArrowUpRight size={14} />
                {t('todaysCredit')}
              </div>
              <p className="text-lg font-bold text-due mt-1">
                {formatINR(summary?.todayCredit || 0)}
              </p>
              <p className="text-[11px] text-muted">{t('givenToday')}</p>
            </div>
          </div>
        </section>

        <div className="relative animate-rise animate-rise-delay-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-2xl bg-white shadow-sm border border-slate-100 py-3 pl-10 pr-4 text-sm outline-none"
            placeholder={t('searchCustomer')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 animate-rise animate-rise-delay-1">
          {[
            { id: 'all', label: `${t('allCustomers')} (${counts.all})` },
            { id: 'pending', label: `${t('pending')} (${counts.pending})` },
            { id: 'clear', label: t('completed') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-white text-muted shadow-sm'
              }`}
            >
              {tab.id === 'pending' && filter !== 'pending' && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-due mr-1.5 align-middle" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-due bg-due-soft rounded-xl px-3 py-2">{error}</p>
        )}
        {reminderMsg && (
          <p className="text-sm text-brand bg-brand-soft rounded-xl px-3 py-2">{reminderMsg}</p>
        )}

        <div className="space-y-3">
          {customers.map((c, idx) => (
            <article
              key={c.id}
              className={`card p-4 animate-rise`}
              style={{ animationDelay: `${0.05 * idx}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center">
                      {c.initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                        c.status === 'pending' ? 'bg-due' : 'bg-brand'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink truncate">{c.name}</h3>
                    <p className="text-xs text-muted">{c.phoneMasked}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-lg font-bold ${
                      c.balanceDue > 0 ? 'text-due' : 'text-brand'
                    }`}
                  >
                    {formatINR(c.balanceDue)}
                  </p>
                  <span
                    className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.balanceDue > 0
                        ? 'bg-due-soft text-due'
                        : 'bg-sky text-brand'
                    }`}
                  >
                    {c.balanceDue > 0 ? t('dueBalance') : t('allClear')}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-muted flex items-center justify-between gap-2">
                <span className="truncate">{c.recentActivity}</span>
                {c.status === 'pending' && (
                  <button
                    type="button"
                    disabled={sendingId === c.id}
                    onClick={() => sendReminder(c.id)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-due shadow-sm disabled:opacity-60"
                  >
                    <Send size={10} />
                    {sendingId === c.id ? t('sendingReminder') : t('sendReminder')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link
                  to={`/admin/payment/${c.id}?mode=credit`}
                  className="rounded-xl bg-sky text-brand text-center text-xs font-bold py-2.5"
                >
                  {t('giveCredit')}
                </Link>
                <Link
                  to={`/admin/payment/${c.id}?mode=payment`}
                  className={`rounded-xl text-center text-xs font-bold py-2.5 ${
                    c.balanceDue > 0
                      ? 'bg-brand text-white'
                      : 'bg-sky text-brand'
                  }`}
                >
                  {c.balanceDue > 0 ? t('takePayment') : t('advancePay')}
                </Link>
              </div>
            </article>
          ))}
          {!customers.length && (
            <p className="text-center text-sm text-muted py-8">{t('noCustomers')}</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[min(440px,100%)] px-4 z-30">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={18} />
          {t('addNewCustomer')}
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <form
            onSubmit={addCustomer}
            className="w-[min(440px,100%)] bg-white rounded-t-3xl p-5 space-y-3"
          >
            <h3 className="text-lg font-bold">{t('addCustomer')}</h3>
            <input
              className="input-field !px-4"
              placeholder={t('fullName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input-field !px-4"
              placeholder={t('email')}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="input-field !px-4"
              placeholder={t('phone')}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl bg-slate-100 py-3 text-sm font-bold"
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn-primary py-3 text-sm">
                {t('saveCustomer')}
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomNav active="/admin" />
    </div>
  );
}
