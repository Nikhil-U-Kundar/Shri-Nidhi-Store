import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pg', async () => ({ default: await import('./fakeDb.js') }));

import { db } from './fakeDb.js';
import * as store from '../src/db/store.js';
import * as schedule from '../src/services/schedule.js';
import { requireAdmin } from '../src/config/passport.js';
import authRoutes from '../src/routes/auth.js';
import { CUSTOMER, OWNER, client, seed } from './app.js';

beforeEach(() => seed());

describe('db/store', () => {
  it('explains database errors', () => {
    expect(store.dbErrorMessage({ code: 'ECONNREFUSED' })).toContain('not reachable');
    expect(store.dbErrorMessage({ code: '28P01' })).toContain('login failed');
    expect(store.dbErrorMessage({ code: '3D000' })).toContain('not found');
    expect(store.dbErrorMessage(new Error('boom'))).toBe('boom');
    expect(store.dbErrorMessage({})).toBe('Database error');
  });

  it('formats and masks phone numbers', () => {
    expect(store.formatPhone('9000012345')).toBe('+91 9000012345');
    expect(store.maskPhone('9000012345')).toBe('+91 90000-XXXXX');
    expect(store.maskPhone('12')).toBe('12');
    expect(store.formatPhone('')).toBe('—');
  });

  it('compares days and strips passwords', () => {
    expect(store.isSameDay(new Date())).toBe(true);
    expect(store.isSameDay('2000-01-01')).toBe(false);
    expect(store.safeUser({ id: 1, password: 'h' })).toEqual({ id: 1 });
    expect(store.safeUser(null)).toBeNull();
  });

  it('works out the balance due', async () => {
    seed([/users_balance_details/, [{ total: 100.5 }]], [/user_paid_details/, [{ total: 40.25 }]]);
    await expect(store.getUserBalance('u1')).resolves.toEqual({ totalCredit: 100.5, totalPaid: 40.25, balanceDue: 60.25 });
  });

  it('commits a transaction, and rolls back on error', async () => {
    await store.withTransaction((tx) => tx.query('SELECT 1'));
    expect(db.calls.map((c) => c.text)).toEqual(['BEGIN', 'SELECT 1', 'COMMIT']);
    seed();
    await expect(store.withTransaction(async () => { throw new Error('no'); })).rejects.toThrow('no');
    expect(db.calls.map((c) => c.text)).toEqual(['BEGIN', 'ROLLBACK']);
  });

  it('checks the connection', async () => {
    seed([/SELECT NOW/, [{ now: 'today' }]]);
    await expect(store.testConnection()).resolves.toBe('today');
  });
});

describe('services/schedule', () => {
  const slot = { id: 's1', label: '9-11', start: '09:00', end: '11:00' };
  const settings = { advance_booking_hours: 24, same_day_delivery: false };
  const now = new Date('2026-12-01T10:00:00+05:30');
  const rules = [
    [/store_settings/, [{ key: 'delivery_fee', value: 50 }]],
    [/delivery_slots/, [{ id: 's1', label: '9-11', start_hm: '09:00', end_hm: '11:00' }]],
  ];

  it('uses the store timezone for dates', () => {
    expect(schedule.storeDate(new Date('2026-12-01T20:00:00Z'))).toBe('2026-12-02');
  });

  it('applies the notice period', () => {
    expect(schedule.bookableSlotsFor('2026-12-02', [slot], settings, now)).toEqual([]);
    expect(schedule.bookableSlotsFor('2026-12-03', [slot], settings, now)).toEqual([slot]);
    expect(schedule.earliestBookableDate([slot], settings, now)).toBe('2026-12-03');
    expect(schedule.earliestBookableDate([], settings, now)).toBeNull();
  });

  it('merges stored settings with defaults and reads slots', async () => {
    seed(...rules);
    await expect(schedule.getScheduleSettings()).resolves.toMatchObject({ delivery_fee: 50, advance_booking_hours: 24 });
    await expect(schedule.getActiveSlots()).resolves.toEqual([slot]);
  });

  it('validates a requested booking', async () => {
    seed(...rules);
    const ask = (deliveryDate, slotId) => schedule.resolveSchedule({ deliveryDate, slotId }, undefined, now);
    expect(await ask('2026-02-30', 's1')).toMatchObject({ ok: false, message: expect.stringContaining('valid delivery date') });
    expect(await ask('2026-12-05', 'x')).toMatchObject({ ok: false, message: expect.stringContaining('time slot') });
    expect(await ask('2026-12-01', 's1')).toMatchObject({ ok: false, message: expect.stringContaining('24 hours') });
    expect(await ask('2026-12-05', 's1')).toMatchObject({ ok: true, date: '2026-12-05' });
  });
});

