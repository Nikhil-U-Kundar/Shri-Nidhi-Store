import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Mic,
  Search,
  ShoppingBag,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { api, formatINR } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function Store() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { items, count, total, addItem, clear } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoCheckoutTried = useRef(false);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  async function load() {
    try {
      const catQs =
        category && category !== 'all' ? `&category=${encodeURIComponent(category)}` : '';
      const [c, p] = await Promise.all([
        api('/categories'),
        api(`/products?visible=true&q=${encodeURIComponent(q)}${catQs}`),
      ]);
      setCategories(c.categories);
      setProducts(p.products);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [category]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const totalVisible = useMemo(() => {
    if (category === 'all') {
      return categories.reduce((s, c) => s + (c.productCount || 0), 0) || products.length;
    }
    return products.length;
  }, [categories, category, products]);

  async function checkoutKhata() {
    if (!count) return;
    if (!isAuthenticated) {
      navigate('/login?next=/store&checkout=1');
      return;
    }
    if (user?.role !== 'customer') {
      setError(t('customerLoginToBuy'));
      return;
    }
    setCheckingOut(true);
    setCheckoutMsg('');
    setError('');
    try {
      const data = await api('/checkout/khata', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          note: 'Online storefront order',
        }),
      });
      clear();
      setCheckoutMsg(data.message || t('orderAddedToKhata'));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  // After login, resume checkout if cart still has items
  useEffect(() => {
    if (searchParams.get('checkout') !== '1') return;
    if (autoCheckoutTried.current) return;
    if (!isAuthenticated || user?.role !== 'customer' || count === 0) {
      if (searchParams.get('checkout') === '1') {
        const next = new URLSearchParams(searchParams);
        next.delete('checkout');
        setSearchParams(next, { replace: true });
      }
      return;
    }
    autoCheckoutTried.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    setSearchParams(next, { replace: true });
    checkoutKhata();
  }, [isAuthenticated, user, count, searchParams]);

  function stockBadge(p) {
    if (p.badgeText) return p.badgeText;
    if (p.isLowStock) return `${p.stockQuantity} left`;
    if (p.stockQuantity > 0) return t('inStock');
    return t('outOfStock');
  }

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="onlineDukan" showActive />

      <div className="mx-4 mt-1 rounded-xl bg-brand text-white px-3 py-2 flex items-center gap-2 text-[11px] sm:text-xs animate-rise">
        <Bell size={14} className="shrink-0 opacity-90" />
        <p className="flex-1 leading-snug">{t('welcomeBanner')}</p>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="shrink-0 font-bold underline underline-offset-2"
          >
            {t('signInTab')}
          </button>
        )}
      </div>

      <div className="px-4 space-y-4 mt-3 pb-36">
        <div className="relative animate-rise animate-rise-delay-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input-field !pl-10 !pr-11 bg-white shadow-sm"
            placeholder={t('searchStore')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Mic size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="chip-scroll animate-rise animate-rise-delay-1">
          <button
            type="button"
            className={`chip ${category === 'all' ? 'chip-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            {t('allProducts')} ({totalVisible})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${category === c.slug ? 'chip-active' : ''}`}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <section className="rounded-2xl bg-sky px-4 py-4 animate-rise animate-rise-delay-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="rounded-full bg-brand text-white text-[10px] font-bold px-2.5 py-1 tracking-wide">
              {t('villageDelivery')}
            </span>
            <span className="rounded-full bg-sky-deep text-ink text-[10px] font-bold px-2.5 py-1">
              {t('sameDay')}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink leading-snug">
            {t('deliveryHeadline')}
          </h3>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">{t('deliverySub')}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] font-semibold text-brand">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={13} /> {t('cashOnDelivery')}
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={13} /> {t('khataCredit')}
            </span>
          </div>
        </section>

        {(error || checkoutMsg) && (
          <p className={`text-sm font-semibold ${error ? 'text-due' : 'text-brand'}`}>
            {error || checkoutMsg}
          </p>
        )}

        <section>
          <div className="flex items-end justify-between gap-2 mb-3">
            <div>
              <h3 className="text-lg font-bold text-ink">{t('dailyEssentials')}</h3>
              <p className="text-xs text-muted">{t('dailyEssentialsSub')}</p>
            </div>
            <span className="rounded-full bg-slate-100 text-muted text-[11px] font-bold px-2.5 py-1">
              {products.length} {t('items')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => (
              <article key={p.id} className="card overflow-hidden flex flex-col">
                <div className="relative aspect-square bg-sky">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-brand font-bold">
                      SN
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.isLowStock ? 'bg-due-soft text-due' : 'bg-white/90 text-ink'
                    }`}
                  >
                    {stockBadge(p)}
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] text-muted font-semibold truncate">
                    {p.packLabel}
                    {p.categoryName ? ` • ${p.categoryName}` : ''}
                  </p>
                  <h4 className="font-bold text-ink text-sm mt-0.5 leading-snug line-clamp-2">
                    {p.name}
                  </h4>
                  <div className="mt-auto pt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-brand">
                      {formatINR(p.sellingPrice)}
                    </span>
                    {p.mrp != null && p.mrp > p.sellingPrice && (
                      <span className="text-xs text-muted line-through">{formatINR(p.mrp)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={p.stockQuantity <= 0}
                    onClick={() => addItem(p)}
                    className="btn-primary w-full mt-2.5 py-2.5 text-sm disabled:opacity-50"
                  >
                    + {t('add')}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!products.length && (
            <p className="text-sm text-muted text-center py-10">{t('noProducts')}</p>
          )}
        </section>

        <section className="rounded-2xl bg-sky px-4 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xs sm:text-sm text-ink leading-relaxed">
            <span className="font-bold">{t('qualityTitle')}</span> {t('qualitySub')}
          </p>
        </section>
      </div>

      {count > 0 && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 bottom-nav-shell px-3 z-40">
          <div className="rounded-2xl bg-[#1a2b3c] text-white px-3 py-2.5 flex items-center gap-3 shadow-lg">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-due text-[10px] font-bold flex items-center justify-center px-1">
                {count}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {count} {t('itemsSelected')} · {formatINR(total)}
              </p>
              <p className="text-[11px] text-emerald-300 font-semibold">
                {isAuthenticated && user?.role === 'customer'
                  ? t('khataReady')
                  : t('loginToCheckout')}
              </p>
            </div>
            <button
              type="button"
              disabled={checkingOut}
              onClick={checkoutKhata}
              className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2.5 text-xs font-bold"
            >
              {checkingOut
                ? t('saving')
                : isAuthenticated && user?.role === 'customer'
                  ? t('khataCheckout')
                  : t('signInToBuy')}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      <BottomNav active="/store" />
    </div>
  );
}
