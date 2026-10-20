    -- Patch 001: Product catalog, inventory, cart, stock logs
    -- Run against your existing DB after tables/tables.sql
    --   psql -U <user> -d <db> -f tables/patches/001_products_catalog.sql

    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        pack_label VARCHAR(100) NOT NULL DEFAULT '1 Piece',
        weight_value DECIMAL(10, 2),
        weight_unit VARCHAR(20) DEFAULT '',
        selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= 0),
        mrp DECIMAL(10, 2),
        wholesale_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (wholesale_cost >= 0),
        stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        badge_text VARCHAR(50) NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

    CREATE TABLE IF NOT EXISTS stock_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        change_amount INT NOT NULL,
        reason VARCHAR(50) NOT NULL DEFAULT 'adjust',
        note TEXT NOT NULL DEFAULT '',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON stock_logs(product_id);

    CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
        UNIQUE (user_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);

    -- Seed categories (safe to re-run)
    INSERT INTO categories (name, slug, sort_order) VALUES
        ('Grains / Atta', 'grains-atta', 1),
        ('Edible Oils', 'edible-oils', 2),
        ('Pulses', 'pulses', 3),
        ('Rice', 'rice', 4),
        ('Spices & Salt', 'spices-salt', 5),
        ('Tea & Beverages', 'tea-beverages', 6),
        ('Personal Care', 'personal-care', 7)
    ON CONFLICT (slug) DO NOTHING;

    -- Seed sample products only when catalog is empty
    INSERT INTO products (
        category_id, name, brand, image_url, pack_label, weight_value, weight_unit,
        selling_price, mrp, wholesale_cost, stock_quantity, low_stock_threshold, is_visible, badge_text
    )
    SELECT c.id, v.name, v.brand, v.image_url, v.pack_label, v.weight_value, v.weight_unit,
        v.selling_price, v.mrp, v.wholesale_cost, v.stock_quantity, v.low_stock_threshold, TRUE, v.badge_text
    FROM (
        VALUES
            ('grains-atta', 'Chakki Fresh Wheat Atta', 'Shree Nidhi', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', '10kg Bag', 10, 'kg', 380, 410, 340, 24, 5, '24 left'),
            ('edible-oils', 'Pure Mustard Oil Kachi Ghani', 'Fortune', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', '1L Bottle', 1, 'litre', 145, 165, 120, 3, 5, 'Low Stock'),
            ('rice', 'Premium Basmati Rice', 'India Gate', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', '5kg Bag', 5, 'kg', 420, 460, 380, 18, 5, 'Popular'),
            ('pulses', 'Polished Toor Dal / Arhar', 'Tata Sampann', 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop', '1kg Pack', 1, 'kg', 155, 175, 135, 40, 5, 'In Stock'),
            ('tea-beverages', 'CTC Assam Gold Tea Powder', 'Red Label', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop', '500g Pack', 500, 'g', 190, 210, 160, 22, 5, 'Fresh Stock'),
            ('personal-care', 'Bathing Soap Value Pack', 'Lux', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', '4 x 100g', 400, 'g', 110, 130, 90, 35, 5, 'Popular'),
            ('spices-salt', 'Tata Salt Desh Ka Namak', 'Tata', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', '1kg Pack', 1, 'kg', 28, 32, 22, 56, 5, 'In Stock'),
            ('grains-atta', 'Shree Nidhi Chakki Atta', 'Shree Nidhi', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', '10 kg Pack', 10, 'kg', 380, 410, 340, 24, 5, '')
    ) AS v(slug, name, brand, image_url, pack_label, weight_value, weight_unit, selling_price, mrp, wholesale_cost, stock_quantity, low_stock_threshold, badge_text)
    JOIN categories c ON c.slug = v.slug
    WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
