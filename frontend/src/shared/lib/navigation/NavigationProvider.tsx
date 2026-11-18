import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

export type CustomerTab = 'home' | 'deals' | 'account' | 'tracking';
export type AccountSubTab = 'profile' | 'orders' | 'khata' | 'addresses';

interface NavigationValue {
  customerTab: CustomerTab;
  setCustomerTab: Dispatch<SetStateAction<CustomerTab>>;
  accountSubTab: AccountSubTab;
  setAccountSubTab: Dispatch<SetStateAction<AccountSubTab>>;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

/** Which storefront page is showing, which account section is open, and which overlays are visible. */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [accountSubTab, setAccountSubTab] = useState<AccountSubTab>('profile');
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  const value = useMemo(
    () => ({
      customerTab,
      setCustomerTab,
      accountSubTab,
      setAccountSubTab,
      isCartOpen,
      setCartOpen,
      isCheckoutOpen,
      setCheckoutOpen,
    }),
    [customerTab, accountSubTab, isCartOpen, isCheckoutOpen]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
