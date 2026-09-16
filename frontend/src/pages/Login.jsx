import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  CircleDot,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [role, setRole] = useState('customer');
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shop, setShop] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/auth/shop-info')
      .then(setShop)
      .catch(() =>
        setShop({
          ownerName: 'Mallika',
          ownerPhone: '8970128830',
          isOpen: true,
          verified: true,
        })
      );
  }, []);

  useEffect(() => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    if (role === 'admin') {
      setMode('signin');
    }
  }, [role, mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, phone }),
        });
        login(data.token, data.user);
        navigate('/passbook');
        return;
      }

      const loginId = role === 'admin' ? email : phone;
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: loginId,
          password,
          role,
        }),
      });
      login(data.token, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/passbook');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isCustomer = role === 'customer';
  const isSignup = mode === 'signup' && isCustomer;

  return (
    <div className="app-shell">
      <AppHeader subtitleKey="digitalKhata" />

      <div className="px-4 space-y-4 mt-2 pb-6">
        <section className="card p-5 animate-rise">
          <div className="h-14 w-14 rounded-2xl bg-brand-soft flex items-center justify-center mb-3">
            <BookOpenCheck className="text-brand" size={28} />
          </div>
          <h2 className="text-xl font-bold text-ink">{t('welcome')}</h2>
          <p className="text-sm text-muted mt-1">{t('welcomeSub')}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-ink">
              <ShieldCheck size={14} className="text-brand" />
              {t('verifiedLedger')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-ink">
              <CircleDot size={14} className="text-brand" />
              {t('shopOpen')}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl shadow-sm animate-rise animate-rise-delay-1">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`rounded-xl px-3 py-3 text-left transition ${
              role === 'customer' ? 'bg-brand text-white' : 'bg-transparent text-muted'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <UserRound size={16} />
              {t('customer')}
            </div>
            <p className={`text-[11px] mt-1 ${role === 'customer' ? 'text-white/80' : 'text-muted'}`}>
              {t('accountLogin')}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`rounded-xl px-3 py-3 text-left transition ${
              role === 'admin' ? 'bg-brand text-white' : 'bg-transparent text-muted'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <Store size={16} />
              {t('shopOwner')}
            </div>
            <p className={`text-[11px] mt-1 ${role === 'admin' ? 'text-white/80' : 'text-muted'}`}>
              {t('adminPortal')}
            </p>
          </button>
        </div>

        {isCustomer && (
          <div className="flex gap-2 animate-rise animate-rise-delay-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
                mode === 'signin' ? 'bg-brand text-white' : 'bg-white text-muted shadow-sm'
              }`}
            >
              {t('signInTab')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
                mode === 'signup' ? 'bg-brand text-white' : 'bg-white text-muted shadow-sm'
              }`}
            >
              {t('signUpTab')}
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="card p-5 space-y-4 animate-rise animate-rise-delay-2"
          autoComplete="off"
        >
          {isSignup && (
            <>
              <p className="text-xs text-muted -mt-1">{t('signupPhoneHint')}</p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">{t('username')}</label>
                  <span className="text-xs font-semibold text-brand">{t('required')}</span>
                </div>
                <div className="relative">
                  <UserRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    className="input-field"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('usernamePlaceholder')}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            </>
          )}

          {isCustomer ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">{t('phone')}</label>
                <span className="text-xs font-semibold text-brand">{t('required')}</span>
              </div>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  className="input-field"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={t('phonePlaceholder')}
                  required
                  minLength={10}
                  maxLength={10}
                  autoComplete="tel"
                />
                {phone && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    onClick={() => setPhone('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">{t('emailAddress')}</label>
                <span className="text-xs font-semibold text-brand">{t('required')}</span>
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  autoComplete="off"
                />
                {email && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    onClick={() => setEmail('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {!isSignup && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">{t('password')}</label>
                <button type="button" className="text-xs font-semibold text-brand">
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isCustomer ? t('passwordIsPhone') : t('passwordPlaceholder')
                  }
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-muted mt-2">
                <ShieldCheck size={12} className="text-brand" />
                {isCustomer ? t('customerLoginHint') : t('enterPassword')}
              </p>
            </div>
          )}

          {isSignup && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={12} className="text-brand" />
              {t('signupAutoPassword')}
            </p>
          )}

          {error && (
            <p className="text-sm text-due bg-due-soft rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
            {loading
              ? isSignup
                ? t('creatingAccount')
                : t('signingIn')
              : isSignup
                ? t('createAccount')
                : t('signIn')}
          </button>

          {isCustomer &&
            (mode === 'signin' ? (
              <p className="text-center text-xs text-muted">
                {t('newHere')}{' '}
                <button
                  type="button"
                  className="text-brand font-bold"
                  onClick={() => setMode('signup')}
                >
                  {t('signUpLink')}
                </button>
              </p>
            ) : (
              <p className="text-center text-xs text-muted">
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  className="text-brand font-bold"
                  onClick={() => setMode('signin')}
                >
                  {t('signInLink')}
                </button>
              </p>
            ))}
        </form>

        <section className="card p-4 flex items-center gap-3 animate-rise animate-rise-delay-3">
          <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Phone size={18} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              {t('needHelp')} {shop?.ownerName || 'Mallika'}.
            </p>
          </div>
          <a
            href={`tel:${shop?.ownerPhone || '8970128830'}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-white text-xs font-bold px-3 py-2"
          >
            <Phone size={14} />
            {t('call')}
          </a>
        </section>
      </div>
    </div>
  );
}
