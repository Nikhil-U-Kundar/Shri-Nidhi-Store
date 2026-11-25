import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ACCOUNT_PATHS,
  ADMIN_PATHS,
  CUSTOMER_PATHS,
  NavigationProvider,
  parsePath,
  useNavigation,
} from '@/shared/lib/navigation';

const setup = (path = '/') => {
  window.history.replaceState(null, '', path);
  return renderHook(() => useNavigation(), { wrapper: NavigationProvider });
};

describe('routes', () => {
  it('round-trips every address', () => {
    for (const [tab, path] of Object.entries(ADMIN_PATHS)) expect(parsePath(path)).toEqual({ area: 'admin', tab });
    for (const [section, path] of Object.entries(ACCOUNT_PATHS))
      expect(parsePath(path)).toEqual({ area: 'customer', tab: 'account', section });
    expect(parsePath(CUSTOMER_PATHS.tracking)).toEqual({ area: 'customer', tab: 'tracking' });
    expect(parsePath(CUSTOMER_PATHS.deals)).toEqual({ area: 'customer', tab: 'deals' });
  });

  it('ignores case and trailing slashes, and rejects unknown paths', () => {
    expect(parsePath('/Admin/Orders/')).toEqual({ area: 'admin', tab: 'orders' });
    expect(parsePath('/')).toEqual({ area: 'customer', tab: 'home' });
    expect(parsePath('/nope')).toBeNull();
  });
});

describe('NavigationProvider', () => {
  it('opens the page named in the URL', () => {
    const { result } = setup('/admin/reports');
    expect(result.current.isAdminPath).toBe(true);
    expect(result.current.adminTab).toBe('reports');
  });

  it('changes the URL when a tab is chosen', async () => {
    const { result } = setup();
    act(() => result.current.setCustomerTab('tracking'));
    expect(window.location.pathname).toBe('/orders');
    await act(async () => {});
    act(() => result.current.setAdminTab('billing'));
    expect(window.location.pathname).toBe('/admin/billing');
  });

  it('follows the browser back button', () => {
    const { result } = setup('/deals');
    act(() => {
      window.history.replaceState(null, '', '/orders');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.customerTab).toBe('tracking');
  });

  it.each(['tab first', 'section first'])('opens an account section with one history entry (%s)', (order) => {
    const { result } = setup();
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      if (order === 'tab first') {
        result.current.setCustomerTab('account');
        result.current.setAccountSubTab('khata');
      } else {
        result.current.setAccountSubTab('khata');
        result.current.setCustomerTab('account');
      }
    });
    expect(window.location.pathname).toBe('/account/khata');
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('redirects unknown addresses home', () => {
    setup('/does-not-exist');
    expect(window.location.pathname).toBe('/');
  });

  it('tracks the cart and checkout overlays', () => {
    const { result } = setup();
    act(() => {
      result.current.setCartOpen(true);
      result.current.setCheckoutOpen(true);
    });
    expect(result.current.isCartOpen && result.current.isCheckoutOpen).toBe(true);
  });

  it('must be used inside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNavigation())).toThrow('NavigationProvider');
  });
});
