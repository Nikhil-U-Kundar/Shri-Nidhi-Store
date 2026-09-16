import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../db/store.js';
import { requireAuth } from '../config/passport.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'shri_nidhi_store_secret',
    { expiresIn: '7d' }
  );
}

function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '');
}

router.post('/login', (req, res, next) => {
  // Support both `login` and legacy `email` field from older clients
  if (!req.body.login && req.body.email) {
    req.body.login = req.body.email;
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Login failed' });
    }

    const requestedRole = req.body.role || 'customer';
    if (requestedRole === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as shop owner' });
    }
    if (requestedRole === 'customer' && user.role === 'admin') {
      return res.status(403).json({
        message: 'This is an admin account. Switch to Shop Owner to sign in.',
      });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  })(req, res, next);
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/register', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const phoneDigits = digitsOnly(phone);
    if (phoneDigits.length < 10) {
      return res
        .status(400)
        .json({ message: 'Enter a valid 10-digit phone number' });
    }

    const existing = await query(
      `SELECT id FROM users
       WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
       LIMIT 1`,
      [phoneDigits]
    );
    if (existing.rows.length) {
      return res.status(409).json({
        message: 'Phone number already registered. Please sign in instead.',
      });
    }

    // Password is the phone number itself
    const hash = await bcrypt.hash(phoneDigits, 10);
    const email = `${phoneDigits}@phone.local`;

    const result = await query(
      `INSERT INTO users (email, password, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, email, name, phone, role, created_at, updated_at`,
      [email, hash, String(name).trim(), phoneDigits]
    );

    const user = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({
      token,
      user,
      message: 'Account created. Use your phone number as password to sign in.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Phone number already registered. Please sign in instead.',
      });
    }
    return res.status(500).json({ message: err.message });
  }
});

router.get('/shop-info', (_req, res) => {
  res.json({
    name: 'Shree Nidhi Store',
    subtitle: 'Village Ledger Passbook',
    ownerName: process.env.SHOP_OWNER_NAME || 'Mallika',
    ownerPhone: process.env.SHOP_OWNER_PHONE || '8970128830',
    isOpen: true,
    verified: true,
  });
});

export default router;
