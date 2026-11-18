import { Router } from 'express';
import { query, getUserBalance, withTransaction } from '../db/store.js';
import { resolveSchedule } from '../services/schedule.js';
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
      deliveryDate,
      deliveryTimeSlot,
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
    if (!String(deliveryAddress).trim()) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    const schedule = await resolveSchedule({ deliveryDate, slotId: deliveryTimeSlot });
    if (!schedule.ok) return res.status(400).json({ message: schedule.message });

    const isKhata = paymentMethod === 'Kirana Khata (Store Credit)' || paymentMethod === 'Kirana Khata';
    const isOnline = /UPI|Card|Online/.test(paymentMethod);
    const paymentStatus = isKhata ? 'Settled via Ledger' : isOnline ? 'Paid Online via Gateway' : 'Pending Cash at Doorstep';
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const placed = await withTransaction(async (tx) => {
      // Lock every product row first so concurrent orders serialise on stock.
      let subtotal = 0;
      const lines = [];
      for (const item of items) {
        const qty = Math.max(1, Math.floor(Number(item.qty || item.quantity) || 1));
        const productId = item.productId || item.id;
        const { rows } = await tx.query(`SELECT * FROM products WHERE id = $1 FOR UPDATE`, [productId]);
        const product = rows[0];
        if (!product || !product.is_visible) {
          return { error: 400, message: `Product unavailable: ${productId}` };
        }
        if (Number(product.stock_quantity) < qty) {
          return {
            error: 400,
            message: `Not enough stock for ${product.name} (available ${product.stock_quantity})`,
          };
        }
        const unitPrice = Number(product.selling_price);
        subtotal += unitPrice * qty;
        lines.push({ product, qty, unitPrice, unit: product.pack_label || item.unit || '' });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const settings = schedule.settings;
      const threshold = Number(settings.free_delivery_threshold);
      const deliveryFee = subtotal === 0 || subtotal >= threshold ? 0 : Number(settings.delivery_fee);
      const total = Math.round((subtotal + deliveryFee) * 100) / 100;

      if (isKhata) {
        // Lock the customer row so two concurrent khata orders cannot both spend the same credit.
        await tx.query(`SELECT id FROM users WHERE id = $1 FOR UPDATE`, [req.user.id]);
        const bal = await getUserBalance(req.user.id, tx.query);
        const creditLimit = Number(req.user.khata_credit_limit) || 10000;
        const available = Math.max(0, creditLimit - Math.max(0, bal.balanceDue));
        if (available < total) {
          return { error: 400, message: `Insufficient Khata credit. Available ₹${available.toLocaleString('en-IN')}` };
        }
      }

      const orderInsert = await tx.query(
        `INSERT INTO orders (
           order_number, user_id, customer_name, customer_phone, delivery_address,
           delivery_mode, payment_method, payment_status, status, subtotal,
           delivery_fee, total, estimated_delivery, notes,
           delivery_date, delivery_slot, is_preorder
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Order Placed',$9,$10,$11,$12,$13,$14,$15,true)
         RETURNING *`,
        [
          orderNumber, req.user.id, name, phone, String(deliveryAddress).trim(),
          String(deliveryMode).trim() || 'Scheduled Home Delivery', String(paymentMethod).trim(),
          paymentStatus, subtotal, deliveryFee, total,
          `${schedule.date} · ${schedule.slot.label}`, String(notes || '').trim(),
          schedule.date, schedule.slot.label,
        ]
      );
      const orderRow = orderInsert.rows[0];

      for (const line of lines) {
        await tx.query(
          `INSERT INTO order_items (order_id, product_id, name, qty, price, unit)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderRow.id, line.product.id, line.product.name, line.qty, line.unitPrice, line.unit]
        );
        await tx.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [line.qty, line.product.id]
        );
        await tx.query(
          `INSERT INTO stock_logs (product_id, change_amount, reason, note, created_by)
           VALUES ($1, $2, 'sale', $3, $4)`,
          [line.product.id, -line.qty, `Online order ${orderNumber}`, req.user.id]
        );
      }

      if (isKhata) {
        const groceryLabel = lines.map((l) => `${l.product.name} x${l.qty}`).join(', ').slice(0, 250);
        await tx.query(
          `INSERT INTO users_balance_details (user_id, grocery_item, amount, date, note, payment_mode)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'khata')`,
          [req.user.id, groceryLabel || 'Store order', total, `Order ${orderNumber}`]
        );
      }

      await tx.query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);
      return { orderRow };
    });

    if (placed.error) return res.status(placed.error).json({ message: placed.message });

    const savedItems = await loadOrderItems(placed.orderRow.id);
    res.status(201).json({ order: mapOrder(placed.orderRow, savedItems) });
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
