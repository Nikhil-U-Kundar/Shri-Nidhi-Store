-- Orders, bills (POS), and customer addresses for proto-aligned storefront flow

CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'Home',
    text TEXT NOT NULL,
    landmark TEXT NOT NULL DEFAULT '',
    pincode VARCHAR(20) NOT NULL DEFAULT '',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) NOT NULL DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_offer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfg VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origin VARCHAR(100) NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS expiry VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS khata_credit_limit DECIMAL(10, 2) NOT NULL DEFAULT 10000;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_phone VARCHAR(50) NOT NULL DEFAULT '',
    delivery_address TEXT NOT NULL DEFAULT '',
    delivery_mode VARCHAR(100) NOT NULL DEFAULT 'Home Delivery',
    payment_method VARCHAR(100) NOT NULL DEFAULT 'Cash on Delivery',
    payment_status VARCHAR(100) NOT NULL DEFAULT 'Pending',
    status VARCHAR(50) NOT NULL DEFAULT 'Order Placed',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estimated_delivery VARCHAR(100) NOT NULL DEFAULT 'Within 25-35 minutes',
    notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bill_number VARCHAR(40) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(50) NOT NULL DEFAULT '',
    customer_type VARCHAR(20) NOT NULL DEFAULT 'walk-in'
      CHECK (customer_type IN ('walk-in', 'regular', 'khata')),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'Cash'
      CHECK (payment_method IN ('Cash', 'UPI', 'Kirana Khata', 'Card')),
    payment_status VARCHAR(40) NOT NULL DEFAULT 'Paid'
      CHECK (payment_status IN ('Paid', 'Added to Khata')),
    cashier_name VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);

CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(100) NOT NULL DEFAULT '',
    price DECIMAL(10, 2) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    total DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
