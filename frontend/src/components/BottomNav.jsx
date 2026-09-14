import { NavLink } from 'react-router-dom';
import { BookOpen, Store, CirclePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav({ active }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role || 'customer';

  const items =
    role === 'admin'
      ? [
          { to: '/admin', label: t('shopAdmin'), icon: Store, match: '/admin' },
          { to: '/admin', label: t('newBill'), icon: CirclePlus, match: '/new-bill' },
        ]
      : [{ to: '/passbook', label: t('passbook'), icon: BookOpen, match: '/passbook' }];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[min(440px,100%)] bg-white border-t border-slate-100 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] z-40">
      <div
        className={`grid gap-1 ${items.length === 1 ? 'grid-cols-1 max-w-[160px] mx-auto' : 'grid-cols-2'}`}
      >
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
