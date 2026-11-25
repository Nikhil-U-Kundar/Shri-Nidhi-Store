import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BillingProvider, useBilling } from '@/entities/bill';
import { initialBills } from '@/entities/bill/model/mock-data';
import { CartProvider, useCart } from '@/entities/cart';
import { calculateCartTotals } from '@/entities/cart/model/totals';
import { ORDER_STATUSES, OrderStatusBadge, OrdersProvider, useOrders } from '@/entities/order';
import { initialOrders } from '@/entities/order/model/mock-data';
import {
  ACCEPTED_IMAGE_TYPES,
  ALL_PRODUCTS,
  CatalogProvider,
  ProductCard,
  SORT_OPTIONS,
  buildCategoryList,
  filterProducts,
  initialProducts,
  useCatalog,
} from '@/entities/product';
import { mapApiProduct, resolveImageUrl, toApiProductBody, toApiProductPatch } from '@/entities/product/lib/mapper';
import { AuthProvider, GUEST_PROFILE, useAuth } from '@/entities/user';
import { toUserProfile } from '@/entities/user/lib/mapper';
import { ToastProvider } from '@/shared/ui/toast';
import { apiProduct, bill, customerUser, fail, mockApi, order, product, signIn } from '../helpers';

describe('cart', () => {
  it('totals items and charges delivery below the free threshold', () => {
    const totals = calculateCartTotals([{ ...product(), qty: 1 }]);
    expect(totals).toMatchObject({ count: 1, subtotal: 250, savings: 50, deliveryFee: 40, finalTotal: 290 });
  });

  it('delivers free at the threshold and charges nothing for an empty cart', () => {
    expect(calculateCartTotals([{ ...product(), qty: 2 }]).deliveryFee).toBe(0);
    expect(calculateCartTotals([])).toMatchObject({ deliveryFee: 0, finalTotal: 0 });
  });

  it('keeps the basket in storage and can clear it', () => {
    localStorage.setItem('sri_nidhi_cart', JSON.stringify([{ ...product(), qty: 3 }]));
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    expect(result.current.totals.count).toBe(3);
    act(() => result.current.clearCart());
    expect(localStorage.getItem('sri_nidhi_cart')).toBe('[]');
  });

  it('starts empty when the stored basket is broken', () => {
    localStorage.setItem('sri_nidhi_cart', '{oops');
    expect(renderHook(() => useCart(), { wrapper: CartProvider }).result.current.items).toEqual([]);
  });
});

