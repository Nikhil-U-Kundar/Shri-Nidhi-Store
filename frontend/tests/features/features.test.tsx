import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBilling, type Bill } from '@/entities/bill';
import { useCart } from '@/entities/cart';
import { useOrders, type Order } from '@/entities/order';
import { useCatalog } from '@/entities/product';
import { useAuth } from '@/entities/user';
import { NewAddressForm, useAddressActions } from '@/features/address-book';
import { LoginModal } from '@/features/auth';
import { AddToCartControl, useCartActions } from '@/features/cart-actions';
import { ReceiptModal } from '@/features/order-receipt';
import { AddProductDialog, useProductActions } from '@/features/product-admin';
import { ProductSearchBox } from '@/features/product-search';
import { SchedulePicker } from '@/features/schedule-picker';
import { TakeBillModal } from '@/features/take-bill';
import { billPdfFilename, buildBillPdf } from '@/features/take-bill/lib/billPdf';
import { apiProduct, bill, customerUser, fail, order, product, renderApp } from '../helpers';

describe('auth/LoginModal', () => {
  function Open() {
    const { setLoginOpen, user } = useAuth();
    return (
      <>
        <button onClick={() => setLoginOpen(true)}>open</button>
        <span>user:{user.name}</span>
        <LoginModal />
      </>
    );
  }

  it('signs in and closes', async () => {
    const { user, calls } = renderApp(<Open />, {
      routes: { 'POST /auth/login': { token: 't', user: customerUser }, 'GET /profile/me': { user: customerUser } },
    });
    await user.click(screen.getByText('open'));
    await user.type(screen.getByLabelText('Phone number or email'), ' 9000000000 ');
    await user.type(screen.getByLabelText('Password'), 'pw');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('text');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('user:Asha');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(calls.find((c) => c.path === '/auth/login')?.body.login).toBe('9000000000');
  });

  it('shows the server error', async () => {
    const { user } = renderApp(<Open />, { routes: { 'POST /auth/login': fail(401, 'Invalid phone number or password') } });
    await user.click(screen.getByText('open'));
    await user.type(screen.getByLabelText('Phone number or email'), '1');
    await user.type(screen.getByLabelText('Password'), 'x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Invalid phone number or password');
  });

  it('switches to sign up and registers', async () => {
    const { user, calls } = renderApp(<Open />, {
      routes: { 'POST /auth/register': { token: 't', user: customerUser } },
    });
    await user.click(screen.getByText('open'));
    await user.click(screen.getByRole('button', { name: 'New customer? Create an account' }));
    await user.type(screen.getByLabelText('Your name'), 'Asha');
    await user.type(screen.getByLabelText('Phone number'), '9000000000');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(calls.some((c) => c.path === '/auth/register')).toBe(true));
  });
});

