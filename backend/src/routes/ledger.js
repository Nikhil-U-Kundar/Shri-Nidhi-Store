import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  query,
  getUserBalance,
  maskPhone,
  formatPhone,
  isSameDay,
} from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

function initialsFrom(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

async function daysPending(userId) {
  const result = await query(
    `SELECT date FROM users_balance_details
     WHERE user_id = $1
     ORDER BY date ASC
     LIMIT 1`,
    [userId]
  );
  if (!result.rows.length) return 0;
  const oldest = new Date(result.rows[0].date);
  return Math.max(0, Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)));
}

async function lastActivity(userId) {
  const credits = await query(
    `SELECT *, 'credit' AS kind FROM users_balance_details WHERE user_id = $1`,
    [userId]
  );
  const paid = await query(
    `SELECT *, 'paid' AS kind FROM user_paid_details WHERE user_id = $1`,
    [userId]
  );
  const all = [...credits.rows, ...paid.rows].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  if (!all.length) return { text: 'No activity yet', type: 'none' };
  const latest = all[0];
  if (latest.kind === 'paid') {
    const mode = (latest.payment_mode || 'cash').toUpperCase();
    const when = isSameDay(latest.date)
      ? 'Today'
      : new Date(latest.date).toLocaleDateString('en-IN');
    return {
      text: `Recent: Received ₹${Number(latest.amount).toLocaleString('en-IN')} via ${mode} (${when} • Paid)`,
      type: 'paid',
    };
  }
  const pending = await daysPending(userId);
  return {
    text: `Pending for ${pending} days • ${String(latest.grocery_item || 'Credit').slice(0, 24)}...`,
    type: 'pending',
  };
}

