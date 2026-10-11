-- SQL Server schema for AURA Store.
-- Select the already-created aura_store database before running this script.
-- The application applies the same schema and seeds sample data automatically on startup.

IF OBJECT_ID(N'users', N'U') IS NULL
CREATE TABLE users (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(190) NOT NULL UNIQUE,
  phone NVARCHAR(20) NOT NULL DEFAULT N'',
  address NVARCHAR(255) NOT NULL DEFAULT N'',
  city NVARCHAR(80) NOT NULL DEFAULT N'',
  district NVARCHAR(80) NOT NULL DEFAULT N'',
  role NVARCHAR(10) NOT NULL DEFAULT N'customer' CHECK (role IN (N'customer', N'admin')),
  password_hash NVARCHAR(100) NOT NULL,
  is_locked TINYINT NOT NULL DEFAULT 0,
  token_version INT NOT NULL DEFAULT 0 CHECK (token_version >= 0),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'categories', N'U') IS NULL
CREATE TABLE categories (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL UNIQUE,
  slug NVARCHAR(160) NOT NULL UNIQUE,
  description NVARCHAR(500) NOT NULL DEFAULT N'',
  icon NVARCHAR(40) NOT NULL DEFAULT N'',
  illustration_type NVARCHAR(20) NOT NULL DEFAULT N'audio',
  sort_order INT NOT NULL DEFAULT 0
);

