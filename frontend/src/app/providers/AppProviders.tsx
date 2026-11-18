import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/features/auth';
import { CartProvider } from '@/entities/cart';
import { CatalogProvider } from '@/entities/product';
import { OrdersProvider } from '@/entities/order';
import { BillingProvider } from '@/entities/bill';
import { NavigationProvider } from '@/shared/lib/navigation';
import { ToastProvider } from '@/shared/ui/toast';

/** Providers that depend on who is signed in. Must sit inside AuthProvider. */
function SessionScopedProviders({ children }: { children: ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <CatalogProvider visibleOnly={!isAdmin}>
      <CartProvider>
        <OrdersProvider hasSession={isLoggedIn}>
          <BillingProvider isAdmin={isAdmin}>{children}</BillingProvider>
        </OrdersProvider>
      </CartProvider>
    </CatalogProvider>
  );
}

/** Composition root for all global state. Order matters: each layer may read the ones above it. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <NavigationProvider>
        <AuthProvider>
          <SessionScopedProviders>{children}</SessionScopedProviders>
        </AuthProvider>
      </NavigationProvider>
    </ToastProvider>
  );
}
