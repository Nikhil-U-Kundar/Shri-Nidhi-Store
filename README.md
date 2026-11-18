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


