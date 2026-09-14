import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  return result.rows[0].now;
}

export function maskPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 5) return phone || '—';
  return `+91 ${digits.slice(-10, -5)}-XXXXX`;
}

export function formatPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    const d = digits.slice(-10);
    return `+91 ${d.slice(0, 5)}${d.slice(5)}`;
  }
  return phone || '—';
}

export function isSameDay(isoDate, ref = new Date()) {
  const d = new Date(isoDate);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export async function getUserBalance(userId) {
  const credits = await query(
    `SELECT COALESCE(SUM(amount), 0)::float AS total
     FROM users_balance_details WHERE user_id = $1`,
    [userId]
  );
  const paid = await query(
    `SELECT COALESCE(SUM(amount), 0)::float AS total
     FROM user_paid_details WHERE user_id = $1`,
    [userId]
  );
  const totalCredit = Number(credits.rows[0].total);
  const totalPaid = Number(paid.rows[0].total);
  return {
    totalCredit,
    totalPaid,
    balanceDue: Math.round((totalCredit - totalPaid) * 100) / 100,
  };
}

export function safeUser(row) {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
}
