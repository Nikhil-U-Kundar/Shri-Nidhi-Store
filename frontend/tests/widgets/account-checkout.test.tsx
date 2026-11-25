import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOrders } from '@/entities/order';
import { useNavigation } from '@/shared/lib/navigation';
import { AccountPanel } from '@/widgets/account-panel';
import { AddressesSection } from '@/widgets/account-panel/ui/AddressesSection';
import { KhataSection } from '@/widgets/account-panel/ui/KhataSection';
import { OrdersSection } from '@/widgets/account-panel/ui/OrdersSection';
import { ProfileSection } from '@/widgets/account-panel/ui/ProfileSection';
import { CheckoutModal } from '@/widgets/checkout-modal';
import { PaymentGatewayModal } from '@/widgets/checkout-modal/ui/PaymentGatewayModal';
import { OrderTracker } from '@/widgets/order-tracker';
import { customerUser, fail, order, product, renderApp } from '../helpers';

const orders = { 'GET /orders': { orders: [order()] } };
const passbook = {
  customer: { id: 'u1', name: 'Asha', phone: '9', phoneFormatted: '9', initials: 'A' },
  summary: { balanceDue: 70, totalPaid: 30, totalCredit: 100 },
  entries: [
    { id: 'e1', type: 'payment', title: '', description: 'Cash received', amount: 30, date: '2026-11-02', balanceAfter: 70 },
  ],
};

describe('account', () => {
  it('asks guests to sign in', () => {
    renderApp(<AccountPanel />, { path: '/account' });
    expect(screen.getByText('Sign in to Access Your Account')).toBeTruthy();
  });

  it('AccountPanel opens the section in the URL and changes it', async () => {
    const { user } = renderApp(<AccountPanel />, { path: '/account/orders', role: 'customer', routes: orders });
    expect(await screen.findByText('Order History')).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Account sections' });
    await user.click(within(nav).getByRole('button', { name: /Address/ }));
    expect(window.location.pathname).toBe('/account/addresses');
    expect(screen.getByRole('heading', { name: 'Saved Addresses' })).toBeTruthy();
  });

  it('ProfileSection shows the profile', async () => {
    renderApp(<ProfileSection />, { role: 'customer' });
    await waitFor(() => expect((screen.getByLabelText('Full Name') as HTMLInputElement).value).toBe('Asha'));
  });

  it('AddressesSection removes an address but never the last one', async () => {
    const office = { id: 'a2', title: 'Office', text: '5 Lane', pincode: '574116', isDefault: false };
    const profile = { user: { ...customerUser, addresses: [...customerUser.addresses, office] } };
    const { user, calls } = renderApp(<AddressesSection />, { role: 'customer', routes: { 'GET /profile/me': profile } });
    await user.click(await screen.findByRole('button', { name: 'Remove Office address' }));
    await waitFor(() => expect(screen.queryByText('5 Lane')).toBeNull());
    expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Remove Home address' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Add Address/ }));
    expect(screen.getByText('New Delivery Location')).toBeTruthy();
  });

  it('OrdersSection opens live tracking', async () => {
    function Probe() {
      const { activeTrackingOrderId } = useOrders();
      return <span>tracking:{activeTrackingOrderId}</span>;
    }
    const { user } = renderApp(
      <>
        <OrdersSection />
        <Probe />
      </>,
      { role: 'customer', routes: orders }
    );
    await screen.findByText('tracking:ORD-111111');
    await user.click(screen.getAllByRole('button', { name: /Live Track/ })[0]);
    expect(window.location.pathname).toBe('/orders');
  });

  it('KhataSection shows the passbook', async () => {
    renderApp(<KhataSection />, { role: 'customer', routes: { 'GET /customers/u1/passbook': passbook } });
    expect(await screen.findByText('Payment received')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh khata' })).toBeTruthy();
  });

  it('KhataSection offers a retry when loading fails', async () => {
    renderApp(<KhataSection />, { role: 'customer', routes: { 'GET /customers/u1/passbook': fail(500, 'Ledger down') } });
    expect(await screen.findByRole('button', { name: /Try again/ })).toBeTruthy();
  });
});

describe('OrderTracker', () => {
  it('shows the live order', async () => {
    renderApp(<OrderTracker />, { role: 'customer', routes: orders });
    expect(await screen.findByText('Order #ORD-111111')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Order status: Order Placed' })).toBeTruthy();
  });

  it('handles having no orders', async () => {
    renderApp(<OrderTracker />, { role: 'customer', routes: { 'GET /orders': { orders: [] } } });
    expect(await screen.findByText('No recent orders found to track.')).toBeTruthy();
  });
});

describe('PaymentGatewayModal', () => {
  const request = { paymentMethod: 'UPI', amount: 290 } as never;
  const view = (onPaid: () => Promise<void>) => {
    const props = { onClose: vi.fn(), onRetry: vi.fn(), onReturnToCart: vi.fn() };
    const rendered = renderApp(<PaymentGatewayModal request={request} onPaid={onPaid} {...props} />);
    return { ...rendered, props };
  };

  it('passes the request on when payment succeeds', async () => {
    const onPaid = vi.fn().mockResolvedValue(undefined);
    const { user } = view(onPaid);
    await user.click(screen.getByRole('button', { name: /Simulate Success/ }));
    expect(onPaid).toHaveBeenCalledWith(request);
  });

  it('shows a decline with retry and return-to-cart', async () => {
    const { user, props } = view(() => Promise.reject(new Error('no')));
    await user.click(screen.getByRole('button', { name: /Simulate Success/ }));
    expect(await screen.findByText('Payment Declined by Bank')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Return to Cart/ }));
    await user.click(screen.getByRole('button', { name: /Retry/ }));
    expect(props.onReturnToCart).toHaveBeenCalled();
    expect(props.onRetry).toHaveBeenCalled();
  });
});

