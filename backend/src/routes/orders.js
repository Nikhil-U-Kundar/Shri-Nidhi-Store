import { Router } from 'express';
import { query, getUserBalance } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

const ORDER_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

function formatRelativeDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function mapOrder(row, items = []) {
  return {
    id: row.order_number,
    dbId: row.id,
    date: formatRelativeDate(row.created_at),
    timestamp: new Date(row.created_at).getTime(),
    items: items.map((it) => ({
      name: it.name,
      qty: Number(it.qty),
      price: Number(it.price),
      unit: it.unit || '',
    })),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    deliveryAddress: row.delivery_address,
    deliveryMode: row.delivery_mode,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    estimatedDelivery: row.estimated_delivery,
  };
}

async function loadOrderItems(orderId) {
  const result = await query(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );
  return result.rows;
}

async function loadOrdersWithItems(whereSql, params = []) {
  const result = await query(
    `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`,
    params
  );
  const orders = [];
  for (const row of result.rows) {
    const items = await loadOrderItems(row.id);
    orders.push(mapOrder(row, items));
  }
  return orders;
}

router.get('/orders', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const orders = await loadOrdersWithItems('');
      return res.json({ orders });
    }
    const orders = await loadOrdersWithItems(`WHERE user_id = $1`, [req.user.id]);
    return res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/orders/:orderNumber', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM orders WHERE order_number = $1 LIMIT 1`, [
      req.params.orderNumber,
    ]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const items = await loadOrderItems(row.id);
    res.json({ order: mapOrder(row, items) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/orders', requireAuth, async (req, res) => {
  try {
    const {
      items = [],
      deliveryAddress = '',
      deliveryMode = 'Home Delivery',
      paymentMethod = 'Cash on Delivery',
      customerName,
      customerPhone,
      notes = '',
    } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const name = String(customerName || req.user.name || '').trim();
    const phone = String(customerPhone || req.user.phone || '').trim();
    if (!name || !phone) {
      return res.status(400).json({ message: 'Customer name and phone are required' });
    }

    let subtotal = 0;
    const lines = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.qty || item.quantity) || 1);
      const productId = item.productId || item.id;
      const productResult = await query(`SELECT * FROM products WHERE id = $1`, [productId]);
      const product = productResult.rows[0];
      if (!product || !product.is_visible) {
        return res.status(400).json({ message: `Product unavailable: ${productId}` });
      }
      if (Number(product.stock_quantity) < qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (available ${product.stock_quantity})`,
        });
      }
      const unitPrice = Number(product.selling_price);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      lines.push({
        product,
        qty,
        unitPrice,
        unit: product.pack_label || item.unit || '',
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    let paymentStatus = 'Pending Cash at Doorstep';
    if (paymentMethod === 'Kirana Khata (Store Credit)' || paymentMethod === 'Kirana Khata') {
      const bal = await getUserBalance(req.user.id);
      const creditLimit = Number(req.user.khata_credit_limit) || 10000;
      const available = Math.max(0, creditLimit - Math.max(0, bal.balanceDue));
      if (available < total) {
        return res.status(400).json({
          message: `Insufficient Khata credit. Available ₹${available.toLocaleString('en-IN')}`,
        });
      }
      paymentStatus = 'Settled via Ledger';
    } else if (
      paymentMethod.includes('UPI') ||
      paymentMethod.includes('Card') ||
      paymentMethod.includes('Online')
    ) {
      paymentStatus = 'Paid Online via Gateway';
    }

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderInsert = await query(
      `INSERT INTO orders (
         order_number, user_id, customer_name, customer_phone, delivery_address,
         delivery_mode, payment_method, payment_status, status, subtotal,
         delivery_fee, total, estimated_delivery, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Order Placed',$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        orderNumber,
        req.user.id,
        name,
        phone,
        String(deliveryAddress).trim(),
        String(deliveryMode).trim() || 'Home Delivery',
        String(paymentMethod).trim(),
        paymentStatus,
        subtotal,
        deliveryFee,
        total,
        'Within 25-35 minutes',
        String(notes || '').trim(),
      ]
    );
    const orderRow = orderInsert.rows[0];

    for (const line of lines) {
      await query(
        `INSERT INTO order_items (order_id, product_id, name, qty, price, unit)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          orderRow.id,
          line.product.id,
          line.product.name,
          line.qty,
          line.unitPrice,
          line.unit,
        ]
      );

      const nextStock = Number(line.product.stock_quantity) - line.qty;
      await query(
        `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [nextStock, line.product.id]
      );
      await query(
        `INSERT INTO stock_logs (product_id, change_amount, reason, note, created_by)
         VALUES ($1, $2, 'sale', $3, $4)`,
        [line.product.id, -line.qty, `Online order ${orderNumber}`, req.user.id]
      );
    }

    if (paymentMethod === 'Kirana Khata (Store Credit)' || paymentMethod === 'Kirana Khata') {
      const groceryLabel = lines
        .map((l) => `${l.product.name} x${l.qty}`)
        .join(', ')
        .slice(0, 250);
      await query(
        `INSERT INTO users_balance_details (user_id, grocery_item, amount, date, note, payment_mode)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'khata')`,
        [req.user.id, groceryLabel || 'Store order', total, `Order ${orderNumber}`]
      );
    }

    await query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);

    const savedItems = await loadOrderItems(orderRow.id);
    res.status(201).json({ order: mapOrder(orderRow, savedItems) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/orders/:orderNumber/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim();
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const result = await query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE order_number = $2 RETURNING *`,
      [status, req.params.orderNumber]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Order not found' });
    const items = await loadOrderItems(result.rows[0].id);
    res.json({ order: mapOrder(result.rows[0], items) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
