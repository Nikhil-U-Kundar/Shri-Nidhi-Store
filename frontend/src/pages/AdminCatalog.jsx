import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Camera,
  Download,
  List,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { api, formatINR } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PACK_PRESETS = ['10 kg Bag', '1 kg', '500g', '1 Litre', '1 Piece'];

const emptyForm = {
  name: '',
  brand: '',
  categoryId: '',
  imageUrl: '',
  packLabel: '10 kg Bag',
  sellingPrice: '',
  wholesaleCost: '',
  stockQuantity: 25,
  isVisible: true,
};

function formatCatalogValue(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return formatINR(n);
}

export default function AdminCatalog() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [customPack, setCustomPack] = useState(false);
  const [editPriceId, setEditPriceId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [restockQty, setRestockQty] = useState({});
  const [logPreview, setLogPreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/store');
    }
  }, [isAuthenticated, user, navigate]);

  async function load() {
    try {
      const [s, c, p] = await Promise.all([
        api('/admin/catalog/summary'),
        api('/categories'),
        api(`/products?q=${encodeURIComponent(q)}`),
      ]);
      setSummary(s);
      setCategories(c.categories);
      setProducts(p.products);
      setError('');
      if (!form.categoryId && c.categories.length) {
        setForm((f) => ({ ...f, categoryId: c.categories[0].id }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const margin = useMemo(() => {
    const sell = Number(form.sellingPrice) || 0;
    const cost = Number(form.wholesaleCost) || 0;
    const abs = Math.round((sell - cost) * 100) / 100;
    const pct = sell > 0 ? Math.round(((sell - cost) / sell) * 1000) / 10 : 0;
    return { abs, pct };
  }, [form.sellingPrice, form.wholesaleCost]);

  function onImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Image must be under 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, imageUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  }

  async function publishProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOkMsg('');
    try {
      await api('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          categoryId: form.categoryId || null,
          imageUrl: form.imageUrl,
          packLabel: form.packLabel,
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.sellingPrice) > 0 ? Math.round(Number(form.sellingPrice) * 1.08) : null,
          wholesaleCost: Number(form.wholesaleCost) || 0,
          stockQuantity: Number(form.stockQuantity) || 0,
          isVisible: form.isVisible,
        }),
      });
      setOkMsg(t('productPublished'));
      setForm({
        ...emptyForm,
        categoryId: categories[0]?.id || '',
        packLabel: '10 kg Bag',
      });
      setCustomPack(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock(productId, delta, reason = 'adjust') {
    try {
      await api(`/admin/products/${productId}/stock`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePrice(productId) {
    try {
      await api(`/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sellingPrice: Number(editPrice) }),
      });
      setEditPriceId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function restock(productId) {
    const qty = Number(restockQty[productId] || 0);
    if (qty <= 0) return;
    await adjustStock(productId, qty, 'restock');
    setRestockQty((r) => ({ ...r, [productId]: 1 }));
  }

  async function showLogs(productId, productName) {
    try {
      const data = await api(`/admin/products/${productId}/stock-logs`);
      setLogPreview({ name: productName, logs: data.logs });
    } catch (err) {
      setError(err.message);
    }
  }

  function exportCsv() {
    const header = 'name,brand,category,pack,price,cost,stock,visible\n';
    const rows = products
      .map((p) =>
        [p.name, p.brand, p.categoryName, p.packLabel, p.sellingPrice, p.wholesaleCost, p.stockQuantity, p.isVisible]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shree-nidhi-catalog.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="onlineDukan" showActive />

      <div className="px-4 space-y-4 mt-1 pb-28">
        <div className="flex items-start justify-between gap-3 animate-rise">
          <div>
            <p className="text-[11px] font-semibold text-brand flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              {t('liveSyncActive')}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mt-0.5">
              {t('adminCatalogTitle')}
            </h2>
            <p className="text-xs text-muted mt-0.5">{t('adminCatalogSub')}</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="shrink-0 h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-muted"
            title="Export CSV"
          >
            <Download size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-rise animate-rise-delay-1">
          <div className="card p-3">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wide">{t('statActive')}</span>
              <List size={14} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-ink mt-1">{summary?.activeCount ?? '—'}</p>
            <p className="text-[11px] text-muted">{t('products')}</p>
          </div>
          <div className="card p-3">
            <div className="flex items-center justify-between text-due">
              <span className="text-[10px] font-bold uppercase tracking-wide">{t('statLowOut')}</span>
              <AlertTriangle size={14} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-due mt-1">{summary?.lowStockCount ?? '—'}</p>
            <p className="text-[11px] text-muted">{t('restock')}</p>
          </div>
          <div className="card p-3">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wide">{t('statValue')}</span>
              <Building2 size={14} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-ink mt-1">
              {summary ? formatCatalogValue(summary.catalogValue) : '—'}
            </p>
            <p className="text-[11px] text-muted">{t('catalog')}</p>
          </div>
        </div>

        {(error || okMsg) && (
          <p className={`text-sm font-semibold ${error ? 'text-due' : 'text-brand'}`}>
            {error || okMsg}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <form onSubmit={publishProduct} className="card p-4 space-y-4 animate-rise animate-rise-delay-2">
            <div>
              <h3 className="font-bold text-ink">{t('addNewItem')}</h3>
              <p className="text-xs text-muted mt-0.5">{t('addNewItemSub')}</p>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-sky/40 py-8 flex flex-col items-center gap-2 text-center"
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="h-28 w-28 object-cover rounded-xl" />
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-brand shadow-sm">
                    <Camera size={22} />
                  </div>
                  <p className="text-sm font-semibold text-ink px-4">{t('tapToUpload')}</p>
                  <p className="text-[11px] text-muted px-6">{t('uploadHint')}</p>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImageFile} />

            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                {t('productTitleBrand')}
              </label>
              <input
                className="input-field !px-4 mt-1.5"
                placeholder="Chakki Fresh Atta (10kg)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                {t('category')}
              </label>
              <div className="chip-scroll mt-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${form.categoryId === c.id ? 'chip-active' : ''}`}
                    onClick={() => setForm({ ...form, categoryId: c.id })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                {t('packWeight')}
              </label>
              <div className="chip-scroll mt-2">
                {PACK_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${!customPack && form.packLabel === p ? 'chip-active' : ''}`}
                    onClick={() => {
                      setCustomPack(false);
                      setForm({ ...form, packLabel: p });
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip ${customPack ? 'chip-active' : ''}`}
                  onClick={() => setCustomPack(true)}
                >
                  + Custom
                </button>
              </div>
              {customPack && (
                <input
                  className="input-field !px-4 mt-2"
                  placeholder="e.g. 2 kg Tin"
                  value={form.packLabel}
                  onChange={(e) => setForm({ ...form, packLabel: e.target.value })}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                  {t('sellingPrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field !px-4 mt-1.5"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                  {t('wholesaleCost')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field !px-4 mt-1.5"
                  value={form.wholesaleCost}
                  onChange={(e) => setForm({ ...form, wholesaleCost: e.target.value })}
                />
              </div>
            </div>

            <div className="rounded-xl bg-brand-soft px-3 py-2.5 text-sm font-semibold text-brand">
              {t('expectedMargin')}: +{formatINR(margin.abs)} / unit ({margin.pct}%)
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide">
                {t('initialStock')}
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  className="h-11 w-11 rounded-xl bg-sky flex items-center justify-center"
                  onClick={() =>
                    setForm({ ...form, stockQuantity: Math.max(0, Number(form.stockQuantity) - 1) })
                  }
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold w-12 text-center">{form.stockQuantity}</span>
                <button
                  type="button"
                  className="h-11 w-11 rounded-xl bg-sky flex items-center justify-center"
                  onClick={() =>
                    setForm({ ...form, stockQuantity: Number(form.stockQuantity) + 1 })
                  }
                >
                  <Plus size={16} />
                </button>
                <span className="text-xs text-muted">{t('readyForDelivery')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-sky/60 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-ink">{t('customerStorefront')}</p>
                <p className="text-[11px] text-muted">{t('visibleInstantly')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isVisible}
                onClick={() => setForm({ ...form, isVisible: !form.isVisible })}
                className={`relative h-7 w-12 rounded-full transition ${
                  form.isVisible ? 'bg-brand' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    form.isVisible ? 'left-5.5' : 'left-0.5'
                  }`}
                  style={{ left: form.isVisible ? '22px' : '2px' }}
                />
              </button>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 text-sm">
              {saving
                ? t('saving')
                : `${t('publishProduct')} • ${formatINR(Number(form.sellingPrice) || 0)}`}
            </button>
          </form>

          <section className="space-y-3 animate-rise animate-rise-delay-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h3 className="font-bold text-ink text-lg">{t('liveInventory')}</h3>
                <p className="text-xs text-muted">{t('liveInventorySub')}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-1">
                {summary?.activeCount ?? products.length} {t('inCatalog')}
              </span>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input-field !pl-10 !pr-12"
                placeholder={t('searchInventory')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <SlidersHorizontal
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>

            <div className="space-y-3">
              {products.map((p) => {
                const low = p.isLowStock;
                const unitWord = (p.packLabel || '').toLowerCase().includes('litre')
                  ? 'pouches'
                  : (p.packLabel || '').toLowerCase().includes('kg')
                    ? 'bags'
                    : 'packets';
                return (
                  <article key={p.id} className="card p-3 flex gap-3">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-sky shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand text-xs font-bold">
                          SN
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-black/55 text-white text-[9px] font-bold px-1.5 py-0.5">
                        {p.packLabel}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-ink text-sm truncate">{p.name}</h4>
                          <p className="text-[11px] text-muted truncate">
                            {p.packLabel}
                            {p.categoryName ? ` · ${p.categoryName}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {editPriceId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className="w-20 rounded-lg border border-brand/30 px-2 py-1 text-sm font-bold"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="text-[10px] font-bold text-brand"
                                onClick={() => savePrice(p.id)}
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-bold text-ink"
                              onClick={() => {
                                setEditPriceId(p.id);
                                setEditPrice(String(p.sellingPrice));
                              }}
                            >
                              {formatINR(p.sellingPrice)}
                              <Pencil size={12} className="text-muted" />
                            </button>
                          )}
                          <div
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              low ? 'bg-due-soft text-due' : 'bg-brand-soft text-brand'
                            }`}
                          >
                            {low ? `${t('low')} (${p.stockQuantity} left)` : t('inStock')}
                          </div>
                        </div>
                      </div>

                      {low ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted">{t('orderMore')}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-sky flex items-center justify-center"
                              onClick={() =>
                                setRestockQty((r) => ({
                                  ...r,
                                  [p.id]: Math.max(1, (r[p.id] || 3) - 1),
                                }))
                              }
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold w-6 text-center">
                              {restockQty[p.id] ?? 3}
                            </span>
                            <button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-sky flex items-center justify-center"
                              onClick={() =>
                                setRestockQty((r) => ({
                                  ...r,
                                  [p.id]: (r[p.id] || 3) + 1,
                                }))
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => restock(p.id)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-due text-white text-xs font-bold px-3 py-2"
                          >
                            <ShoppingCart size={14} />
                            {t('restock')}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted">{t('stockCount')}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-sky flex items-center justify-center"
                              onClick={() => adjustStock(p.id, -1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold min-w-16 text-center">
                              {p.stockQuantity} {unitWord}
                            </span>
                            <button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-sky flex items-center justify-center"
                              onClick={() => adjustStock(p.id, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="ml-auto rounded-xl bg-slate-100 text-ink text-xs font-bold px-3 py-2"
                            onClick={() => showLogs(p.id, p.name)}
                          >
                            {t('log')}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {!products.length && (
                <p className="text-sm text-muted text-center py-8">{t('noProducts')}</p>
              )}
            </div>

            <div className="rounded-2xl bg-sky px-4 py-3 text-xs text-ink/80 leading-relaxed">
              {t('syncHint')}
            </div>
          </section>
        </div>
      </div>

      {logPreview && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[70vh] overflow-auto">
            <h3 className="text-lg font-bold text-ink">{t('stockLog')}</h3>
            <p className="text-sm text-muted mt-1">{logPreview.name}</p>
            <ul className="mt-4 space-y-2">
              {logPreview.logs.length === 0 && (
                <li className="text-sm text-muted">{t('noStockLogs')}</li>
              )}
              {logPreview.logs.map((l) => (
                <li key={l.id} className="rounded-xl bg-sky/50 px-3 py-2 text-sm">
                  <span className={`font-bold ${l.changeAmount >= 0 ? 'text-brand' : 'text-due'}`}>
                    {l.changeAmount >= 0 ? '+' : ''}
                    {l.changeAmount}
                  </span>
                  <span className="text-muted"> · {l.reason}</span>
                  {l.note ? <p className="text-xs text-muted mt-0.5">{l.note}</p> : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-slate-100 py-3 text-sm font-bold"
              onClick={() => setLogPreview(null)}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <BottomNav active="/admin/items" />
    </div>
  );
}
