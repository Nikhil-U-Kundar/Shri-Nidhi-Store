# Shree Nidhi Store

Digital village ledger (khata) app — Vite React frontend + Node.js/Passport backend.

## Screens

- **Login** — Customer / Shop Owner role login
- **Passbook** — Customer balance + transaction history
- **Shop Admin** — Outstanding dues + customer list
- **Accept Payment / Give Credit** — Record ledger entries

## Quick start

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

API: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Logins (from `.env`)

| Role | Email | Password |
|------|-------|----------|
| Shop Owner | `owner@shreenidhi.store` | `Owner@1234` |
| Customer | `rahul.sharma@example.com` | `password123` |

No public sign-up. Create/update the owner account with `npm run ensure-owner` in `backend`.

## Database

Configured in `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=nikhil_admin
DB_PASSWORD=Nikhil@123
DB_NAME=srinidhi
```

Schema: `tables/tables.sql`

- `users`
- `users_balance_details` (credit / grocery purchases)
- `user_paid_details` (payments)
