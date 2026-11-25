import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminConsole } from '@/widgets/admin-console';
import { useOrderStatusActions } from '@/widgets/admin-console/model/useOrderStatusActions';
import { CatalogTab } from '@/widgets/admin-console/ui/CatalogTab';
import { InventoryTab } from '@/widgets/admin-console/ui/InventoryTab';
import { KhataTab } from '@/widgets/admin-console/ui/KhataTab';
import { OrdersTab } from '@/widgets/admin-console/ui/OrdersTab';
import { OverviewTab } from '@/widgets/admin-console/ui/OverviewTab';
import { ReportsTab } from '@/widgets/admin-console/ui/ReportsTab';
import { PosBilling } from '@/widgets/pos-billing';
import { useBillActions } from '@/widgets/pos-billing/model/useBillActions';
import { BillArchive } from '@/widgets/pos-billing/ui/BillArchive';
import { QuickBillPanel } from '@/widgets/pos-billing/ui/QuickBillPanel';
import { apiProduct, bill, fail, order, renderApp } from '../helpers';

const routes = {
  'GET /products': { products: [apiProduct({ stockQuantity: 2 })] },
  'GET /orders': { orders: [order()] },
  'GET /bills': { bills: [bill()] },
};
const owner = (extra: object = {}) => ({ role: 'admin' as const, routes: { ...routes, ...extra } });