describe('cart-actions', () => {
  function Harness({ stock = 5 }: { stock?: number }) {
    const { totals } = useCart();
    const { removeFromCart } = useCartActions();
    return (
      <>
        <AddToCartControl product={product({ stock })} />
        <span>count:{totals.count}</span>
        <button onClick={() => removeFromCart('p1')}>remove</button>
      </>
    );
  }

  it('adds, steps the quantity and removes at zero', async () => {
    const { user } = renderApp(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Increase Test Atta' }));
    expect(screen.getByText('count:2')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Decrease Test Atta' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Test Atta' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByText('remove'));
    expect(screen.getByText('count:0')).toBeTruthy();
  });

  it('disables adding when out of stock', () => {
    renderApp(<Harness stock={0} />);
    expect((screen.getByRole('button', { name: 'Out of Stock' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('product-search/ProductSearchBox', () => {
  function Harness() {
    const { quickViewProduct } = useCatalog();
    return (
      <>
        <ProductSearchBox />
        <span>picked:{quickViewProduct?.name}</span>
      </>
    );
  }
  const routes = { 'GET /products': { products: [apiProduct()] } };

  it('suggests matches, opens one and clears', async () => {
    const { user } = renderApp(<Harness />, { routes });
    const input = screen.getByLabelText('Search products') as HTMLInputElement;
    await user.type(input, 'test');
    await user.click(await screen.findByText('Test Atta'));
    expect(screen.getByText('picked:Test Atta')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input.value).toBe('');
  });

  it('says when nothing matches', async () => {
    const { user } = renderApp(<Harness />, { routes });
    await user.type(screen.getByLabelText('Search products'), 'zzzz');
    expect(screen.getByText(/No grocery items found/)).toBeTruthy();
  });
});

describe('schedule-picker/SchedulePicker', () => {
  const info = { advanceHours: 24, sameDayDelivery: false, earliestDate: '2026-12-01', slots: [] };
  const slot = { id: 's1', label: '9 AM – 11 AM', start: '09:00', end: '11:00' };

  it('lists slots for a date and reports the choice', async () => {
    const onChange = vi.fn();
    const { user } = renderApp(<SchedulePicker date="2026-12-01" slotId="" onChange={onChange} />, {
      routes: { 'GET /schedule': info, 'GET /schedule/slots': { slots: [slot] } },
    });
    await user.click(await screen.findByLabelText(slot.label));
    expect(onChange).toHaveBeenCalledWith({ date: '2026-12-01', slotId: 's1' });
    fireEvent.change(screen.getByLabelText('Delivery date'), { target: { value: '2026-12-02' } });
    expect(onChange).toHaveBeenCalledWith({ date: '2026-12-02', slotId: '' });
  });

  it('shows empty and error states', async () => {
    const empty = renderApp(<SchedulePicker date="2026-12-01" slotId="" onChange={() => {}} />, {
      routes: { 'GET /schedule': info, 'GET /schedule/slots': { slots: [] } },
    });
    await screen.findByText(/No slots are open/);
    empty.unmount();
    renderApp(<SchedulePicker date="" slotId="" onChange={() => {}} />, {
      routes: { 'GET /schedule': fail(500, 'Schedule is down') },
    });
    await screen.findByText('Schedule is down');
  });
});

describe('address-book', () => {
  it('saves a trimmed address on the server for members', async () => {
    const onSaved = vi.fn();
    const saved = { id: 'a9', title: 'Office', text: '5 Lane', pincode: '574116', isDefault: false };
    const { user, calls } = renderApp(
      <NewAddressForm defaultTitle="Home" withLandmark onSaved={onSaved} onCancel={() => {}} />,
      { role: 'customer', routes: { 'POST /profile/addresses': { address: saved } } }
    );
    await user.click(screen.getByRole('button', { name: 'Office' }));
    await user.type(screen.getByLabelText(/Street Address/), '  5 Lane ');
    await user.type(screen.getByLabelText(/Landmark/), 'SBI');
    await user.click(screen.getByRole('button', { name: 'Save Address' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ title: 'Office', text: '5 Lane', landmark: 'SBI' });
  });

  it('keeps guest addresses locally and removes them', async () => {
    function Harness() {
      const { user } = useAuth();
      const { addAddress, removeAddress } = useAddressActions();
      return (
        <>
          <button onClick={() => void addAddress({ title: 'Home', text: 't', pincode: '1', isDefault: false })}>add</button>
          <button onClick={() => void removeAddress(user.addresses[0].id)}>remove</button>
          <span>count:{user.addresses.length}</span>
        </>
      );
    }
    const { user, calls } = renderApp(<Harness />);
    await user.click(screen.getByText('add'));
    expect(screen.getByText('count:1')).toBeTruthy();
    await user.click(screen.getByText('remove'));
    expect(screen.getByText('count:0')).toBeTruthy();
    expect(calls.some((c) => c.path.startsWith('/profile/addresses'))).toBe(false);
  });
});

describe('product-admin', () => {
  it('AddProductDialog creates the product and closes', async () => {
    const onClose = vi.fn();
    const { user, calls } = renderApp(<AddProductDialog onClose={onClose} />, {
      role: 'admin',
      routes: { 'GET /products': { products: [apiProduct()] }, 'POST /admin/products': { product: apiProduct({ id: 'p2' }) } },
    });
    await waitFor(() => expect(calls.some((c) => c.path === '/products')).toBe(true));
    await user.type(screen.getByLabelText('Product Name *'), 'Mustard Oil');
    await user.click(screen.getByRole('button', { name: 'Save to Store' }));
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(calls.find((c) => c.method === 'POST')?.body.name).toBe('Mustard Oil'));
  });

  it('useProductActions updates and deletes through the API', async () => {
    function Harness() {
      const { products } = useCatalog();
      const { updateStock, deleteProduct } = useProductActions();
      return (
        <>
          <span>{products.map((p) => `${p.name}:${p.stock}`).join(',')}</span>
          <button onClick={() => void updateStock('p1', 9)}>stock</button>
          <button onClick={() => void deleteProduct('p1')}>delete</button>
        </>
      );
    }
    const { user, calls } = renderApp(<Harness />, {
      role: 'admin',
      routes: {
        'GET /products': { products: [apiProduct()] },
        'PATCH /admin/products/p1': { product: apiProduct({ stockQuantity: 9 }) },
      },
    });
    await screen.findByText('Test Atta:20');
    await user.click(screen.getByText('stock'));
    await screen.findByText('Test Atta:9');
    await user.click(screen.getByText('delete'));
    await waitFor(() => expect(screen.queryByText('Test Atta:9')).toBeNull());
    expect(calls.map((c) => c.method)).toContain('DELETE');
  });
});

describe('order-receipt/ReceiptModal', () => {
  function Harness() {
    const { setReceiptOrder } = useOrders();
    useEffect(() => setReceiptOrder(order() as Order), [setReceiptOrder]);
    return <ReceiptModal />;
  }

  it('shows the invoice, prints and closes', async () => {
    window.print = vi.fn();
    const { user } = renderApp(<Harness />);
    expect(screen.getByText('#ORD-111111')).toBeTruthy();
    expect(screen.getByText('2 × ₹250 = ₹500')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Print This Receipt/ }));
    expect(window.print).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close receipt' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('take-bill', () => {
  it('builds a PDF named after the bill, with extra pages for long bills', () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ id: `${i}`, name: 'Sugar', unit: '1 kg', price: 1, qty: 1, total: 1 }));
    expect(billPdfFilename(bill() as Bill)).toBe('Bill_SN-2026-1234.pdf');
    expect(buildBillPdf(bill({ discount: 5, tax: 2 }) as Bill).getNumberOfPages()).toBe(1);
    expect(buildBillPdf(bill({ items }) as Bill).getNumberOfPages()).toBeGreaterThan(1);
  });

  it('shows the memo and shares it on WhatsApp', async () => {
    function Harness() {
      const { setActiveBill } = useBilling();
      useEffect(() => setActiveBill(bill({ discount: 5, tax: 2, notes: 'rush' }) as Bill), [setActiveBill]);
      return <TakeBillModal />;
    }
    window.open = vi.fn() as never;
    const { user } = renderApp(<Harness />);
    expect(screen.getByText('SN-2026-1234')).toBeTruthy();
    expect(screen.getByText('rush')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /WhatsApp/ }));
    expect(vi.mocked(window.open).mock.calls[0][0]).toContain('https://wa.me/9000000000?text=');
    await user.click(screen.getByRole('button', { name: 'Close Cash Memo' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
