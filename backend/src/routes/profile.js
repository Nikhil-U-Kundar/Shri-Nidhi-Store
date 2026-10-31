import { Router } from 'express';
import { query, getUserBalance } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

function mapAddress(row) {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    landmark: row.landmark || '',
    pincode: row.pincode || '',
    isDefault: Boolean(row.is_default),
  };
}

function mapLedgerEntry(e) {
  return {
    id: e.id,
    date: new Date(e.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    }),
    timestamp: new Date(e.date).getTime(),
    desc: e.type === 'credit' ? e.description || e.title : e.title,
    type: e.type === 'credit' ? 'debit' : 'credit',
    amount: Number(e.amount),
    balanceAfter: Number(e.balanceAfter),
    referenceOrder: e.type === 'credit' ? e.description : undefined,
  };
}

router.get('/profile/me', requireAuth, async (req, res) => {
  try {
    const userResult = await query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addresses = (
      await query(
        `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [user.id]
      )
    ).rows.map(mapAddress);

    let khataBalance = 0;
    let khataLedger = [];
    let khataCreditLimit = Number(user.khata_credit_limit) || 10000;

    if (user.role === 'customer') {
      const bal = await getUserBalance(user.id);
      // Proto uses positive khataBalance as available credit remaining-ish,
      // but AccountView treats it as store-credit wallet. We expose:
      // available = creditLimit - balanceDue (how much more they can charge)
      // and also balanceDue for passbook clarity.
      const available = Math.max(0, khataCreditLimit - Math.max(0, bal.balanceDue));
      khataBalance = available;

      const passbookCredits = (
        await query(`SELECT * FROM users_balance_details WHERE user_id = $1`, [user.id])
      ).rows.map((r) => ({
        id: r.id,
        type: 'credit',
        title: r.note || 'Grocery Purchase',
        description: r.grocery_item,
        amount: Number(r.amount),
        date: r.date,
      }));
      const passbookPaid = (
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
      }));

      const entries = [...passbookCredits, ...passbookPaid].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      let runningDue = 0;
      const withBalance = entries.map((e) => {
        if (e.type === 'credit') runningDue += e.amount;
        else runningDue -= e.amount;
        runningDue = Math.round(runningDue * 100) / 100;
        return { ...e, balanceAfter: Math.max(0, khataCreditLimit - runningDue) };
      });
      khataLedger = withBalance.reverse().map(mapLedgerEntry);
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        addresses,
        khataBalance,
        khataCreditLimit,
        khataLedger,
        balanceDue:
          user.role === 'customer'
            ? (await getUserBalance(user.id)).balanceDue
            : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/profile/addresses', requireAuth, async (req, res) => {
  try {
    const { title = 'Home', text, landmark = '', pincode = '', isDefault = false } =
      req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Address text is required' });
    }

    if (isDefault) {
      await query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`, [
        req.user.id,
      ]);
    }

    const result = await query(
      `INSERT INTO user_addresses (user_id, title, text, landmark, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        req.user.id,
        String(title).trim() || 'Home',
        String(text).trim(),
        String(landmark || '').trim(),
        String(pincode || '').trim(),
        Boolean(isDefault),
      ]
    );
    res.status(201).json({ address: mapAddress(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/profile/addresses/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Address not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Customer or admin records a khata repayment (payment against dues). */
router.post('/profile/khata/repay', requireAuth, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const note = String(req.body?.note || 'Cash Payment recorded at Shop Counter').trim();
    let userId = req.user.id;

    if (req.user.role === 'admin' && req.body?.userId) {
      userId = req.body.userId;
    } else if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can repay their own khata' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    await query(
      `INSERT INTO user_paid_details (user_id, amount, date, note, payment_mode)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [userId, amount, note, String(req.body?.paymentMode || 'cash')]
    );

    const bal = await getUserBalance(userId);
    res.status(201).json({ ok: true, balance: bal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/customers/lookup', requireAuth, requireAdmin, async (req, res) => {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length < 10) {
      return res.status(400).json({ message: 'Enter a 10-digit phone' });
    }
    const result = await query(
      `SELECT id, name, phone, email FROM users
       WHERE role = 'customer'
         AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') LIKE '%' || $1
       LIMIT 1`,
      [phone]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'No customer found for this phone' });
    }
    const u = result.rows[0];
    const bal = await getUserBalance(u.id);
    res.json({
      customer: {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        balanceDue: bal.balanceDue,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
