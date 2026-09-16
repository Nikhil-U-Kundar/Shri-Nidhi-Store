import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './store.js';

async function ensureOwner() {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'owner@shreenidhi.store';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Owner@1234';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Mallika';
  const phone = process.env.SHOP_OWNER_PHONE || '8970128830';
  const hash = await bcrypt.hash(password, 10);

  const existing = await query(
    `SELECT id, email FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
  );

  if (existing.rows.length) {
    await query(
      `UPDATE users
       SET email = $1, password = $2, name = $3, phone = $4, updated_at = NOW()
       WHERE id = $5`,
      [email, hash, name, phone, existing.rows[0].id]
    );
    console.log('Owner account updated.');
  } else {
    await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [email, hash, name, phone]
    );
    console.log('Owner account created.');
  }

  // Remove any extra admin accounts so there is only one owner
  await query(
    `DELETE FROM users
     WHERE role = 'admin'
       AND LOWER(email) <> LOWER($1)`,
    [email]
  );

  console.log('--- Shop Owner login ---');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  await pool.end();
}

ensureOwner().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
