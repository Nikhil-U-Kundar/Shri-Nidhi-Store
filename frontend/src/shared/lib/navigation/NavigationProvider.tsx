import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ACCOUNT_PATHS,
  ADMIN_PATHS,
  CUSTOMER_PATHS,
  parsePath,
  type AccountSubTab,
  type AdminTab,
  type CustomerTab,
} from './routes';

interface NavigationValue {
  /** True on any /admin address. */
  isAdminPath: boolean;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  accountSubTab: AccountSubTab;
  setAccountSubTab: (section: AccountSubTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  /** Move to a path. `replace` leaves no history entry, for redirects. */
  navigate: (path: string, options?: { replace?: boolean }) => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

/** The current page comes from the URL; which overlays are visible is kept in state. */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const pushedThisTick = useRef(false);

  const route = parsePath(path);
  // Remember the last account section, so "My account" reopens it.
  const sectionRef = useRef<AccountSubTab>('profile');
  if (route?.area === 'customer' && route.tab === 'account') sectionRef.current = route.section;

  const navigate = useCallback((to: string, options: { replace?: boolean } = {}) => {
    if (to === window.location.pathname) return;
    // Two moves from one click (open account, then pick a section) make a single history entry.
    if (options.replace || pushedThisTick.current) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
      pushedThisTick.current = true;
      queueMicrotask(() => {
        pushedThisTick.current = false;
      });
    }
    setPath(to);
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!parsePath(path)) navigate('/', { replace: true });
  }, [path, navigate]);

  const setCustomerTab = useCallback(
    (tab: CustomerTab) => navigate(tab === 'account' ? ACCOUNT_PATHS[sectionRef.current] : CUSTOMER_PATHS[tab]),
    [navigate]
  );

  const setAccountSubTab = useCallback(
    (section: AccountSubTab) => {
      sectionRef.current = section;
      const current = parsePath(window.location.pathname);
      if (current?.area === 'customer' && current.tab === 'account') navigate(ACCOUNT_PATHS[section]);
    },
    [navigate]
  );

  const setAdminTab = useCallback((tab: AdminTab) => navigate(ADMIN_PATHS[tab]), [navigate]);

  const customerTab: CustomerTab = route?.area === 'customer' ? route.tab : 'home';
  const adminTab: AdminTab = route?.area === 'admin' ? route.tab : 'dashboard';
  const accountSubTab = sectionRef.current;
  const isAdminPath = route?.area === 'admin';

  const value = useMemo<NavigationValue>(
    () => ({
      isAdminPath,
      customerTab,
      setCustomerTab,
      accountSubTab,
      setAccountSubTab,
      adminTab,
      setAdminTab,
      navigate,
      isCartOpen,
      setCartOpen,
      isCheckoutOpen,
      setCheckoutOpen,
    }),
    [isAdminPath, customerTab, setCustomerTab, accountSubTab, setAccountSubTab, adminTab, setAdminTab, navigate, isCartOpen, isCheckoutOpen]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