IF OBJECT_ID(N'products', N'U') IS NULL
CREATE TABLE products (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  slug NVARCHAR(220) NOT NULL UNIQUE,
  sku NVARCHAR(40) NOT NULL UNIQUE,
  category_id NVARCHAR(40) NOT NULL REFERENCES categories(id),
  price INT NOT NULL CHECK (price >= 0),
  original_price INT NULL CHECK (original_price IS NULL OR original_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description NVARCHAR(MAX) NOT NULL,
  specs NVARCHAR(MAX) NOT NULL CHECK (ISJSON(specs) = 1),
  features NVARCHAR(MAX) NOT NULL CHECK (ISJSON(features) = 1),
  images NVARCHAR(MAX) NOT NULL CHECK (ISJSON(images) = 1),
  colors NVARCHAR(MAX) NOT NULL CHECK (ISJSON(colors) = 1),
  capacities NVARCHAR(MAX) NOT NULL CHECK (ISJSON(capacities) = 1),
  illustration_type NVARCHAR(20) NOT NULL DEFAULT N'audio',
  badge NVARCHAR(40) NULL,
  is_featured TINYINT NOT NULL DEFAULT 0,
  is_best_seller TINYINT NOT NULL DEFAULT 0,
  is_new TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_products_category' AND object_id=OBJECT_ID(N'products'))
  CREATE INDEX idx_products_category ON products(category_id);

IF OBJECT_ID(N'promotions', N'U') IS NULL
CREATE TABLE promotions (
  code NVARCHAR(20) NOT NULL PRIMARY KEY,
  title NVARCHAR(160) NOT NULL,
  type NVARCHAR(10) NOT NULL DEFAULT N'percent' CHECK (type IN (N'percent', N'freeship')),
  discount_percent TINYINT NOT NULL DEFAULT 0,
  max_discount INT NULL CHECK (max_discount IS NULL OR max_discount >= 0),
  min_order INT NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  valid_until DATE NOT NULL,
  usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  max_usage INT NOT NULL DEFAULT 1 CHECK (max_usage >= 0),
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'orders', N'U') IS NULL
CREATE TABLE orders (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  order_number NVARCHAR(20) NOT NULL UNIQUE,
  user_id NVARCHAR(40) NULL REFERENCES users(id) ON DELETE SET NULL,
  customer_name NVARCHAR(120) NOT NULL,
  customer_phone NVARCHAR(20) NOT NULL,
  customer_email NVARCHAR(190) NOT NULL DEFAULT N'',
  city NVARCHAR(80) NOT NULL,
  district NVARCHAR(80) NOT NULL,
  ward NVARCHAR(80) NOT NULL DEFAULT N'',
  address NVARCHAR(255) NOT NULL,
  note NVARCHAR(300) NULL,
  subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
  shipping_fee INT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount INT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  coupon_code NVARCHAR(20) NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  payment_method NVARCHAR(20) NOT NULL CHECK (payment_method IN (N'cod', N'bank_transfer', N'credit_card')),
  payment_status NVARCHAR(10) NOT NULL DEFAULT N'pending' CHECK (payment_status IN (N'pending', N'paid', N'refunded')),
  paid_at DATETIME2 NULL,
  status NVARCHAR(12) NOT NULL DEFAULT N'pending'
    CHECK (status IN (N'pending', N'confirmed', N'processing', N'shipping', N'delivered', N'cancelled')),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_orders_user' AND object_id=OBJECT_ID(N'orders'))
  CREATE INDEX idx_orders_user ON orders(user_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_orders_status' AND object_id=OBJECT_ID(N'orders'))
  CREATE INDEX idx_orders_status ON orders(status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_orders_created' AND object_id=OBJECT_ID(N'orders'))
  CREATE INDEX idx_orders_created ON orders(created_at);

IF OBJECT_ID(N'order_items', N'U') IS NULL
CREATE TABLE order_items (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id NVARCHAR(40) NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name NVARCHAR(200) NOT NULL,
  product_sku NVARCHAR(40) NOT NULL DEFAULT N'',
  illustration_type NVARCHAR(20) NOT NULL DEFAULT N'audio',
  image NVARCHAR(500) NULL,
  unit_price INT NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  selected_color NVARCHAR(80) NULL,
  selected_capacity NVARCHAR(80) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_order_items_order' AND object_id=OBJECT_ID(N'order_items'))
  CREATE INDEX idx_order_items_order ON order_items(order_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_order_items_product' AND object_id=OBJECT_ID(N'order_items'))
  CREATE INDEX idx_order_items_product ON order_items(product_id);

IF OBJECT_ID(N'order_events', N'U') IS NULL
CREATE TABLE order_events (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status NVARCHAR(12) NOT NULL CHECK (status IN (N'pending', N'confirmed', N'processing', N'shipping', N'delivered', N'cancelled')),
  note NVARCHAR(200) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_order_events_order' AND object_id=OBJECT_ID(N'order_events'))
  CREATE INDEX idx_order_events_order ON order_events(order_id);

IF OBJECT_ID(N'reviews', N'U') IS NULL
CREATE TABLE reviews (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  product_id NVARCHAR(40) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id NVARCHAR(40) NULL REFERENCES users(id) ON DELETE SET NULL,
  user_name NVARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment NVARCHAR(MAX) NOT NULL,
  verified_purchase TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'uq_reviews_product_user' AND object_id=OBJECT_ID(N'reviews'))
  CREATE UNIQUE INDEX uq_reviews_product_user ON reviews(product_id, user_id) WHERE user_id IS NOT NULL;

IF OBJECT_ID(N'cart_items', N'U') IS NULL
CREATE TABLE cart_items (
  user_id NVARCHAR(40) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id NVARCHAR(40) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selected_color NVARCHAR(80) NOT NULL DEFAULT N'',
  selected_capacity NVARCHAR(80) NOT NULL DEFAULT N'',
  quantity INT NOT NULL CHECK (quantity > 0),
  position INT NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (user_id, product_id, selected_color, selected_capacity)
);

IF OBJECT_ID(N'contact_messages', N'U') IS NULL
CREATE TABLE contact_messages (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(190) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_messages_created' AND object_id=OBJECT_ID(N'contact_messages'))
  CREATE INDEX idx_messages_created ON contact_messages(created_at);

IF OBJECT_ID(N'newsletter_subscribers', N'U') IS NULL
CREATE TABLE newsletter_subscribers (
  email NVARCHAR(190) NOT NULL PRIMARY KEY,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
