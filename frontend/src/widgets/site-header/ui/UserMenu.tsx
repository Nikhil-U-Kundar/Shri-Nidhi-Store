import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Package, User, Wallet } from 'lucide-react';
import { useAuth } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'SN';
}

/** Sign-in button for guests; account dropdown for signed-in shoppers. */
export function UserMenu() {
  const { isLoggedIn, user, logout, setLoginOpen } = useAuth();
  const { setCustomerTab, setAccountSubTab } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const openAccount = (section: 'profile' | 'orders' | 'khata') => {
    setCustomerTab('account');
    setAccountSubTab(section);
    setIsOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => setLoginOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-2 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 sm:border-transparent sm:px-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-[10px] leading-tight text-stone-400">Guest</span>
          <span className="text-xs font-bold text-stone-800">Sign In</span>
        </span>
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-2 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 sm:border-transparent sm:px-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
          {initials(user.name)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-[10px] leading-tight text-stone-400">Welcome,</span>
          <span className="text-xs font-bold text-stone-800">{user.name.split(' ')[0]}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-stone-400 md:inline" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white py-2 shadow-xl">
          <div className="px-4 py-2 text-xs">
            <p className="font-bold text-stone-900">{user.name}</p>
            <p className="truncate text-[11px] text-stone-500">{user.phone}</p>
          </div>
          <div className="py-1 text-xs font-medium text-stone-700">
            <button type="button" onClick={() => openAccount('profile')} className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left hover:bg-stone-50">
              <User className="h-4 w-4 text-stone-400" />
              <span>Profile &amp; Settings</span>
            </button>
            <button type="button" onClick={() => openAccount('orders')} className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left hover:bg-stone-50">
              <Package className="h-4 w-4 text-stone-400" />
              <span>My Orders</span>
            </button>
            <button type="button" onClick={() => openAccount('khata')} className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left hover:bg-stone-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-emerald-800">Kirana Khata Ledger</span>
            </button>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
