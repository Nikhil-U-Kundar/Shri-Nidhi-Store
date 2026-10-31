# Sri Nidhi Store

Neighborhood grocery storefront + POS billing + Khata ledger — Vite/React frontend + Node.js/Passport backend.

UI flow matches the proto: customer storefront (home, deals, account, order tracking), cart/checkout (COD / UPI / Khata), counter billing, and admin operations console.

## Screens (proto flow)

- **Storefront** — catalog, categories, search, product quick view, cart drawer
- **Deals** — offer products
- **Billing Counter** — POS create bill (Cash / UPI / Card / Khata)
- **Account** — profile, orders, khata ledger, addresses
- **Order Tracking** — live order status
- **Admin Console** — catalog, stock, orders, bills (toggle from top bar)

## Database

Base schema: `tables/tables.sql`

Patches for existing DBs:

```bash
psql -U <user> -d <db> -f tables/patches/001_products_catalog.sql
psql -U <user> -d <db> -f tables/patches/002_orders_bills_addresses.sql
```

## Quick start

### Backend

```bash
cd backend
npm install
# apply SQL patches if DB already exists
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

### Demo logins (after seed)

| Role | Login | Password |
|------|-------|----------|
| Customer | `9876543210` | `password123` |
| Admin | `admin@shreenidhi.store` (or `DEFAULT_ADMIN_EMAIL`) | `password123` (or `DEFAULT_ADMIN_PASSWORD`) |

Use the top bar **Simulate Login** / **Switch to Admin Panel** to jump between modes.
