import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Phone,
  ShoppingBasket,
  Wallet,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { api, formatEntryTime, formatINR } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Passbook() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [shopPhone, setShopPhone] = useState('8970128830');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    Promise.all([
      api(`/customers/${user.id}/passbook`),
      api('/auth/shop-info').catch(() => ({ ownerPhone: '8970128830' })),
    ])
      .then(([passbook, shop]) => {
        setData(passbook);
        setShopPhone(shop.ownerPhone || '8970128830');
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (!data) {
    return (
      <div className="app-shell flex items-center justify-center text-muted">
        {error || t('loadingPassbook')}
      </div>
    );
  }

  const { customer, summary, entries } = data;

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="villageKhata" />

      <div className="px-4 space-y-4 mt-2 pb-8">
        <section className="card p-4 flex items-center justify-between gap-3 animate-rise">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center">
              {customer.initials}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate">{customer.name}</h2>
              <p className="text-xs text-muted">{t('customerRole')}</p>
            </div>
          </div>
          <a
            href={`tel:${shopPhone}`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand text-white text-xs font-bold px-3 py-2.5"
          >
            <Phone size={14} />
            {t('callShopkeeper')}
          </a>
        </section>

        <section className="card p-3 space-y-3 animate-rise animate-rise-delay-1">
          <div className="rounded-2xl bg-due-soft p-4">
            <p className="text-[11px] font-bold tracking-wide text-due flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-due" />
              {t('totalBalanceToPay')}
            </p>
            <p className="text-3xl font-bold text-due mt-1">
              {formatINR(summary.balanceDue)}
            </p>
            <p className="text-xs text-muted mt-1">{t('remainingDue')}</p>
          </div>
          <div className="rounded-2xl bg-brand-soft p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {t('totalPaidTillNow')}{' '}
                <span className="text-brand font-bold text-lg ml-1">
                  {formatINR(summary.totalPaid)}
                </span>
              </p>
              <p className="text-xs text-muted mt-1">{t('totalPaymentsMade')}</p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between animate-rise animate-rise-delay-2">
          <h3 className="font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-brand" />
            {t('passbookEntries')}
          </h3>
          <button
            type="button"
            className="rounded-full bg-sky px-3 py-1.5 text-xs font-bold text-brand"
          >
            {t('statement')}
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const isPayment = entry.type === 'payment';
            return (
              <article
                key={entry.id}
                className="card p-4 animate-rise"
                style={{ animationDelay: `${0.06 * idx}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted">{formatEntryTime(entry.date)}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isPayment
                        ? 'bg-brand-soft text-brand'
                        : 'bg-due-soft text-due'
                    }`}
                  >
                    {isPayment ? t('paid') : t('creditPurchase')}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                      isPayment ? 'bg-brand-soft text-brand' : 'bg-due-soft text-due'
                    }`}
                  >
                    {isPayment ? <Wallet size={18} /> : <ShoppingBasket size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{entry.title}</h4>
                    <p
                      className={`text-xs mt-0.5 line-clamp-2 ${
                        isPayment ? 'text-muted' : 'text-due'
                      }`}
                    >
                      {entry.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold ${
                        isPayment ? 'text-brand' : 'text-due'
                      }`}
                    >
                      {isPayment ? '-' : '+'}
                      {formatINR(entry.amount)}
                    </p>
                    <p
                      className={`text-[10px] ${
                        isPayment ? 'text-muted' : 'text-due'
                      }`}
                    >
                      {isPayment ? t('payment') : t('addedToKhata')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-sky px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-muted">{t('balanceAfter')}</span>
                  <span
                    className={`font-bold ${
                      entry.balanceAfter > 0 ? 'text-due' : 'text-brand'
                    }`}
                  >
                    {formatINR(entry.balanceAfter)}
                    {entry.balanceAfter > 0 ? ` ${t('due')}` : ''}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <section className="rounded-2xl bg-sky p-4 flex items-start gap-3 animate-rise">
          <div className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">{t('accountsVerified')}</p>
            <p className="text-xs text-muted mt-1">{t('verifiedPassbook')}</p>
          </div>
        </section>
      </div>

      <BottomNav active="/passbook" />
    </div>
  );
}
