import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import request from 'supertest';
import { configurePassport } from '../src/config/passport.js';
import { db } from './fakeDb.js';

export const OWNER = { id: 'o1', email: 'owner@test', name: 'Owner', role: 'admin', password: 'x' };
export const CUSTOMER = { id: 'u1', email: 'c@test', name: 'Asha Rao', phone: '9000000000', role: 'customer', password: 'x' };

/** The SQL passport uses to load the signed-in user. */
export const authRule = [
  /SELECT \* FROM users WHERE id = \$1 LIMIT 1/,
  ([id]) => [OWNER, CUSTOMER].filter((u) => u.id === id),
];

/** Mount one router the way src/index.js does. */
export function appFor(router) {
  const app = express();
  app.use(express.json());
  configurePassport();
  app.use(passport.initialize());
  app.use('/api', router);
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
  return app;
}

/** Supertest agent that signs requests as the owner, a customer or nobody. */
export function client(router, user) {
  const app = appFor(router);
  const token = user ? jwt.sign({ id: user.id }, 'test-secret') : null;
  const call = (method) => (url) => {
    const req = request(app)[method](url);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  return { get: call('get'), post: call('post'), patch: call('patch'), delete: call('delete') };
}

/** Reset the fake database, always keeping the sign-in lookup. */
export const seed = (...rules) => db.reset([...rules, authRule]);

export const broken = (message = 'db exploded') => () => {
  throw new Error(message);
};
