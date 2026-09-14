import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { query, safeUser } from '../db/store.js';

export function configurePassport() {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const result = await query(
            `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
            [email]
          );
          const user = result.rows[0];
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          return done(null, safeUser(user));
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'shri_nidhi_store_secret',
      },
      async (payload, done) => {
        try {
          const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
            payload.id,
          ]);
          const user = result.rows[0];
          if (!user) return done(null, false);
          return done(null, safeUser(user));
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

export const requireAuth = passport.authenticate('jwt', { session: false });

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}
