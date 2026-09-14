import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { testConnection, pool } from './db/store.js';
import authRoutes from './routes/auth.js';
import ledgerRoutes from './routes/ledger.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
configurePassport();
app.use(passport.initialize());

app.get('/api/health', async (_req, res) => {
  try {
    const now = await testConnection();
    res.json({
      ok: true,
      service: 'Shree Nidhi Store API',
      database: process.env.DB_NAME,
      dbTime: now,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', ledgerRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

async function start() {
  try {
    const now = await testConnection();
    console.log(`Connected to PostgreSQL (${process.env.DB_NAME}) at ${now}`);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    console.error(
      `Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in backend/.env`
    );
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Shree Nidhi Store API running on http://localhost:${PORT}`);
  });
}

start();

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
