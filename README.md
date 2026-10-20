# Shree Nidhi Store

Digital village ledger (khata) app — Vite React frontend + Node.js/Passport backend.

## Screens

- **Store** (`/store`) — Customer product storefront + cart → khata checkout
- **Admin Items** (`/admin/items`) — Product catalog manager (add, price, stock)
- **Login** — Customer / Shop Owner role login
- **Passbook** — Customer balance + transaction history
- **Shop Admin / Khata Admin** — Outstanding dues + customer list
- **Accept Payment / Give Credit** — Record ledger entries

## Database

Base schema: `tables/tables.sql`

Product catalog patch (for existing DBs):

```bash
psql -U <user> -d <db> -f tables/patches/001_products_catalog.sql
```

Creates: `categories`, `products`, `stock_logs`, `cart_items` (+ seed data).

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

App: http://localhost:5173/store


