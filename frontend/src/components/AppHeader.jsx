import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, ChevronDown, Languages, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AppHeader({
  subtitleKey = 'villageLedger',
  subtitle,
  showActive = false,
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, setLang, t, label } = useLanguage();
  const [openLang, setOpenLang] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenLang(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleLogoutConfirm() {
    setConfirmLogout(false);
    logout();
    navigate('/store');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SN';

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center shadow-sm shrink-0">
            <BookOpenCheck className="text-white" size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-ink leading-tight truncate">
              {t('storeName')}
            </h1>
            <p className="text-[11px] text-muted truncate flex items-center gap-1.5">
              <span className="truncate">{subtitle || t(subtitleKey)}</span>
              {showActive && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-brand-soft text-brand px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                  ACTIVE
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenLang((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-ink"
              aria-expanded={openLang}
              aria-haspopup="listbox"
            >
              <Languages size={14} className="text-brand" />
              {label}
              <ChevronDown size={12} className="text-muted" />
            </button>

            {openLang && (
              <div
                role="listbox"
                className="absolute right-0 mt-2 w-36 rounded-xl bg-white shadow-lg border border-slate-100 overflow-hidden z-50"
              >
                {[
                  { code: 'en', key: 'english' },
                  { code: 'hi', key: 'hindi' },
                  { code: 'kn', key: 'kannada' },
                ].map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    role="option"
                    aria-selected={lang === opt.code}
                    className={`w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-sky ${
                      lang === opt.code ? 'text-brand bg-sky/60' : 'text-ink'
                    }`}
                    onClick={() => {
                      setLang(opt.code);
                      setOpenLang(false);
                    }}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              title={t('logout')}
              className="inline-flex items-center gap-1.5 rounded-full bg-due-soft text-due px-3 py-1.5 text-xs font-bold"
            >
              <span className="hidden sm:inline h-6 w-6 rounded-full bg-brand text-white text-[10px] font-bold items-center justify-center sm:flex">
                {initials}
              </span>
              <LogOut size={14} />
              {t('logout')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1 rounded-full bg-brand text-white px-3 py-1.5 text-xs font-bold"
            >
              {t('signIn')}
            </button>
          )}
        </div>
      </header>

      {confirmLogout && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-ink">{t('logoutConfirmTitle')}</h3>
            <p className="text-sm text-muted mt-2">{t('logoutConfirmMessage')}</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-xl bg-slate-100 py-3 text-sm font-bold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-due text-white py-3 text-sm font-bold"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
