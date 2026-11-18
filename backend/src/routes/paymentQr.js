import { Router } from 'express';
import express from 'express';
import { query } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

const QR_KEY = 'payment_qr';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Public: the store's UPI payment QR code, shown to customers on their khata page. */
router.get('/store/payment-qr', async (_req, res) => {
  try {
    const result = await query(`SELECT content_type, data FROM store_images WHERE key = $1`, [QR_KEY]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'Payment QR has not been uploaded yet' });
    res.set('Content-Type', row.content_type);
    res.set('Cache-Control', 'public, max-age=300');
    res.send(row.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Owner replaces the payment QR. Raw image body, Content-Type image/*. */
router.post(
  '/admin/store/payment-qr',
  requireAuth,
  requireAdmin,
  express.raw({ type: ALLOWED_TYPES, limit: MAX_IMAGE_BYTES }),
  async (req, res) => {
    try {
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim();
      if (!ALLOWED_TYPES.includes(contentType)) {
        return res.status(415).json({ message: 'Upload a JPEG, PNG or WebP image' });
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: 'The image is empty' });
      }
      await query(
        `INSERT INTO store_images (key, content_type, data, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
           SET content_type = EXCLUDED.content_type, data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
        [QR_KEY, contentType, req.body]
      );
      res.status(201).json({ ok: true, url: '/api/store/payment-qr' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
