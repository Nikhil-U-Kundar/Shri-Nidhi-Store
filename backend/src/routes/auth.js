import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../config/passport.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'shri_nidhi_store_secret',
    { expiresIn: '7d' }
  );
}

function defaultCredentials() {
  return {
    customer: {
      email: process.env.DEFAULT_CUSTOMER_EMAIL || 'rahul.sharma@example.com',
      password: process.env.DEFAULT_CUSTOMER_PASSWORD || 'password123',
      name: process.env.DEFAULT_CUSTOMER_NAME || 'Ramesh Patel',
    },
    admin: {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@shreenidhi.store',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'password123',
      name: process.env.DEFAULT_ADMIN_NAME || 'Suresh Bhai',
    },
  };
}

router.post('/login', (req, res, next) => {
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

router.get('/shop-info', (_req, res) => {
  res.json({
    name: 'Shree Nidhi Store',
    subtitle: 'Village Ledger Passbook',
    ownerName: process.env.SHOP_OWNER_NAME || 'Suresh Bhai',
    ownerPhone: process.env.SHOP_OWNER_PHONE || '9823140912',
    isOpen: true,
    verified: true,
    defaults: defaultCredentials(),
  });
});

export default router;