describe('config/passport', () => {
  it('requireAdmin lets only admins through', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    requireAdmin({ user: { role: 'customer' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    requireAdmin({ user: { role: 'admin' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('routes/auth', () => {
  const hash = bcrypt.hashSync('secret', 4);

  it('signs the owner in by email', async () => {
    seed([/LOWER\(email\)/, [{ ...OWNER, password: hash }]]);
    const res = await client(authRoutes).post('/api/login').send({ email: 'owner@test', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.password).toBeUndefined();
  });

  it('signs a customer in by phone', async () => {
    seed([/regexp_replace/, [{ ...CUSTOMER, password: hash }]]);
    const res = await client(authRoutes).post('/api/login').send({ login: '90000 00000', password: 'secret' });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password or unknown user', async () => {
    seed([/regexp_replace/, [{ ...CUSTOMER, password: hash }]]);
    const wrong = await client(authRoutes).post('/api/login').send({ login: '9000000000', password: 'nope' });
    expect(wrong.status).toBe(401);
    seed();
    const unknown = await client(authRoutes).post('/api/login').send({ login: '1', password: 'x' });
    expect(unknown.body.message).toBe('Invalid phone number or password');
  });

  it('validates registration', async () => {
    const api = client(authRoutes);
    expect((await api.post('/api/register').send({ phone: '9000000000' })).status).toBe(400);
    expect((await api.post('/api/register').send({ name: 'A', phone: '123' })).status).toBe(400);
    seed([/SELECT id FROM users/, [{ id: 'u1' }]]);
    expect((await api.post('/api/register').send({ name: 'A', phone: '9000000000' })).status).toBe(409);
  });

  it('registers a customer with a hashed password', async () => {
    seed([/INSERT INTO users/, [{ id: 'u2', name: 'A', role: 'customer' }]]);
    const res = await client(authRoutes).post('/api/register').send({ name: 'A', phone: '9000000001' });
    expect(res.status).toBe(201);
    expect(db.find(/INSERT INTO users/).params[1]).not.toBe('9000000001');
  });

  it('returns the current user and shop info', async () => {
    const me = await client(authRoutes, CUSTOMER).get('/api/me');
    expect(me.body.user).toMatchObject({ id: 'u1' });
    expect((await client(authRoutes).get('/api/me')).status).toBe(401);
    expect((await client(authRoutes).get('/api/shop-info')).body.name).toBe('Shree Nidhi Store');
  });
});

describe('index.js', () => {
  it('serves health, CORS and routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    seed([/SELECT NOW/, [{ now: 'today' }]]);
    let server;
    const listen = express.application.listen;
    vi.spyOn(express.application, 'listen').mockImplementation(function (...args) {
      server = listen.apply(this, args);
      return server;
    });
    await import('../src/index.js');
    await vi.waitFor(() => expect(server).toBeTruthy());

    const health = await request(server).get('/api/health').set('Origin', 'http://localhost:5174');
    expect(health.body).toMatchObject({ ok: true, dbTime: 'today' });
    expect(health.headers['access-control-allow-origin']).toBe('http://localhost:5174');
    const foreign = await request(server).get('/api/shop-info').set('Origin', 'https://evil.example');
    expect(foreign.headers['access-control-allow-origin']).toBeUndefined();

    seed([/SELECT NOW/, () => { throw new Error('down'); }]);
    expect((await request(server).get('/api/health')).status).toBe(500);
    server.close();
  });
});

describe('db seed scripts', () => {
  const run = async (file) => {
    vi.resetModules();
    const fresh = (await import('./fakeDb.js')).db;
    return async (rules) => {
      fresh.reset(rules);
      await import(file);
      await vi.waitFor(() => expect(fresh.ended).toBe(1));
      return fresh;
    };
  };
  beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => {}));

  it('seed skips a database that has users', async () => {
    const fake = await (await run('../src/db/seed.js'))([[/COUNT/, [{ count: 3 }]]]);
    expect(fake.find(/INSERT/)).toBeUndefined();
  });

  it('seed fills an empty database', async () => {
    const fake = await (await run('../src/db/seed.js'))([[/COUNT/, [{ count: 0 }]], [/RETURNING id/, [{ id: 'x' }]]]);
    expect(fake.find(/INSERT INTO user_paid_details/)).toBeTruthy();
  });

  it('ensureOwner creates the owner when there is none', async () => {
    const fake = await (await run('../src/db/ensureOwner.js'))([]);
    expect(fake.find(/INSERT INTO users/)).toBeTruthy();
    expect(fake.find(/DELETE FROM users/)).toBeTruthy();
  });

  it('ensureOwner updates an existing owner', async () => {
    const fake = await (await run('../src/db/ensureOwner.js'))([[/SELECT id, email/, [{ id: 'o1' }]]]);
    expect(fake.find(/UPDATE users/)).toBeTruthy();
  });
});