describe('product lib', () => {
  const list = [
    product({ id: '1', name: 'Atta', rating: 4, discountPrice: 200, discount: 5 }),
    product({ id: '2', name: 'Oil', brand: 'Fortune', category: 'Cooking Oil & Ghee', rating: 5, discountPrice: 100, discount: 20 }),
  ];
  const ids = (over: object) =>
    filterProducts(list, { category: ALL_PRODUCTS, query: '', sort: 'popular', ...over }).map((p) => p.id);

  it('filters by category and text', () => {
    expect(ids({ category: 'Cooking Oil & Ghee' })).toEqual(['2']);
    expect(ids({ query: ' fortune ' })).toEqual(['2']);
    expect(ids({ query: 'zzz' })).toEqual([]);
  });

  it('sorts every offered way', () => {
    expect(ids({ sort: 'popular' })).toEqual(['2', '1']);
    expect(ids({ sort: 'price-low' })).toEqual(['2', '1']);
    expect(ids({ sort: 'price-high' })).toEqual(['1', '2']);
    expect(ids({ sort: 'discount' })).toEqual(['2', '1']);
    expect(SORT_OPTIONS).toHaveLength(4);
  });

  it('orders categories with unknown ones last', () => {
    expect(buildCategoryList([{ category: 'Zed' }, { category: 'Personal Care' }])).toEqual([
      'All Products',
      'Personal Care',
      'Zed',
    ]);
  });

  it('maps API rows, computing discount and filling gaps', () => {
    const mapped = mapApiProduct(apiProduct({ id: 7 }));
    expect(mapped).toMatchObject({ id: '7', price: 300, discountPrice: 250, discount: 17, isOffer: true });
    expect(mapApiProduct({ id: 1, name: 'Bare' })).toMatchObject({ category: 'General', unit: '1 Piece', discount: 0 });
    expect(resolveImageUrl(null)).toBe('');
    expect(resolveImageUrl('https://x/y.png')).toBe('https://x/y.png');
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/webp');
  });

  it('builds create and patch bodies', () => {
    expect(toApiProductBody({ name: 'A', price: 10 })).toMatchObject({ name: 'A', sellingPrice: 10, mrp: 10 });
    expect(toApiProductPatch({ stock: 4 })).toEqual({ stockQuantity: 4 });
  });

  it('ProductCard shows price, low stock and falls back when the photo fails', () => {
    const onOpen = vi.fn();
    render(<ProductCard product={product({ stock: 2 })} onOpen={onOpen} action={<span>add-here</span>} />);
    expect(screen.getByText('Only 2 left')).toBeTruthy();
    expect(screen.getByText('add-here')).toBeTruthy();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Quick view Test Atta' }));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe('CatalogProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <CatalogProvider visibleOnly>{children}</CatalogProvider>;

  it('loads products from the API', async () => {
    mockApi({ 'GET /products': { products: [apiProduct()] } });
    const { result } = renderHook(() => useCatalog(), { wrapper });
    await waitFor(() => expect(result.current.catalogLoading).toBe(false));
    expect(result.current.products.map((p) => p.name)).toEqual(['Test Atta']);
  });

  it('shows the sample catalog when the API fails', async () => {
    mockApi({ 'GET /products': fail(503, 'down') });
    const { result } = renderHook(() => useCatalog(), { wrapper });
    await waitFor(() => expect(result.current.usingMockCatalog).toBe(true));
    expect(result.current.products).toBe(initialProducts);
  });
});

describe('orders', () => {
  const guest = ({ children }: { children: ReactNode }) => <OrdersProvider hasSession={false}>{children}</OrdersProvider>;
  const member = ({ children }: { children: ReactNode }) => <OrdersProvider hasSession>{children}</OrdersProvider>;

  it('gives guests the sample orders without calling the API', () => {
    const calls = mockApi();
    const { result } = renderHook(() => useOrders(), { wrapper: guest });
    expect(result.current.orders).toBe(initialOrders);
    expect(calls).toHaveLength(0);
  });

  it('loads orders and refreshes every 30 seconds', async () => {
    vi.useFakeTimers();
    const calls = mockApi({ 'GET /orders': { orders: [order()] } });
    const { result, unmount } = renderHook(() => useOrders(), { wrapper: member });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.activeTrackingOrderId).toBe('ORD-111111');
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(calls).toHaveLength(2);
    unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toHaveLength(2);
  });

  it('OrderStatusBadge renders every status', () => {
    for (const status of ORDER_STATUSES) {
      const view = render(<OrderStatusBadge status={status} />);
      expect(view.container.textContent).toBe(status);
      view.unmount();
    }
  });
});

describe('BillingProvider', () => {
  const wrap = (isAdmin: boolean) => ({ children }: { children: ReactNode }) => (
    <BillingProvider isAdmin={isAdmin}>{children}</BillingProvider>
  );

  it('loads the archive for the owner only', async () => {
    const calls = mockApi({ 'GET /bills': { bills: [bill()] } });
    const other = renderHook(() => useBilling(), { wrapper: wrap(false) });
    expect(other.result.current.bills).toBe(initialBills);
    expect(calls).toHaveLength(0);
    const owner = renderHook(() => useBilling(), { wrapper: wrap(true) });
    await waitFor(() => expect(owner.result.current.bills).toHaveLength(1));
  });
});

describe('user', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );

  it('maps an API user and applies defaults', () => {
    expect(toUserProfile({ name: 'A', khataBalance: '5' })).toMatchObject({ name: 'A', khataBalance: 5, khataCreditLimit: 10000 });
    expect(GUEST_PROFILE.name).toBe('Guest');
  });

  it('signs in, loads the profile and signs out', async () => {
    mockApi({ 'POST /auth/login': { token: 't', user: customerUser }, 'GET /profile/me': { user: customerUser } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.login('9000000000', 'pw'));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user.name).toBe('Asha');
    expect(localStorage.getItem('sns_token')).toBe('t');
    act(() => result.current.logout());
    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem('sns_token')).toBeNull();
  });

  it('registers a customer', async () => {
    mockApi({ 'POST /auth/register': { token: 'n', user: customerUser }, 'GET /profile/me': { user: customerUser } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.registerCustomer('Asha', '9000000000'));
    expect(result.current.role).toBe('customer');
  });

  it('drops a saved session the server rejects', async () => {
    signIn('admin');
    mockApi({ 'GET /profile/me': fail(401, 'Unauthorized') });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoggedIn).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });
});
