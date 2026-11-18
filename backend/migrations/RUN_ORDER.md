# Database patches — run order

Run against the **live** database only after reviewing. Each file is idempotent.

1. `001_reconcile_missing_tables.sql` — creates `user_addresses`, `orders`, `order_items`, `bills`, `bill_items` (none exist in the live DB today).
2. `002_preorder_scheduling.sql` — adds pre-order columns to `orders`, `delivery_slots`, `store_settings`, and a non-negative stock check (NOT VALID).

Pre-check (should return 0 rows, else fix stock first):
    SELECT id, name, stock_quantity FROM products WHERE stock_quantity < 0;

Post-check:
    SELECT key, value FROM store_settings ORDER BY key;
    SELECT label, start_time, end_time FROM delivery_slots ORDER BY sort_order;