describe('AdminConsole', () => {
  it('shows the tab named in the URL and updates the URL on click', async () => {
    const { user, container } = renderApp(<AdminConsole billing={<p>billing-slot</p>} />, {
      ...owner(),
      path: '/admin/billing',
    });
    expect(screen.getByText('billing-slot')).toBeTruthy();
    expect(container.querySelector('.admin-glass')).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Admin sections desktop' });
    await user.click(within(nav).getByRole('button', { name: /Orders Pipeline/ }));
    expect(window.location.pathname).toBe('/admin/orders');
    expect(screen.getByText('Live Order Dispatch Pipeline')).toBeTruthy();
  });

  it('has a phone menu', async () => {
    const { user } = renderApp(<AdminConsole billing={null} />, owner());
    await user.click(screen.getByRole('button', { name: 'Open admin menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Admin menu' });
    await user.click(within(drawer).getByRole('button', { name: /Sales Reports/ }));
    expect(window.location.pathname).toBe('/admin/reports');
    expect(screen.queryByRole('dialog', { name: 'Admin menu' })).toBeNull();
  });
});

describe('admin tabs', () => {
  it('OverviewTab counts pending orders and opens add-product', async () => {
    const { user } = renderApp(<OverviewTab />, owner());
    expect(screen.getByText('Store Operations Command Center')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Add Product/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('OrdersTab changes an order status through the API', async () => {
    const { calls } = renderApp(
      <OrdersTab />,
      owner({ 'PATCH /orders/ORD-111111/status': { order: order({ status: 'Delivered' }) } })
    );
    const select = await screen.findByLabelText('Status for order ORD-111111');
    await waitFor(() => expect(calls.some((c) => c.path === '/profile/me')).toBe(true));
    fireEvent.change(select, { target: { value: 'Delivered' } });
    await screen.findByText('Order #ORD-111111 status updated to: Delivered');
    expect(calls.some((c) => c.method === 'PATCH')).toBe(true);
  });

  it('useOrderStatusActions reports a failed update', async () => {
    function Harness() {
      const update = useOrderStatusActions();
      return <button onClick={() => void update('ORD-111111', 'Delivered')}>go</button>;
    }
    const { user, calls } = renderApp(<Harness />, owner({ 'PATCH /orders/ORD-111111/status': fail(500, 'Nope') }));
    await waitFor(() => expect(calls.some((c) => c.path === '/products')).toBe(true));
    await user.click(screen.getByText('go'));
    expect(await screen.findByText('Nope')).toBeTruthy();
  });

  it('CatalogTab edits stock and deletes after confirmation', async () => {
    window.prompt = vi.fn(() => '12');
    window.confirm = vi.fn(() => true);
    const { user, calls } = renderApp(
      <CatalogTab />,
      owner({ 'PATCH /admin/products/p1': { product: apiProduct({ stockQuantity: 12 }) } })
    );
    await screen.findByText('2 in stock');
    await user.click(screen.getByRole('button', { name: 'Edit Stock' }));
    expect(await screen.findByText('12 in stock')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE')).toBe(true));
  });

  it('InventoryTab restocks low items', async () => {
    const { user, calls } = renderApp(
      <InventoryTab />,
      owner({ 'PATCH /admin/products/p1': { product: apiProduct({ stockQuantity: 26 }) } })
    );
    await screen.findByText('Only 2 units left on shelf');
    await user.click(screen.getByRole('button', { name: '+24 Restock' }));
    await screen.findByText('All products are above the reorder level.');
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ stockQuantity: 26 });
  });

  it('ReportsTab prints', async () => {
    window.print = vi.fn();
    const { user } = renderApp(<ReportsTab />, owner());
    await user.click(screen.getByRole('button', { name: /Print Daily Closing/ }));
    expect(window.print).toHaveBeenCalled();
  });

  it('KhataTab picks a customer and adds an entry', async () => {
    const customer = { id: 'u1', name: 'Asha', phoneFormatted: '90000', balanceDue: 70, totalCredit: 100, totalPaid: 30, status: 'pending', initials: 'A' };
    const { user, calls } = renderApp(
      <KhataTab />,
      owner({
        'GET /admin/customers': { customers: [customer] },
        'GET /customers/u1/passbook': { customer, summary: { balanceDue: 70, totalPaid: 30, totalCredit: 100 }, entries: [] },
      })
    );
    await user.click(await screen.findByRole('button', { name: /Asha/ }));
    expect(await screen.findByText('No entries yet.')).toBeTruthy();
    await user.type(document.getElementById('entry-amount')!, '50');
    await user.type(document.getElementById('entry-item')!, 'Tea');
    await user.click(screen.getByRole('button', { name: 'Add to khata' }));
    await waitFor(() => expect(calls.find((c) => c.path === '/transactions/credit')?.body.amount).toBe(50));
  });
});

describe('billing', () => {
  it('PosBilling switches between its three views', async () => {
    const { user } = renderApp(<PosBilling />, owner());
    expect(screen.getByText('Quick bill')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: /Create New Bill/ }));
    expect(screen.getByText('Bill register is empty')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: /Take Bill Archive/ }));
    expect(await screen.findByText('SN-2026-1234')).toBeTruthy();
  });

  it('PosBilling builds a bill from a loose item with GST and discount', async () => {
    const { user, calls } = renderApp(<PosBilling />, owner({ 'POST /bills': { bill: bill() } }));
    await user.click(screen.getByRole('tab', { name: /Create New Bill/ }));
    await user.type(screen.getByLabelText('Item Name *'), 'Sugar');
    await user.click(screen.getByRole('button', { name: /Add Line Item/ }));
    await user.click(screen.getByRole('checkbox', { name: /GST/ }));
    await user.type(screen.getByLabelText(/Discount/), '3');
    await user.click(screen.getByRole('button', { name: /Generate & Take Bill \(₹60\)/ }));
    await waitFor(() =>
      expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ subtotal: 60, tax: 3, discount: 3, total: 60 })
    );
  });

  it('QuickBillPanel totals the lines and makes the bill', async () => {
    const { user, calls } = renderApp(<QuickBillPanel />, owner({ 'POST /bills': { bill: bill() } }));
    await user.type(screen.getByPlaceholderText('e.g. Tea powder 250g'), 'Tea');
    await user.type(screen.getByLabelText('Amount in rupees'), '45');
    await user.click(screen.getByRole('button', { name: 'Make bill (₹45)' }));
    expect(await screen.findByText('Bill #SN-2026-1234 saved')).toBeTruthy();
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ total: 45, notes: 'Quick bill' });
  });

  it('QuickBillPanel refuses a half-filled line', async () => {
    const { user } = renderApp(<QuickBillPanel />, owner());
    await user.type(screen.getByPlaceholderText('e.g. Tea powder 250g'), 'Tea');
    await user.type(screen.getByLabelText('Amount in rupees'), '45');
    await user.click(screen.getByRole('button', { name: /Add another line/ }));
    await user.type(screen.getAllByPlaceholderText('e.g. Tea powder 250g')[1], 'Milk');
    await user.click(screen.getByRole('button', { name: /Make bill/ }));
    expect(await screen.findByText('Each line needs both a description and an amount')).toBeTruthy();
  });

  it('BillArchive searches and deletes', async () => {
    window.confirm = vi.fn(() => true);
    const { user, calls } = renderApp(<BillArchive />, owner());
    await screen.findByText('SN-2026-1234');
    await user.type(screen.getByLabelText('Search bills'), 'zzz');
    expect(screen.getByText('No bills match this search.')).toBeTruthy();
    await user.clear(screen.getByLabelText('Search bills'));
    await user.click(screen.getByRole('button', { name: 'Delete bill SN-2026-1234' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE')).toBe(true));
  });

  it('useBillActions explains a failed save', async () => {
    function Harness() {
      const { createBill } = useBillActions();
      return <button onClick={() => void createBill(bill() as never).catch(() => {})}>go</button>;
    }
    const { user } = renderApp(<Harness />, owner({ 'POST /bills': fail(400, 'Not enough stock') }));
    await user.click(screen.getByText('go'));
    expect(await screen.findByText('Not enough stock')).toBeTruthy();
  });
});