router.get('/admin/summary', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const customers = await query(`SELECT id FROM users WHERE role = 'customer'`);
    let totalOutstanding = 0;
    let pendingCount = 0;

    for (const c of customers.rows) {
      const bal = await getUserBalance(c.id);
      totalOutstanding += Math.max(0, bal.balanceDue);
      if (bal.balanceDue > 0) pendingCount += 1;
    }

    const todayReceived = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total
       FROM user_paid_details
       WHERE date::date = CURRENT_DATE`
    );
    const todayCredit = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total
       FROM users_balance_details
       WHERE date::date = CURRENT_DATE`
    );

    res.json({
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      customerCount: customers.rows.length,
      pendingCount,
      todayReceived: Number(todayReceived.rows[0].total),
      todayCredit: Number(todayCredit.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/customers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase().trim();
    const filter = String(req.query.filter || 'all');

    let customers = (
      await query(`SELECT * FROM users WHERE role = 'customer' ORDER BY name ASC`)
    ).rows;

    if (q) {
      customers = customers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          String(u.phone).includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    let list = [];
    for (const u of customers) {
      const bal = await getUserBalance(u.id);
      const activity = await lastActivity(u.id);
      list.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        phoneMasked: maskPhone(u.phone),
        phoneFormatted: formatPhone(u.phone),
        balanceDue: bal.balanceDue,
        totalPaid: bal.totalPaid,
        totalCredit: bal.totalCredit,
        status: bal.balanceDue > 0 ? 'pending' : 'clear',
        recentActivity: activity.text,
        activityType: activity.type,
        daysPending: await daysPending(u.id),
        initials: initialsFrom(u.name),
      });
    }

    if (filter === 'pending') list = list.filter((c) => c.status === 'pending');
    if (filter === 'clear') list = list.filter((c) => c.status === 'clear');

    list.sort((a, b) => b.balanceDue - a.balanceDue);
    res.json({ customers: list, total: list.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/customers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password = 'password123' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Customer email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, email, name, phone, role, created_at, updated_at`,
      [email, hash, name, phone || '']
    );

    res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/customers/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
      req.params.id,
    ]);
    const user = result.rows[0];
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const bal = await getUserBalance(user.id);
    res.json({
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneFormatted: formatPhone(user.phone),
        phoneMasked: maskPhone(user.phone),
        initials: initialsFrom(user.name),
        verified: true,
        balanceDue: bal.balanceDue,
        totalPaid: bal.totalPaid,
        totalCredit: bal.totalCredit,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/customers/:id/passbook', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
      req.params.id,
    ]);
    const user = result.rows[0];
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const credits = (
      await query(`SELECT * FROM users_balance_details WHERE user_id = $1`, [user.id])
    ).rows.map((r) => ({
      id: r.id,
      type: 'credit',
      title: r.note || 'Grocery Purchase',
      description: r.grocery_item,
      amount: Number(r.amount),
      date: r.date,
      payment_mode: r.payment_mode,
      note: r.note,
    }));

    const paid = (
      await query(`SELECT * FROM user_paid_details WHERE user_id = $1`, [user.id])
    ).rows.map((r) => ({
      id: r.id,
      type: 'payment',
      title:
        r.payment_mode === 'upi'
          ? 'UPI Payment Received'
          : r.payment_mode === 'bank'
            ? 'Bank Transfer Received'
            : 'Cash Paid at Counter',
      description: r.note || 'Payment received',
      amount: Number(r.amount),
      date: r.date,
      payment_mode: r.payment_mode,
      note: r.note,
    }));

    const entries = [...credits, ...paid].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let running = 0;
    const withBalance = entries.map((e) => {
      if (e.type === 'credit') running += e.amount;
      else running -= e.amount;
      running = Math.round(running * 100) / 100;
      return { ...e, balanceAfter: running };
    });

    const bal = await getUserBalance(user.id);
    res.json({
      customer: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        phoneFormatted: formatPhone(user.phone),
        initials: initialsFrom(user.name),
      },
      summary: {
        balanceDue: bal.balanceDue,
        totalPaid: bal.totalPaid,
        totalCredit: bal.totalCredit,
      },
      entries: withBalance.reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/transactions/credit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, groceryItem, note, paymentMode = 'credit' } = req.body;
    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid userId and amount required' });
    }

    const user = (
      await query(`SELECT * FROM users WHERE id = $1 AND role = 'customer' LIMIT 1`, [
        userId,
      ])
    ).rows[0];
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    const entry = (
      await query(
        `INSERT INTO users_balance_details
         (user_id, grocery_item, amount, date, note, payment_mode)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         RETURNING *`,
        [
          userId,
          groceryItem || note || 'Credit purchase',
          Number(amount),
          note || 'Give Credit',
          paymentMode,
        ]
      )
    ).rows[0];

    const bal = await getUserBalance(userId);
    res.status(201).json({ entry, balance: bal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/transactions/payment', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, note, paymentMode = 'cash' } = req.body;
    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid userId and amount required' });
    }

    const user = (
      await query(`SELECT * FROM users WHERE id = $1 AND role = 'customer' LIMIT 1`, [
        userId,
      ])
    ).rows[0];
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    const entry = (
      await query(
        `INSERT INTO user_paid_details
         (user_id, amount, date, note, payment_mode)
         VALUES ($1, $2, NOW(), $3, $4)
         RETURNING *`,
        [userId, Number(amount), note || 'Payment received', paymentMode]
      )
    ).rows[0];

    const bal = await getUserBalance(userId);
    res.status(201).json({ entry, balance: bal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/customers/:id/reminder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM users WHERE id = $1 AND role = 'customer' LIMIT 1`,
      [req.params.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    const phoneDigits = String(user.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ message: 'Customer has no valid phone number' });
    }

    const bal = await getUserBalance(user.id);
    const ownerName = process.env.SHOP_OWNER_NAME || 'Mallika';
    const storeName = 'Shree Nidhi Store';
    const message =
      `Namaste ${user.name}, reminder from ${storeName}. ` +
      `Your outstanding due is ₹${Number(bal.balanceDue).toLocaleString('en-IN')}. ` +
      `Please pay soon. - ${ownerName}`;

    // Return SMS / WhatsApp deep links so the phone notification can be sent
    const waPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
    const smsHref = `sms:${phoneDigits}?body=${encodeURIComponent(message)}`;
    const whatsappHref = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

    console.log(`[reminder] to ${phoneDigits}: ${message}`);

    res.json({
      ok: true,
      customerId: user.id,
      customerName: user.name,
      phone: phoneDigits,
      message,
      smsHref,
      whatsappHref,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
