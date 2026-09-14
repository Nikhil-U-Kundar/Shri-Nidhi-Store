import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './store.js';

async function seed() {
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  const existing = await query(`SELECT COUNT(*)::int AS count FROM users`);
  if (existing.rows[0].count > 0) {
    console.log('Database already has users. Skipping seed.');
    await pool.end();
    return;
  }

  const customerEmail =
    process.env.DEFAULT_CUSTOMER_EMAIL || 'rahul.sharma@example.com';
  const customerPassword =
    process.env.DEFAULT_CUSTOMER_PASSWORD || 'password123';
  const customerName = process.env.DEFAULT_CUSTOMER_NAME || 'Ramesh Patel';
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@shreenidhi.store';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'password123';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Suresh Bhai';

  const customerHash = await bcrypt.hash(customerPassword, 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const extraHash = await bcrypt.hash('password123', 10);

  const admin = (
    await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id`,
      [adminEmail, adminHash, adminName, process.env.SHOP_OWNER_PHONE || '9823140912']
    )
  ).rows[0];

  const ramesh = (
    await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id`,
      [customerEmail, customerHash, customerName, '9823140912']
    )
  ).rows[0];

  const sita = (
    await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id`,
      ['sita.devi@example.com', extraHash, 'Sita Devi', '9876543210']
    )
  ).rows[0];

  const amit = (
    await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id`,
      ['amit.kumar@example.com', extraHash, 'Amit Kumar', '9123456780']
    )
  ).rows[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(17, 15, 0, 0);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(10, 0, 0, 0);

  const todayMorning = new Date();
  todayMorning.setHours(11, 30, 0, 0);

  const todayNoon = new Date();
  todayNoon.setHours(12, 0, 0, 0);

  await query(
    `INSERT INTO users_balance_details
     (user_id, grocery_item, amount, date, note, payment_mode)
     VALUES
     ($1, 'Flour (Atta) 10kg + Sugar 2kg + Oil 1L', 1250, $2, 'Grocery Purchase (Ration)', 'credit'),
     ($1, 'Rice 25kg + Dal 5kg', 4600, $3, 'Monthly ration stock', 'credit'),
     ($4, 'Tea + Spices pack', 850, $2, 'Kitchen items', 'credit'),
     ($5, 'Soap + Detergent', 3200, $6, 'Household items', 'credit')`,
    [
      ramesh.id,
      yesterday.toISOString(),
      twoDaysAgo.toISOString(),
      sita.id,
      amit.id,
      todayNoon.toISOString(),
    ]
  );

  await query(
    `INSERT INTO user_paid_details
     (user_id, amount, date, note, payment_mode)
     VALUES
     ($1, 4000, $2, 'Cash deposit given directly at counter', 'cash'),
     ($3, 3500, $4, 'UPI settlement', 'upi')`,
    [ramesh.id, todayMorning.toISOString(), sita.id, todayNoon.toISOString()]
  );

  console.log('PostgreSQL seed complete.');
  console.log(`Customer login: ${customerEmail} / ${customerPassword}`);
  console.log(`Admin login:    ${adminEmail} / ${adminPassword}`);
  console.log(`Admin id: ${admin.id}`);
  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
