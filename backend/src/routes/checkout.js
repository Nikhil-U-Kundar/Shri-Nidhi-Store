import { Router } from 'express';
import passport from 'passport';
import { query, withTransaction } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

const STEPS = ['contact', 'address', 'delivery', 'payment', 'placed'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DETAILS_BYTES = 8 * 1024;

/** Attach the signed-in user when a valid token is sent; guests continue without one. */
function optionalAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (_err, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
}

const text = (value, max = 200) => (value === undefined || value === null ? null : String(value).trim().slice(0, max));

/**
 * Save one checkout step. Each call creates or updates the checkout session and adds a
 * step record, so the trail is kept even when the shopper never places the order.
 */
router.post('/checkout/steps', optionalAuth, async (req, res) => {
  try {
    const { sessionId, step, details = {} } = req.body || {};
    if (!UUID.test(String(sessionId || ''))) return res.status(400).json({ message: 'Invalid checkout session' });
    if (!STEPS.includes(step)) return res.status(400).json({ message: 'Unknown checkout step' });
    if (JSON.stringify(details).length > MAX_DETAILS_BYTES) {
      return res.status(413).json({ message: 'Checkout details are too large' });
    }

    const d = details && typeof details === 'object' ? details : {};
    const deliveryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.deliveryDate || '')) ? d.deliveryDate : null;
    const slotId = UUID.test(String(d.deliverySlotId || '')) ? d.deliverySlotId : null;
    const itemsTotal = Number.isFinite(Number(d.itemsTotal)) ? Number(d.itemsTotal) : null;
    const placed = step === 'placed';

    await withTransaction(async (tx) => {
      await tx.query(
        `INSERT INTO checkout_sessions
           (id, user_id, current_step, status, contact_name, contact_phone, delivery_address,
            delivery_mode, delivery_date, delivery_slot_id, payment_method, items_total)
         VALUES ($1, $2, $3, $4, COALESCE($5, ''), COALESCE($6, ''), COALESCE($7, ''),
                 COALESCE($8, ''), $9, $10, COALESCE($11, ''), COALESCE($12, 0))
         ON CONFLICT (id) DO UPDATE SET
           updated_at       = CURRENT_TIMESTAMP,
           user_id          = COALESCE(checkout_sessions.user_id, EXCLUDED.user_id),
           current_step     = EXCLUDED.current_step,
           status           = CASE WHEN EXCLUDED.status = 'placed' THEN 'placed' ELSE checkout_sessions.status END,
           contact_name     = COALESCE($5, checkout_sessions.contact_name),
           contact_phone    = COALESCE($6, checkout_sessions.contact_phone),
           delivery_address = COALESCE($7, checkout_sessions.delivery_address),
           delivery_mode    = COALESCE($8, checkout_sessions.delivery_mode),
           delivery_date    = COALESCE($9::date, checkout_sessions.delivery_date),
           delivery_slot_id = COALESCE($10::uuid, checkout_sessions.delivery_slot_id),
           payment_method   = COALESCE($11, checkout_sessions.payment_method),
           items_total      = COALESCE($12::numeric, checkout_sessions.items_total)`,
        [
          sessionId,
          req.user?.id ?? null,
          step,
          placed ? 'placed' : 'in_progress',
          text(d.contactName, 120),
          text(d.contactPhone, 20),
          text(d.deliveryAddress, 500),
          text(d.deliveryMode, 80),
          deliveryDate,
          slotId,
          text(d.paymentMethod, 80),
          itemsTotal,
        ]
      );

      if (placed && d.orderNumber) {
        await tx.query(
          `UPDATE checkout_sessions SET order_id = (SELECT id FROM orders WHERE order_number = $2)
           WHERE id = $1`,
          [sessionId, text(d.orderNumber, 40)]
        );
      }

      await tx.query(`INSERT INTO checkout_steps (session_id, step, details) VALUES ($1, $2, $3)`, [
        sessionId,
        step,
        JSON.stringify(d),
      ]);
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Owner: every checkout session with its steps, newest first. */
router.get('/admin/checkouts', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const sessions = (
      await query(
        `SELECT s.*, o.order_number
         FROM checkout_sessions s LEFT JOIN orders o ON o.id = s.order_id
         ORDER BY s.updated_at DESC LIMIT 500`
      )
    ).rows;
    const steps = (
      await query(
        `SELECT session_id, step, details, created_at FROM checkout_steps ORDER BY created_at ASC`
      )
    ).rows;

    const bySession = new Map();
    for (const st of steps) {
      if (!bySession.has(st.session_id)) bySession.set(st.session_id, []);
      bySession.get(st.session_id).push({ step: st.step, details: st.details, at: st.created_at });
    }

    res.json({
      checkouts: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        currentStep: s.current_step,
        updatedAt: s.updated_at,
        contactName: s.contact_name,
        contactPhone: s.contact_phone,
        deliveryAddress: s.delivery_address,
        deliveryMode: s.delivery_mode,
        deliveryDate: s.delivery_date,
        paymentMethod: s.payment_method,
        itemsTotal: Number(s.items_total),
        orderNumber: s.order_number,
        steps: bySession.get(s.id) || [],
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
