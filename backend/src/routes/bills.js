import { Router } from 'express';
import { query } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

function mapBill(row, items = []) {
  const created = new Date(row.created_at);
  return {
    id: row.id,
    billNumber: row.bill_number,
    date: created.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: created.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    timestamp: created.getTime(),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerType: row.customer_type,
    items: items.map((it) => ({
      id: it.id,
      productId: it.product_id,
      name: it.name,
      unit: it.unit || '',
      price: Number(it.price),
      qty: Number(it.qty),
      total: Number(it.total),
    })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    cashierName: row.cashier_name || '',
    notes: row.notes || '',
  };
}

async function loadBillItems(billId) {
  const result = await query(
    `SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY created_at ASC`,
    [billId]
  );
  return result.rows;
}

router.get('/bills', requireAuth, requireAdmin, async (_req, res) => {
  try {
    // Every saved bill is listed; the archive is searched client-side.
    const result = await query(`SELECT * FROM bills ORDER BY created_at DESC`);
    const bills = [];
    for (const row of result.rows) {
      const items = await loadBillItems(row.id);
      bills.push(mapBill(row, items));
    }
    res.json({ bills });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/bills', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return res.status(400).json({ message: 'Bill must have at least one item' });
    }

    const customerName = String(body.customerName || 'Walk-in Customer').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const customerType = ['walk-in', 'regular', 'khata'].includes(body.customerType)
      ? body.customerType
      : 'walk-in';
    const paymentMethod = ['Cash', 'UPI', 'Kirana Khata', 'Card'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'Cash';
    const discount = Math.max(0, Number(body.discount) || 0);
    const tax = Math.max(0, Number(body.tax) || 0);
    const cashierName = String(body.cashierName || req.user.name || '').trim();
    const notes = String(body.notes || '').trim();
    const customerUserId = body.customerUserId || null;

    let subtotal = 0;
    const lines = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.qty) || 1);
      let product = null;
      if (item.productId || item.id) {
        const pr = await query(`SELECT * FROM products WHERE id = $1`, [
          item.productId || item.id,
        ]);
        product = pr.rows[0] || null;
      }

      const name = String(item.name || product?.name || '').trim();
      if (!name) continue;

      const price =
        item.price != null
          ? Number(item.price)
          : product
            ? Number(product.selling_price)
            : 0;
      const unit = String(item.unit || product?.pack_label || '').trim();
      const lineTotal = Math.round(price * qty * 100) / 100;
      subtotal += lineTotal;

      if (product && Number(product.stock_quantity) < qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (available ${product.stock_quantity})`,
        });
      }

      lines.push({ product, name, unit, price, qty, lineTotal });
    }

    if (!lines.length) {
      return res.status(400).json({ message: 'Bill must have at least one item' });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;
    if (total < 0) {
      return res.status(400).json({ message: 'Bill total cannot be negative' });
    }

    const paymentStatus = paymentMethod === 'Kirana Khata' ? 'Added to Khata' : 'Paid';
    const now = new Date();
    const billNumber = `SN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const billInsert = await query(
      `INSERT INTO bills (
         bill_number, user_id, customer_name, customer_phone, customer_type,
         subtotal, discount, tax, total, payment_method, payment_status,
         cashier_name, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        billNumber,
        customerUserId,
        customerName,
        customerPhone,
        customerType,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        paymentStatus,
        cashierName,
        notes,
      ]
    );
    const billRow = billInsert.rows[0];

    for (const line of lines) {
      await query(
        `INSERT INTO bill_items (bill_id, product_id, name, unit, price, qty, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          billRow.id,
          line.product?.id || null,
          line.name,
          line.unit,
          line.price,
          line.qty,
          line.lineTotal,
        ]
      );

      if (line.product) {
        const nextStock = Math.max(0, Number(line.product.stock_quantity) - line.qty);
        await query(
          `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [nextStock, line.product.id]
        );
        await query(
          `INSERT INTO stock_logs (product_id, change_amount, reason, note, created_by)
           VALUES ($1, $2, 'sale', $3, $4)`,
          [line.product.id, -line.qty, `Counter bill ${billNumber}`, req.user.id]
        );
      }
    }

    if (paymentMethod === 'Kirana Khata') {
      let userId = customerUserId;
      if (!userId && customerPhone) {
        const digits = customerPhone.replace(/\D/g, '').slice(-10);
        if (digits.length === 10) {
          const found = await query(
            `SELECT id FROM users
             WHERE role = 'customer'
               AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') LIKE '%' || $1
             LIMIT 1`,
            [digits]
          );
          userId = found.rows[0]?.id || null;
        }
      }
      if (!userId) {
        return res.status(400).json({
          message: 'Khata bill requires a registered customer phone or customerUserId',
        });
      }
      const groceryLabel = lines
        .map((l) => `${l.name} x${l.qty}`)
        .join(', ')
        .slice(0, 250);
      await query(
        `INSERT INTO users_balance_details (user_id, grocery_item, amount, date, note, payment_mode)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'khata')`,
        [userId, groceryLabel || 'Counter bill', total, `Bill ${billNumber}`]
      );
      await query(`UPDATE bills SET user_id = $1 WHERE id = $2`, [userId, billRow.id]);
      billRow.user_id = userId;
    }

    const billItems = await loadBillItems(billRow.id);
    res.status(201).json({ bill: mapBill(billRow, billItems) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/bills/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(`DELETE FROM bills WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Bill not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
