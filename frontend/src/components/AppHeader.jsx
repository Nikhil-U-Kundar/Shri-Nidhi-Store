import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, ChevronDown, Languages, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AppHeader({ subtitleKey = 'villageLedger', subtitle }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, setLang, t, label } = useLanguage();
  const [openLang, setOpenLang] = useState(false);
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

  function handleLogout() {
    logout();
    navigate('/login');
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
    <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center shadow-sm shrink-0">
          <BookOpenCheck className="text-white" size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-ink leading-tight truncate">
            {t('storeName')}
          </h1>
          <p className="text-[11px] text-muted truncate">
            {subtitle || t(subtitleKey)}
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
            onClick={handleLogout}
            title={t('logout')}
            className="inline-flex items-center gap-1.5 rounded-full bg-due-soft text-due px-3 py-1.5 text-xs font-bold"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand to-emerald-700 text-white text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
