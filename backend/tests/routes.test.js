import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pg', async () => ({ default: await import('./fakeDb.js') }));

import billRoutes from '../src/routes/bills.js';
import catalogRoutes from '../src/routes/catalog.js';
import checkoutRoutes from '../src/routes/checkout.js';
import ledgerRoutes from '../src/routes/ledger.js';
import orderRoutes from '../src/routes/orders.js';
import qrRoutes from '../src/routes/paymentQr.js';
import imageRoutes from '../src/routes/productImages.js';
import profileRoutes from '../src/routes/profile.js';
import scheduleRoutes from '../src/routes/schedule.js';
import { CUSTOMER, OWNER, broken, client, seed } from './app.js';
import { db } from './fakeDb.js';

beforeEach(() => {
  seed();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

const productRow = {
  id: 'p1', name: 'Atta', selling_price: '250', wholesale_cost: '200', mrp: '300',
  stock_quantity: '10', low_stock_threshold: '5', is_visible: true, pack_label: '5 kg',
};
const slots = [
  [/store_settings/, []],
  [/delivery_slots/, [{ id: 's1', label: '9-11', start_hm: '09:00', end_hm: '11:00' }]],
];
const farDate = () => new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);

describe('access control', () => {
  const ownerOnly = [
    [catalogRoutes, 'post', '/api/admin/products'],
    [ledgerRoutes, 'get', '/api/admin/customers'],
    [orderRoutes, 'patch', '/api/orders/x/status'],
    [billRoutes, 'get', '/api/bills'],
    [checkoutRoutes, 'get', '/api/admin/checkouts'],
    [qrRoutes, 'post', '/api/admin/store/payment-qr'],
    [imageRoutes, 'post', '/api/admin/products/p1/image'],
    [profileRoutes, 'get', '/api/admin/customers/lookup'],
  ];

  it.each(ownerOnly.map(([router, method, url]) => [method, url, router]))(
    '%s %s needs the owner',
    async (method, url, router) => {
      expect((await client(router)[method](url)).status).toBe(401);
      expect((await client(router, CUSTOMER)[method](url)).status).toBe(403);
    }
  );
});

describe('routes/catalog', () => {
  it('lists categories and filtered products', async () => {
    seed([/FROM categories c/, [{ id: 'c1', name: 'Atta', slug: 'atta', sort_order: 1, product_count: 2 }]]);
    expect((await client(catalogRoutes).get('/api/categories')).body.categories[0].productCount).toBe(2);
    seed([/FROM products p/, [productRow]]);
    const res = await client(catalogRoutes).get('/api/products?visible=true&q=at&category=atta&lowStock=true');
    expect(res.body.products[0]).toMatchObject({ discount: 17, margin: 50, isLowStock: false });
    expect(db.find(/is_visible = TRUE/).params).toEqual(['atta', '%at%']);
  });

  it('summarises the catalog', async () => {
    seed([/active_count/, [{ active_count: 3, low_stock_count: 1, catalog_value: 10.456 }]]);
    const res = await client(catalogRoutes, OWNER).get('/api/admin/catalog/summary');
    expect(res.body).toEqual({ activeCount: 3, lowStockCount: 1, catalogValue: 10.46 });
  });

  it('creates, updates and deletes a product', async () => {
    const api = client(catalogRoutes, OWNER);
    expect((await api.post('/api/admin/products').send({})).status).toBe(400);
    seed([/INSERT INTO products/, [{ id: 'p1' }]], [/FROM products p/, [productRow]]);
    expect((await api.post('/api/admin/products').send({ name: 'Atta', sellingPrice: 250 })).status).toBe(201);

    seed([/SELECT \* FROM products WHERE id/, [productRow]], [/FROM products p/, [productRow]]);
    expect((await api.patch('/api/admin/products/p1').send({ stockQuantity: -5, name: ' New ' })).status).toBe(200);
    const update = db.find(/UPDATE products SET/).params;
    expect(update[1]).toBe('New');
    expect(update[10]).toBe(0);

    seed();
    expect((await api.patch('/api/admin/products/p9').send({})).status).toBe(404);
    expect((await api.delete('/api/admin/products/p9')).status).toBe(404);
    seed([/DELETE FROM products/, [{ id: 'p1' }]]);
    expect((await api.delete('/api/admin/products/p1')).body.ok).toBe(true);
  });

  it('adjusts stock and reads the log', async () => {
    const api = client(catalogRoutes, OWNER);
    expect((await api.post('/api/admin/products/p1/stock').send({ delta: 0 })).status).toBe(400);
    expect((await api.post('/api/admin/products/p1/stock').send({ delta: 1 })).status).toBe(404);
    seed([/SELECT \* FROM products WHERE id/, [productRow]], [/FROM products p/, [productRow]]);
    await api.post('/api/admin/products/p1/stock').send({ delta: -99 });
    expect(db.find(/UPDATE products SET stock_quantity/).params[0]).toBe(0);
    seed([/FROM stock_logs/, [{ id: 'l1', change_amount: '-2', reason: 'sale' }]]);
    expect((await api.get('/api/admin/products/p1/stock-logs')).body.logs[0].changeAmount).toBe(-2);
  });

  it('handles the older khata checkout', async () => {
    expect((await client(catalogRoutes, OWNER).post('/api/checkout/khata').send({})).status).toBe(403);
    const api = client(catalogRoutes, CUSTOMER);
    expect((await api.post('/api/checkout/khata').send({ items: [] })).status).toBe(400);
    seed([/FROM products p/, [productRow]], [/INSERT INTO users_balance_details/, [{ id: 'k1' }]]);
    const res = await api.post('/api/checkout/khata').send({ items: [{ productId: 'p1', quantity: 2 }] });
    expect(res.body).toMatchObject({ ok: true, amount: 500 });
  });

  it('answers 500 when the database fails', async () => {
    seed([/./, broken()]);
    expect((await client(catalogRoutes).get('/api/products')).status).toBe(500);
  });
});

describe('routes/orders', () => {
  const orderRow = {
    id: 'db1', order_number: 'ORD-1', user_id: 'u1', created_at: new Date().toISOString(),
    subtotal: '500', delivery_fee: '0', total: '500', status: 'Order Placed',
  };
  const body = () => ({
    items: [{ productId: 'p1', qty: 2 }], deliveryAddress: 'x', deliveryDate: farDate(), deliveryTimeSlot: 's1',
  });
  const placing = (...extra) =>
    seed(...extra, ...slots, [/FOR UPDATE/, [productRow]], [/INSERT INTO orders/, [orderRow]]);

  it('shows customers their own orders only', async () => {
    seed([/FROM orders/, [orderRow]]);
    const res = await client(orderRoutes, CUSTOMER).get('/api/orders');
    expect(res.body.orders[0]).toMatchObject({ id: 'ORD-1', date: 'Today' });
    expect(db.find(/FROM orders/).params).toEqual(['u1']);
    seed([/FROM orders/, [{ ...orderRow, user_id: 'someone-else' }]]);
    expect((await client(orderRoutes, CUSTOMER).get('/api/orders/ORD-1')).status).toBe(403);
    expect((await client(orderRoutes, OWNER).get('/api/orders/ORD-1')).status).toBe(200);
    seed();
    expect((await client(orderRoutes, OWNER).get('/api/orders/none')).status).toBe(404);
  });

  it('places an order priced from the database and reduces stock', async () => {
    placing();
    const res = await client(orderRoutes, CUSTOMER).post('/api/orders').send(body());
    expect(res.status).toBe(201);
    const insert = db.find(/INSERT INTO orders/).params;
    expect(insert.slice(8, 11)).toEqual([500, 0, 500]);
    expect(db.find(/stock_quantity - \$1/).params).toEqual([2, 'p1']);
    expect(db.find(/COMMIT/)).toBeTruthy();
  });

  it.each([
    ['empty cart', { items: [] }, 'Cart is empty'],
    ['no address', { deliveryAddress: ' ' }, 'address is required'],
    ['bad slot', { deliveryTimeSlot: 'zz' }, 'time slot'],
    ['too many', { items: [{ productId: 'p1', qty: 99 }] }, 'Not enough stock'],
  ])('refuses an order with %s', async (_name, change, message) => {
    placing();
    const res = await client(orderRoutes, CUSTOMER).post('/api/orders').send({ ...body(), ...change });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain(message);
  });

  it('enforces the khata credit limit and records the debit', async () => {
    const khata = { ...body(), paymentMethod: 'Kirana Khata' };
    placing([/FROM users_balance_details/, [{ total: 9900 }]], [/FROM user_paid_details/, [{ total: 0 }]]);
    const refused = await client(orderRoutes, CUSTOMER).post('/api/orders').send(khata);
    expect(refused.body.message).toContain('Insufficient Khata');
    placing([/FROM users_balance_details WHERE/, [{ total: 0 }]], [/FROM user_paid_details/, [{ total: 0 }]]);
    expect((await client(orderRoutes, CUSTOMER).post('/api/orders').send(khata)).status).toBe(201);
    expect(db.find(/INSERT INTO users_balance_details/)).toBeTruthy();
  });

  it('lets the owner change a status', async () => {
    const api = client(orderRoutes, OWNER);
    expect((await api.patch('/api/orders/ORD-1/status').send({ status: 'Lost' })).status).toBe(400);
    expect((await api.patch('/api/orders/ORD-1/status').send({ status: 'Delivered' })).status).toBe(404);
    seed([/UPDATE orders/, [{ ...orderRow, status: 'Delivered' }]]);
    expect((await api.patch('/api/orders/ORD-1/status').send({ status: 'Delivered' })).body.order.status).toBe('Delivered');
  });
});

describe('routes/checkout', () => {
  const sessionId = '11111111-2222-4333-8444-555555555555';

  it('validates each step', async () => {
    const api = client(checkoutRoutes);
    const send = (body) => api.post('/api/checkout/steps').send(body);
    expect((await send({ sessionId: 'x', step: 'contact' })).status).toBe(400);
    expect((await send({ sessionId, step: 'dance' })).status).toBe(400);
    expect((await send({ sessionId, step: 'contact', details: { a: 'x'.repeat(9000) } })).status).toBe(413);
  });

  it('saves a guest step and links a signed-in user', async () => {
    expect((await client(checkoutRoutes).post('/api/checkout/steps').send({ sessionId, step: 'contact' })).status).toBe(201);
    expect(db.find(/INSERT INTO checkout_sessions/).params[1]).toBeNull();
    seed();
    await client(checkoutRoutes, CUSTOMER)
      .post('/api/checkout/steps')
      .send({ sessionId, step: 'placed', details: { orderNumber: 'ORD-1', deliveryDate: 'bad' } });
    const saved = db.find(/INSERT INTO checkout_sessions/).params;
    expect([saved[1], saved[3], saved[8]]).toEqual(['u1', 'placed', null]);
    expect(db.find(/SET order_id/).params).toEqual([sessionId, 'ORD-1']);
  });

  it('lists sessions with their steps for the owner', async () => {
    seed(
      [/FROM checkout_sessions s/, [{ id: sessionId, status: 'placed', items_total: '90' }]],
      [/FROM checkout_steps/, [{ session_id: sessionId, step: 'contact', details: {} }]]
    );
    const res = await client(checkoutRoutes, OWNER).get('/api/admin/checkouts');
    expect(res.body.checkouts[0]).toMatchObject({ itemsTotal: 90, steps: [{ step: 'contact' }] });
  });

  it('answers 500 when saving fails', async () => {
    seed([/checkout_sessions/, broken()]);
    expect((await client(checkoutRoutes).post('/api/checkout/steps').send({ sessionId, step: 'contact' })).status).toBe(500);
  });
});

describe('routes/ledger', () => {
  const totals = [
    [/SUM\(amount\).*[\s\S]*users_balance_details/, [{ total: 100 }]],
    [/SUM\(amount\).*[\s\S]*user_paid_details/, [{ total: 30 }]],
  ];
  const aCustomer = [/role = 'customer'/, [CUSTOMER]];

  it('summarises the ledger', async () => {
    seed(...totals, [/SELECT id FROM users WHERE role/, [{ id: 'u1' }]], [/CURRENT_DATE/, [{ total: 5 }]]);
    const res = await client(ledgerRoutes, OWNER).get('/api/admin/summary');
    expect(res.body).toMatchObject({ totalOutstanding: 70, pendingCount: 1, customerCount: 1 });
  });

  it('lists and searches customers', async () => {
    seed(...totals, [/ORDER BY name/, [{ ...CUSTOMER }]]);
    const api = client(ledgerRoutes, OWNER);
    expect((await api.get('/api/admin/customers?q=asha')).body.customers[0]).toMatchObject({ status: 'pending', initials: 'AR' });
    expect((await api.get('/api/admin/customers?q=zzz')).body.total).toBe(0);
    expect((await api.get('/api/admin/customers?filter=clear')).body.total).toBe(0);
  });

  it('adds a customer once', async () => {
    const api = client(ledgerRoutes, OWNER);
    expect((await api.post('/api/admin/customers').send({ name: 'A' })).status).toBe(400);
    seed([/INSERT INTO users/, [{ id: 'n' }]]);
    expect((await api.post('/api/admin/customers').send({ name: 'A', email: 'a@x' })).status).toBe(201);
    seed([/SELECT id FROM users/, [{ id: 'n' }]]);
    expect((await api.post('/api/admin/customers').send({ name: 'A', email: 'a@x' })).status).toBe(409);
  });

  it('keeps one customer out of another passbook', async () => {
    const other = { ...CUSTOMER, id: 'u2' };
    seed(...totals, [/SELECT \* FROM users WHERE id/, ([id]) => (id === 'u2' ? [other] : [CUSTOMER])]);
    const api = client(ledgerRoutes, CUSTOMER);
    expect((await api.get('/api/customers/u2')).status).toBe(403);
    expect((await api.get('/api/customers/u2/passbook')).status).toBe(403);
    expect((await api.get('/api/customers/u1')).status).toBe(200);
  });

  it('returns the passbook newest first with running balances', async () => {
    seed(
      ...totals,
      [/SELECT \* FROM users_balance_details/, [{ id: 'c', amount: '100', date: '2026-01-01', grocery_item: 'Rice' }]],
      [/SELECT \* FROM user_paid_details/, [{ id: 'p', amount: '30', date: '2026-01-02', payment_mode: 'upi' }]]
    );
    const res = await client(ledgerRoutes, CUSTOMER).get('/api/customers/u1/passbook');
    expect(res.body.entries.map((e) => [e.id, e.balanceAfter])).toEqual([['p', 70], ['c', 100]]);
    expect(res.body.entries[0].title).toBe('UPI Payment Received');
  });

  it.each(['credit', 'payment'])('records a %s with date checks', async (kind) => {
    const api = client(ledgerRoutes, OWNER);
    const url = `/api/transactions/${kind}`;
    const send = (body) => api.post(url).send(body);
    expect((await send({ userId: 'u1', amount: -1 })).status).toBe(400);
    expect((await send({ userId: 'u1', amount: 5, date: '1/1/26' })).body.message).toContain('YYYY-MM-DD');
    expect((await send({ userId: 'u1', amount: 5, date: '2026-02-30' })).body.message).toContain('valid date');
    expect((await send({ userId: 'u1', amount: 5, date: '2999-01-01' })).body.message).toContain('future');
    seed();
    expect((await send({ userId: 'nobody', amount: 5 })).status).toBe(404);
    seed(...totals, aCustomer, [/INSERT INTO/, [{ id: 'e1' }]]);
    const res = await send({ userId: 'u1', amount: 5, date: '2026-01-05' });
    expect(res.status).toBe(201);
    expect(res.body.balance.balanceDue).toBe(70);
  });

  it('builds a reminder message', async () => {
    const api = client(ledgerRoutes, OWNER);
    expect((await api.post('/api/customers/u9/reminder')).status).toBe(404);
    seed([/role = 'customer'/, [{ ...CUSTOMER, phone: '1' }]]);
    expect((await api.post('/api/customers/u1/reminder')).status).toBe(400);
    seed(...totals, aCustomer);
    expect((await api.post('/api/customers/u1/reminder')).body.whatsappHref).toContain('https://wa.me/919000000000');
  });
});

describe('routes/bills', () => {
  const billRow = { id: 'b1', bill_number: 'SN-1', created_at: new Date().toISOString(), total: '90' };
  const items = [{ name: 'Sugar', qty: 2, price: 45 }];
  const inserting = (...extra) => seed(...extra, [/INSERT INTO bills/, [billRow]]);

  it('lists and deletes bills', async () => {
    seed([/FROM bills/, [billRow]], [/FROM bill_items/, [{ id: 'i', price: '45', qty: '2', total: '90' }]]);
    expect((await client(billRoutes, OWNER).get('/api/bills')).body.bills[0].items[0].total).toBe(90);
    seed();
    expect((await client(billRoutes, OWNER).delete('/api/bills/b9')).status).toBe(404);
    seed([/DELETE FROM bills/, [{ id: 'b1' }]]);
    expect((await client(billRoutes, OWNER).delete('/api/bills/b1')).body.ok).toBe(true);
  });

  it('validates a new bill', async () => {
    const api = client(billRoutes, OWNER);
    expect((await api.post('/api/bills').send({ items: [] })).status).toBe(400);
    expect((await api.post('/api/bills').send({ items: [{ qty: 1 }] })).status).toBe(400);
    expect((await api.post('/api/bills').send({ items, discount: 500 })).body.message).toContain('negative');
    seed([/SELECT \* FROM products/, [{ ...productRow, stock_quantity: 1 }]]);
    const short = await api.post('/api/bills').send({ items: [{ productId: 'p1', qty: 5 }] });
    expect(short.body.message).toContain('Not enough stock');
  });

  it('saves totals and reduces stock', async () => {
    inserting([/SELECT \* FROM products/, [productRow]]);
    const res = await client(billRoutes, OWNER)
      .post('/api/bills')
      .send({ items: [{ productId: 'p1', qty: 2 }], discount: 10, tax: 5 });
    expect(res.status).toBe(201);
    expect(db.find(/INSERT INTO bills/).params.slice(5, 9)).toEqual([500, 10, 5, 495]);
    expect(db.find(/UPDATE products SET stock_quantity/).params[0]).toBe(8);
  });

  it('puts a khata bill on a registered customer', async () => {
    const send = (body) => client(billRoutes, OWNER).post('/api/bills').send({ items, paymentMethod: 'Kirana Khata', ...body });
    inserting();
    expect((await send({ customerPhone: '123' })).status).toBe(400);
    inserting([/SELECT id FROM users/, [{ id: 'u1' }]]);
    expect((await send({ customerPhone: '+91 9000000000' })).status).toBe(201);
    expect(db.find(/INSERT INTO users_balance_details/).params[0]).toBe('u1');
  });
});

describe('routes/profile', () => {
  const addressRow = { id: 'a1', title: 'Home', text: 't', is_default: true };

  it('returns the profile with ledger and available credit', async () => {
    seed(
      [/FROM user_addresses/, [addressRow]],
      [/SUM[\s\S]*users_balance_details/, [{ total: 100 }]],
      [/SUM[\s\S]*user_paid_details/, [{ total: 0 }]],
      [/SELECT \* FROM users_balance_details/, [{ id: 'c', amount: '100', date: '2026-01-01', grocery_item: 'Rice' }]],
      [/SELECT \* FROM users WHERE id = \$1$/, [CUSTOMER]]
    );
    const res = await client(profileRoutes, CUSTOMER).get('/api/profile/me');
    expect(res.body.user).toMatchObject({ khataBalance: 9900, balanceDue: 100, addresses: [{ id: 'a1', isDefault: true }] });
    expect(res.body.user.khataLedger[0]).toMatchObject({ type: 'debit', amount: 100 });
    expect(res.body.user.password).toBeUndefined();
  });

  it('adds and removes addresses for the signed-in user only', async () => {
    const api = client(profileRoutes, CUSTOMER);
    expect((await api.post('/api/profile/addresses').send({ text: ' ' })).status).toBe(400);
    seed([/INSERT INTO user_addresses/, [addressRow]]);
    expect((await api.post('/api/profile/addresses').send({ text: 't', isDefault: true })).status).toBe(201);
    expect(db.find(/SET is_default = FALSE/).params).toEqual(['u1']);
    seed();
    expect((await api.delete('/api/profile/addresses/a9')).status).toBe(404);
    expect(db.find(/DELETE FROM user_addresses/).params).toEqual(['a9', 'u1']);
    seed([/DELETE FROM user_addresses/, [{ id: 'a1' }]]);
    expect((await api.delete('/api/profile/addresses/a1')).body.ok).toBe(true);
  });

  it('looks a customer up by phone', async () => {
    const api = client(profileRoutes, OWNER);
    expect((await api.get('/api/admin/customers/lookup?phone=12')).status).toBe(400);
    expect((await api.get('/api/admin/customers/lookup?phone=9000000000')).status).toBe(404);
    seed([/regexp_replace/, [CUSTOMER]], [/SUM/, [{ total: 0 }]]);
    expect((await api.get('/api/admin/customers/lookup?phone=9000000000')).body.customer.id).toBe('u1');
  });
});

describe('routes/schedule', () => {
  it('publishes the booking rules and slots', async () => {
    seed(...slots);
    const res = await client(scheduleRoutes).get('/api/schedule');
    expect(res.body).toMatchObject({ advanceHours: 24, deliveryFee: 40, sameDayDelivery: false });
    expect((await client(scheduleRoutes).get(`/api/schedule/slots?date=${farDate()}`)).body.slots).toHaveLength(1);
    seed([/store_settings/, broken()]);
    expect((await client(scheduleRoutes).get('/api/schedule')).status).toBe(500);
  });
});

describe.each([
  ['routes/paymentQr', qrRoutes, '/api/admin/store/payment-qr', '/api/store/payment-qr', /FROM store_images/],
  ['routes/productImages', imageRoutes, '/api/admin/products/p1/image', '/api/product-images/i1', /FROM product_images/],
])('%s', (_name, router, uploadUrl, readUrl, table) => {
  const upload = (type, data) => client(router, OWNER).post(uploadUrl).set('Content-Type', type).send(data);

  it('accepts only non-empty images', async () => {
    expect((await upload('text/plain', 'x')).status).toBe(415);
    expect((await upload('image/png', Buffer.alloc(0))).status).toBeGreaterThanOrEqual(400);
    seed([/SELECT id FROM products/, [{ id: 'p1' }]], [/RETURNING id/, [{ id: 'i1' }]]);
    expect((await upload('image/png', Buffer.from('png'))).status).toBe(201);
  });

  it('serves a stored image or says it is missing', async () => {
    expect((await client(router).get(readUrl)).status).toBe(404);
    seed([table, [{ content_type: 'image/png', data: Buffer.from('png') }]]);
    const res = await client(router).get(readUrl);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['cache-control']).toContain('public');
  });
});
