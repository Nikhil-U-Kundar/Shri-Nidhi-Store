import { describe, expect, it } from 'vitest';
import { billApi } from '@/entities/bill/api/billApi';
import { checkoutApi, newCheckoutSessionId } from '@/entities/checkout';
import { khataApi } from '@/entities/khata';
import { orderApi } from '@/entities/order/api/orderApi';
import { productApi } from '@/entities/product/api/productApi';
import { scheduleApi } from '@/entities/schedule';
import { authApi } from '@/entities/user/api/authApi';
import { userApi } from '@/entities/user';
import { apiProduct, bill, mockApi, order } from '../helpers';

const last = <T,>(list: T[]) => list[list.length - 1];

describe('billApi', () => {
  it('lists bills, defaulting to none', async () => {
    mockApi();
    await expect(billApi.list()).resolves.toEqual([]);
  });

  it('sends a product id only for catalog lines', async () => {
    const calls = mockApi({ 'POST /bills': { bill: bill() } });
    const uuid = '11111111-2222-3333-4444-555555555555';
    const line = { name: 'x', unit: '1', price: 1, qty: 1, total: 1 };
    await billApi.create({ ...bill(), items: [{ ...line, id: uuid }, { ...line, id: 'loose-1' }] } as never);
    expect(calls[0].body.items.map((i: any) => i.productId)).toEqual([uuid, undefined]);
  });

  it('deletes by id', async () => {
    const calls = mockApi();
    await billApi.remove('b1');
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/bills/b1' });
  });
});

describe('orderApi', () => {
  it('lists, creates and updates status', async () => {
    const calls = mockApi({
      'GET /orders': { orders: [order()] },
      'POST /orders': { order: order() },
      'PATCH /orders/ORD-111111/status': { order: order({ status: 'Delivered' }) },
    });
    expect(await orderApi.list()).toHaveLength(1);
    await orderApi.create({ items: [] } as never);
    expect((await orderApi.updateStatus('ORD-111111', 'Delivered')).status).toBe('Delivered');
    expect(last(calls).body).toEqual({ status: 'Delivered' });
  });
});

describe('productApi', () => {
  it('asks for visible products only when told to', async () => {
    const calls = mockApi({ 'GET /products': { products: [apiProduct()] } });
    expect((await productApi.list(true))[0].discountPrice).toBe(250);
    await productApi.list(false);
    expect(calls.map((c) => c.path)).toEqual(['/products?visible=true', '/products']);
  });

  it('creates, updates, uploads and removes', async () => {
    const calls = mockApi({
      'POST /admin/products': { product: apiProduct() },
      'PATCH /admin/products/p1': { product: apiProduct({ stockQuantity: 3 }) },
      'POST /admin/products/p1/image': { imageUrl: '/api/product-images/i1' },
    });
    await productApi.create({ name: 'Test Atta' });
    expect((await productApi.update('p1', { stock: 3 })).stock).toBe(3);
    const url = await productApi.uploadImage('p1', new File(['x'], 'a.png', { type: 'image/png' }));
    expect(url).toContain('/api/product-images/i1');
    expect(last(calls).headers['Content-Type']).toBe('image/png');
    await productApi.remove('p1');
    expect(last(calls).method).toBe('DELETE');
  });
});

describe('khataApi', () => {
  it('encodes the search text and omits it when blank', async () => {
    const calls = mockApi({ 'GET /admin/customers': { customers: [] } });
    await khataApi.customers(' a b ');
    await khataApi.customers('  ');
    expect(calls.map((c) => c.path)).toEqual(['/admin/customers?q=a%20b', '/admin/customers']);
  });

  it('records credit and payment with the server field names', async () => {
    const calls = mockApi();
    await khataApi.addCredit({ userId: 'u1', date: '2026-11-01', item: 'Tea', amount: 50, note: '' });
    await khataApi.addPayment({ userId: 'u1', date: '2026-11-01', amount: 20, paymentMode: 'upi', items: 'Tea', note: '' });
    expect(calls[0]).toMatchObject({ path: '/transactions/credit', body: { groceryItem: 'Tea' } });
    expect(calls[1]).toMatchObject({ path: '/transactions/payment', body: { paymentMode: 'upi' } });
  });

  it('reads a passbook and handles the payment QR', async () => {
    const calls = mockApi();
    await khataApi.passbook('u 1');
    await khataApi.uploadPaymentQr(new File(['x'], 'q.png', { type: 'image/png' }));
    expect(calls[0].path).toBe('/customers/u%201/passbook');
    expect(calls[1].path).toBe('/admin/store/payment-qr');
    expect(khataApi.paymentQrUrl()).toBe('/api/store/payment-qr');
    expect(khataApi.paymentQrUrl(5)).toBe('/api/store/payment-qr?v=5');
  });
});

describe('checkout, schedule, auth and user APIs', () => {
  it('makes a new v4 session id each time', () => {
    const id = newCheckoutSessionId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newCheckoutSessionId()).not.toBe(id);
  });

  it('saves a checkout step', async () => {
    const calls = mockApi();
    await checkoutApi.saveStep('s1', 'address', { deliveryAddress: 'x' });
    expect(calls[0].body).toEqual({ sessionId: 's1', step: 'address', details: { deliveryAddress: 'x' } });
  });

  it('reads the schedule and slots', async () => {
    const calls = mockApi({ 'GET /schedule/slots': { slots: [{ id: 's' }] } });
    await scheduleApi.get();
    expect(await scheduleApi.slotsFor('2026-12-01')).toHaveLength(1);
    expect(calls[1].path).toBe('/schedule/slots?date=2026-12-01');
  });

  it('signs in and registers', async () => {
    const calls = mockApi();
    await authApi.login('900', 'pw');
    await authApi.register('Asha', '900');
    expect(calls.map((c) => [c.path, c.body])).toEqual([
      ['/auth/login', { login: '900', password: 'pw' }],
      ['/auth/register', { name: 'Asha', phone: '900' }],
    ]);
  });

  it('reads the profile and manages addresses', async () => {
    const calls = mockApi({ 'GET /profile/me': { user: { id: 'u1' } }, 'POST /profile/addresses': { address: { id: 'a' } } });
    expect((await userApi.profile()).id).toBe('u1');
    expect((await userApi.addAddress({ title: 'Home', text: 't', pincode: '1', isDefault: false })).id).toBe('a');
    await userApi.removeAddress('a');
    expect(last(calls)).toMatchObject({ method: 'DELETE', path: '/profile/addresses/a' });
  });
});