describe('CheckoutModal and usePlaceOrder', () => {
  function Open() {
    const { setCheckoutOpen } = useNavigation();
    return <button onClick={() => setCheckoutOpen(true)}>checkout</button>;
  }
  const slot = { id: 's1', label: '9 AM – 11 AM', start: '09:00', end: '11:00' };
  const routes = {
    'GET /schedule': { advanceHours: 24, sameDayDelivery: false, earliestDate: '2026-12-01', slots: [slot] },
    'GET /schedule/slots': { slots: [slot] },
    'POST /orders': { order: order() },
  };

  it('records every step, places a cash order and shows tracking', async () => {
    const { user, calls } = renderApp(
      <>
        <Open />
        <CheckoutModal />
      </>,
      { role: 'customer', routes, cart: [{ ...product(), qty: 1 }] }
    );
    await waitFor(() => expect(calls.some((c) => c.path === '/profile/me')).toBe(true));
    await user.click(screen.getByText('checkout'));
    await user.click(screen.getByRole('button', { name: /Continue to Address Selection/ }));
    await user.click(screen.getByRole('button', { name: /Continue to Delivery Speed/ }));
    fireEvent.change(await screen.findByLabelText('Delivery date'), { target: { value: '2026-12-01' } });
    await user.click(await screen.findByLabelText(slot.label));
    await user.click(screen.getByRole('button', { name: /Continue to Payment/ }));
    await user.click(screen.getByRole('radio', { name: /Cash on Delivery/ }));
    await user.click(screen.getByRole('button', { name: /Place Order/ }));

    await waitFor(() => expect(window.location.pathname).toBe('/orders'));
    await waitFor(() => {
      const steps = calls.filter((c) => c.path === '/checkout/steps').map((c) => c.body.step);
      expect(steps).toEqual(['contact', 'address', 'delivery', 'payment', 'placed']);
    });
    const placed = calls.find((c) => c.method === 'POST' && c.path === '/orders');
    expect(placed?.body).toMatchObject({ deliveryTimeSlot: 's1', items: [{ productId: 'p1', qty: 1 }] });
    expect(localStorage.getItem('sri_nidhi_cart')).toBe('[]');
  });
});
