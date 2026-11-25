import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { AppProviders } from '@/app/entrypoint/AppProviders';
import { ToastContainer } from '@/shared/ui/toast';

export interface ApiCall {
  method: string;
  path: string;
  body: any;
  headers: Record<string, string>;
}

type Reply = unknown | ((call: ApiCall) => unknown);

export const fail = (status: number, message: string) => ({ __status: status, message });

/**
 * Replace fetch. Keys are "METHOD /path" (without /api). Unlisted GETs answer with empty data,
 * unlisted writes answer { ok: true }.
 */
export function mockApi(routes: Record<string, Reply> = {}) {
  const calls: ApiCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options: RequestInit = {}) => {
      const path = String(url).replace(/^.*?\/api/, '');
      const method = options.method ?? 'GET';
      let body: any = options.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const call = { method, path, body, headers: (options.headers ?? {}) as Record<string, string> };
      calls.push(call);
      const key = `${method} ${path.split('?')[0]}`;
      let reply: any = key in routes ? routes[key] : method === 'GET' ? {} : { ok: true };
      if (typeof reply === 'function') reply = reply(call);
      const status = reply?.__status ?? 200;
      return new Response(JSON.stringify(reply), { status, headers: { 'Content-Type': 'application/json' } });
    })
  );
  return calls;
}

export const product = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Test Atta',
  category: 'Atta, Rice & Dal',
  brand: 'Aashirvaad',
  unit: '5 kg',
  price: 300,
  discountPrice: 250,
  discount: 17,
  stock: 20,
  rating: 4.5,
  image: '/images/product-atta.jpg',
  description: 'Fresh atta',
  mfg: 'ITC',
  origin: 'India',
  expiry: '6 Months',
  ...over,
});

export const apiProduct = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Test Atta',
  brand: 'Aashirvaad',
  categoryName: 'Atta, Rice & Dal',
  packLabel: '5 kg',
  sellingPrice: 250,
  mrp: 300,
  stockQuantity: 20,
  ...over,
});

export const order = (over: Record<string, unknown> = {}) => ({
  id: 'ORD-111111',
  date: '1 Nov 2026',
  timestamp: 1,
  items: [{ name: 'Test Atta', qty: 2, price: 250, unit: '5 kg' }],
  subtotal: 500,
  deliveryFee: 0,
  total: 500,
  status: 'Order Placed',
  paymentMethod: 'Cash on Delivery',
  paymentStatus: 'Pending Cash at Doorstep',
  deliveryAddress: '12 Main Road',
  deliveryMode: 'Home Delivery',
  customerName: 'Asha',
  customerPhone: '9000000000',
  ...over,
});

export const bill = (over: Record<string, unknown> = {}) => ({
  id: 'b1',
  billNumber: 'SN-2026-1234',
  date: '1 Nov 2026',
  time: '10:00 AM',
  timestamp: 1,
  customerName: 'Asha',
  customerPhone: '9000000000',
  customerType: 'walk-in',
  items: [{ id: 'l1', name: 'Sugar', unit: '1 kg', price: 45, qty: 2, total: 90 }],
  subtotal: 90,
  discount: 0,
  tax: 0,
  total: 90,
  paymentMethod: 'Cash',
  paymentStatus: 'Paid',
  ...over,
});

export const customerUser = {
  id: 'u1',
  name: 'Asha',
  phone: '9000000000',
  email: 'asha@phone.local',
  role: 'customer',
  khataBalance: 5000,
  addresses: [{ id: 'a1', title: 'Home', text: '12 Main Road', pincode: '574116', isDefault: true }],
};

export const adminUser = { id: 'o1', name: 'Owner', email: 'owner@store.test', role: 'admin' };

/** Put a saved session in the browser and return the profile route that matches it. */
export function signIn(role: 'customer' | 'admin') {
  const user = role === 'admin' ? adminUser : customerUser;
  localStorage.setItem('sns_token', 'test-token');
  localStorage.setItem('sns_user', JSON.stringify({ name: user.name, role }));
  return { 'GET /profile/me': { user } };
}

interface Options {
  path?: string;
  role?: 'customer' | 'admin';
  routes?: Record<string, Reply>;
  cart?: unknown[];
}

/** Render inside the real providers, with toasts visible. */
export function renderApp(ui: ReactElement, { path = '/', role, routes = {}, cart }: Options = {}) {
  window.history.replaceState(null, '', path);
  if (cart) localStorage.setItem('sri_nidhi_cart', JSON.stringify(cart));
  const profile = role ? signIn(role) : {};
  const calls = mockApi({ ...profile, ...routes });
  const view = render(
    <AppProviders>
      {ui}
      <ToastContainer />
    </AppProviders>
  );
  return { ...view, calls, user: userEvent.setup() };
}
