import { Router } from 'express';
import { query } from '../db/store.js';
import { requireAuth, requireAdmin } from '../config/passport.js';

const router = Router();

function mapProduct(row) {
  if (!row) return null;
  const selling = Number(row.selling_price);
  const cost = Number(row.wholesale_cost);
  const margin = Math.round((selling - cost) * 100) / 100;
  const marginPct =
    selling > 0 ? Math.round(((selling - cost) / selling) * 1000) / 10 : 0;
  const stock = Number(row.stock_quantity);
  const threshold = Number(row.low_stock_threshold);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name || '',
    categorySlug: row.category_slug || '',
    name: row.name,
    brand: row.brand || '',
    imageUrl: row.image_url || '',
    packLabel: row.pack_label,
    weightValue: row.weight_value != null ? Number(row.weight_value) : null,
    weightUnit: row.weight_unit || '',
    sellingPrice: selling,
    mrp: row.mrp != null ? Number(row.mrp) : null,
    wholesaleCost: cost,
    stockQuantity: stock,
    lowStockThreshold: threshold,
    isLowStock: stock <= threshold,
    isVisible: Boolean(row.is_visible),
    badgeText: row.badge_text || '',
    margin,
    marginPct,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

router.get('/categories', async (_req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
              COUNT(p.id) FILTER (WHERE p.is_visible = TRUE)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({
      categories: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        sortOrder: r.sort_order,
        productCount: Number(r.product_count),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const visibleOnly = String(req.query.visible || '') === 'true';
    const lowStock = String(req.query.lowStock || '') === 'true';

    const clauses = [];
    const params = [];

    if (visibleOnly) {
      clauses.push(`p.is_visible = TRUE`);
    }
    if (category && category !== 'all') {
      params.push(category);
      clauses.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }
    if (q) {
      params.push(`%${q}%`);
      clauses.push(
        `(p.name ILIKE $${params.length} OR p.brand ILIKE $${params.length} OR p.pack_label ILIKE $${params.length} OR c.name ILIKE $${params.length})`
      );
    }
    if (lowStock) {
      clauses.push(`p.stock_quantity <= p.low_stock_threshold`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await query(
      `${PRODUCT_SELECT} ${where} ORDER BY p.created_at DESC`,
      params
    );
    res.json({ products: result.rows.map(mapProduct) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/catalog/summary', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE is_visible = TRUE)::int AS active_count,
         COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold)::int AS low_stock_count,
         COALESCE(SUM(selling_price * stock_quantity) FILTER (WHERE is_visible = TRUE), 0)::float AS catalog_value
       FROM products`
    );
    const row = result.rows[0];
    res.json({
      activeCount: Number(row.active_count),
      lowStockCount: Number(row.low_stock_count),
      catalogValue: Math.round(Number(row.catalog_value) * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      brand = '',
      categoryId,
      imageUrl = '',
      packLabel = '1 Piece',
      weightValue = null,
      weightUnit = '',
      sellingPrice,
      mrp = null,
      wholesaleCost = 0,
      stockQuantity = 0,
      lowStockThreshold = 5,
      isVisible = true,
      badgeText = '',
    } = req.body || {};

    if (!name || sellingPrice == null) {
      return res.status(400).json({ message: 'Name and selling price are required' });
    }

    const result = await query(
      `INSERT INTO products (
         category_id, name, brand, image_url, pack_label, weight_value, weight_unit,
         selling_price, mrp, wholesale_cost, stock_quantity, low_stock_threshold, is_visible, badge_text
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        categoryId || null,
        String(name).trim(),
        String(brand).trim(),
        String(imageUrl || '').trim(),
        String(packLabel).trim() || '1 Piece',
        weightValue,
        weightUnit,
        Number(sellingPrice),
        mrp != null && mrp !== '' ? Number(mrp) : null,
        Number(wholesaleCost) || 0,
        Math.max(0, Number(stockQuantity) || 0),
        Math.max(0, Number(lowStockThreshold) || 5),
        Boolean(isVisible),
        String(badgeText || '').trim(),
      ]
    );

    const full = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [result.rows[0].id]);
    res.status(201).json({ product: mapProduct(full.rows[0]) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const cur = existing.rows[0];
    const b = req.body || {};

    const next = {
      category_id: b.categoryId !== undefined ? b.categoryId || null : cur.category_id,
      name: b.name !== undefined ? String(b.name).trim() : cur.name,
      brand: b.brand !== undefined ? String(b.brand).trim() : cur.brand,
      image_url: b.imageUrl !== undefined ? String(b.imageUrl).trim() : cur.image_url,
      pack_label: b.packLabel !== undefined ? String(b.packLabel).trim() : cur.pack_label,
      weight_value: b.weightValue !== undefined ? b.weightValue : cur.weight_value,
      weight_unit: b.weightUnit !== undefined ? b.weightUnit : cur.weight_unit,
      selling_price:
        b.sellingPrice !== undefined ? Number(b.sellingPrice) : cur.selling_price,
      mrp: b.mrp !== undefined ? (b.mrp === '' || b.mrp == null ? null : Number(b.mrp)) : cur.mrp,
      wholesale_cost:
        b.wholesaleCost !== undefined ? Number(b.wholesaleCost) : cur.wholesale_cost,
      stock_quantity:
        b.stockQuantity !== undefined
          ? Math.max(0, Number(b.stockQuantity))
          : cur.stock_quantity,
      low_stock_threshold:
        b.lowStockThreshold !== undefined
          ? Math.max(0, Number(b.lowStockThreshold))
          : cur.low_stock_threshold,
      is_visible: b.isVisible !== undefined ? Boolean(b.isVisible) : cur.is_visible,
      badge_text: b.badgeText !== undefined ? String(b.badgeText).trim() : cur.badge_text,
    };

    await query(
      `UPDATE products SET
         category_id = $1, name = $2, brand = $3, image_url = $4, pack_label = $5,
         weight_value = $6, weight_unit = $7, selling_price = $8, mrp = $9,
         wholesale_cost = $10, stock_quantity = $11, low_stock_threshold = $12,
         is_visible = $13, badge_text = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15`,
      [
        next.category_id,
        next.name,
        next.brand,
        next.image_url,
        next.pack_label,
        next.weight_value,
        next.weight_unit,
        next.selling_price,
        next.mrp,
        next.wholesale_cost,
        next.stock_quantity,
        next.low_stock_threshold,
        next.is_visible,
        next.badge_text,
        id,
      ]
    );

    const full = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
    res.json({ product: mapProduct(full.rows[0]) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/products/:id/stock', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const delta = Number(req.body?.delta);
    const reason = String(req.body?.reason || 'adjust').trim() || 'adjust';
    const note = String(req.body?.note || '').trim();

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ message: 'delta must be a non-zero number' });
    }

    const existing = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const current = Number(existing.rows[0].stock_quantity);
    const nextStock = Math.max(0, current + delta);

    await query(
      `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextStock, id]
    );
    await query(
      `INSERT INTO stock_logs (product_id, change_amount, reason, note, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, delta, reason, note, req.user.id]
    );

    const full = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
    res.json({ product: mapProduct(full.rows[0]) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/products/:id/stock-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, u.name AS created_by_name
       FROM stock_logs sl
       LEFT JOIN users u ON u.id = sl.created_by
       WHERE sl.product_id = $1
       ORDER BY sl.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );
    res.json({
      logs: result.rows.map((r) => ({
        id: r.id,
        changeAmount: Number(r.change_amount),
        reason: r.reason,
        note: r.note,
        createdBy: r.created_by_name || '',
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [
      req.params.id,
    ]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Customer: checkout cart → khata credit + stock deduction */
router.post('/checkout/khata', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can checkout to khata' });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const note = String(req.body?.note || 'Online store order').trim();
    let total = 0;
    const lines = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const productResult = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [item.productId]);
      const product = productResult.rows[0];
      if (!product || !product.is_visible) {
        return res.status(400).json({ message: `Product unavailable: ${item.productId}` });
      }
      if (Number(product.stock_quantity) < qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (available ${product.stock_quantity})`,
        });
      }
      const lineTotal = Number(product.selling_price) * qty;
      total += lineTotal;
      lines.push({ product, qty, lineTotal });
    }

    total = Math.round(total * 100) / 100;
    const groceryLabel = lines
      .map((l) => `${l.product.name} x${l.qty}`)
      .join(', ')
      .slice(0, 250);

    const credit = await query(
      `INSERT INTO users_balance_details (user_id, grocery_item, amount, date, note, payment_mode)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
       RETURNING *`,
      [req.user.id, groceryLabel || 'Store order', total, note, 'khata']
    );

    for (const line of lines) {
      const nextStock = Number(line.product.stock_quantity) - line.qty;
      await query(
        `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [nextStock, line.product.id]
      );
      await query(
        `INSERT INTO stock_logs (product_id, change_amount, reason, note, created_by)
         VALUES ($1, $2, 'sale', $3, $4)`,
        [line.product.id, -line.qty, `Khata order for ${req.user.name}`, req.user.id]
      );
    }

    await query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);

    res.status(201).json({
      ok: true,
      amount: total,
      creditId: credit.rows[0].id,
      groceryItem: groceryLabel,
      message: 'Order added to your khata ledger',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
