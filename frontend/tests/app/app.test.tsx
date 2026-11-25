import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '@/app/entrypoint/App';
import { AccountPage } from '@/pages/account';
import { AdminPage } from '@/pages/admin';
import { DealsPage } from '@/pages/deals';
import { StorefrontPage } from '@/pages/storefront';
import { TrackingPage } from '@/pages/tracking';
import { mockApi, renderApp, signIn } from '../helpers';

const open = (path: string) => {
  window.history.replaceState(null, '', path);
  return render(<App />);
};

describe('pages', () => {
  it('each page renders its widget', () => {
    for (const [page, text] of [
      [<AccountPage />, 'Sign in to Access Your Account'],
      [<StorefrontPage />, 'Shop Daily Essentials'],
      [<DealsPage />, 'Bumper Grocery & Combo Mandi Deals'],
      [<TrackingPage />, /Order #|No recent orders/],
    ] as const) {
      const view = renderApp(page);
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
      view.unmount();
    }
  });

  it('AdminPage blocks guests and customers', async () => {
    const guest = renderApp(<AdminPage />, { path: '/admin' });
    expect(screen.getByText('Sign in with the shop owner account to continue.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    guest.unmount();
    const { user } = renderApp(<AdminPage />, { path: '/admin', role: 'customer' });
    expect(screen.getByText('Your account does not have admin access.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Back to the store' }));
    expect(window.location.pathname).toBe('/');
  });
});

describe('App routing', () => {
  it.each([
    ['/', 'Shop Daily Essentials'],
    ['/deals', 'Bumper Grocery & Combo Mandi Deals'],
    ['/account', 'Sign in to Access Your Account'],
    ['/admin/orders', 'Shop owner area'],
  ])('%s shows its page', (path, text) => {
    open(path);
    expect(screen.getByText(text)).toBeTruthy();
    expect(window.location.pathname).toBe(path);
  });

  it('opens the sign-in dialog from the admin notice', async () => {
    open('/admin');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeTruthy();
  });

  it('sends the owner to /admin and back to the store on sign out', async () => {
    mockApi(signIn('admin'));
    open('/');
    await waitFor(() => expect(window.location.pathname).toBe('/admin'));
    const nav = screen.getByRole('navigation', { name: 'Admin sections desktop' });
    await userEvent.click(within(nav).getByRole('button', { name: /Stock & Low Alerts/ }));
    expect(window.location.pathname).toBe('/admin/inventory');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    await waitFor(() => expect(window.location.pathname).toBe('/'));
  });

  it('keeps the page in step with the back button', () => {
    open('/deals');
    act(() => {
      window.history.replaceState(null, '', '/account');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByText('Sign in to Access Your Account')).toBeTruthy();
  });

  it('main.tsx mounts the app into #root', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
    await act(async () => {
      await import('@/main');
    });
    await waitFor(() => expect(document.getElementById('root')!.childElementCount).toBeGreaterThan(0));
    document.body.innerHTML = '';
  });
});
