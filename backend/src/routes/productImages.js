import { Router } from 'express';
import express from 'express';
import { query } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Owner uploads a product photo as the raw request body (Content-Type: image/*). */
router.post(
  '/admin/products/:id/image',
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

      const product = await query(`SELECT id FROM products WHERE id = $1`, [req.params.id]);
      if (!product.rows.length) return res.status(404).json({ message: 'Product not found' });

      const stored = await query(
        `INSERT INTO product_images (product_id, content_type, data) VALUES ($1, $2, $3) RETURNING id`,
        [req.params.id, contentType, req.body]
      );
      const imageUrl = `/api/product-images/${stored.rows[0].id}`;
      await query(
        `UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [imageUrl, req.params.id]
      );
      res.status(201).json({ imageUrl });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/** Public: serves a stored product photo. Immutable, so browsers can cache it. */
router.get('/product-images/:id', async (req, res) => {
  try {
    const result = await query(`SELECT content_type, data FROM product_images WHERE id = $1`, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'Image not found' });
    res.set('Content-Type', row.content_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(row.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
