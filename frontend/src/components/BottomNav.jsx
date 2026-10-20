import { NavLink } from 'react-router-dom';
import { BookOpen, Store, Package, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav({ active }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const role = user?.role || 'guest';

  const items = [
    { to: '/store', label: t('navStore'), icon: Store, match: '/store' },
    {
      to: isAuthenticated ? '/passbook' : '/login',
      label: t('passbook'),
      icon: BookOpen,
      match: '/passbook',
    },
  ];

  if (role === 'admin') {
    items.push(
      { to: '/admin/items', label: t('navAdminItems'), icon: Package, match: '/admin/items' },
      { to: '/admin', label: t('navKhataAdmin'), icon: WalletCards, match: '/admin' }
    );
  }

  const cols =
    items.length >= 4
      ? 'grid-cols-4'
      : items.length === 3
        ? 'grid-cols-3'
        : items.length === 2
          ? 'grid-cols-2'
          : 'grid-cols-1 max-w-[160px] mx-auto';

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 bottom-nav-shell bg-white border-t border-slate-100 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] z-40">
      <div className={`grid gap-1 ${cols}`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.match || active === item.to;
          return (
            <NavLink
              key={`${item.match}-${item.label}`}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                isActive ? 'text-brand' : 'text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
