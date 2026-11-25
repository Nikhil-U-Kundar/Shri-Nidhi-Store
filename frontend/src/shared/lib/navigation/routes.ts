export type CustomerTab = 'home' | 'deals' | 'account' | 'tracking';
export type AccountSubTab = 'profile' | 'orders' | 'khata' | 'addresses';
export type AdminTab = 'dashboard' | 'orders' | 'products' | 'khata' | 'inventory' | 'reports' | 'billing';

/** Every page of the app and its address. This is the one place URLs are defined. */
export const CUSTOMER_PATHS: Record<CustomerTab, string> = {
  home: '/',
  deals: '/deals',
  account: '/account',
  tracking: '/orders',
};

export const ACCOUNT_PATHS: Record<AccountSubTab, string> = {
  profile: '/account',
  orders: '/account/orders',
  khata: '/account/khata',
  addresses: '/account/addresses',
};

export const ADMIN_PATHS: Record<AdminTab, string> = {
  dashboard: '/admin',
  orders: '/admin/orders',
  products: '/admin/products',
  khata: '/admin/khata',
  inventory: '/admin/inventory',
  reports: '/admin/reports',
  billing: '/admin/billing',
};

export type Route =
  | { area: 'customer'; tab: Exclude<CustomerTab, 'account'> }
  | { area: 'customer'; tab: 'account'; section: AccountSubTab }
  | { area: 'admin'; tab: AdminTab };

function keyFor<K extends string>(paths: Record<K, string>, path: string): K | undefined {
  return (Object.keys(paths) as K[]).find((key) => paths[key] === path);
}

/** Read a URL path. Unknown paths return null so the caller can redirect. */
export function parsePath(pathname: string): Route | null {
  const path = pathname.replace(/\/+$/, '').toLowerCase() || '/';

  const adminTab = keyFor(ADMIN_PATHS, path);
  if (adminTab) return { area: 'admin', tab: adminTab };

  const section = keyFor(ACCOUNT_PATHS, path);
  if (section) return { area: 'customer', tab: 'account', section };

  const tab = keyFor(CUSTOMER_PATHS, path);
  if (tab && tab !== 'account') return { area: 'customer', tab };

  return null;
}
