import { getPool } from './pool';

/**
 * The database structure. Every statement can be run again safely, so starting the
 * server is all it takes to set up an empty database.
 */
const TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(40)  NOT NULL,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(190) NOT NULL,
    phone         VARCHAR(20)  NOT NULL DEFAULT '',
    address       VARCHAR(255) NOT NULL DEFAULT '',
    city          VARCHAR(80)  NOT NULL DEFAULT '',
    district      VARCHAR(80)  NOT NULL DEFAULT '',
    role          ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    password_hash VARCHAR(100) NOT NULL,
    is_locked     TINYINT(1)   NOT NULL DEFAULT 0,
    -- Raised to sign the user out everywhere (account locked, password changed)
    token_version INT UNSIGNED NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS categories (
    id                VARCHAR(40)  NOT NULL,
    name              VARCHAR(120) NOT NULL,
    slug              VARCHAR(160) NOT NULL,
    description       VARCHAR(500) NOT NULL DEFAULT '',
    icon              VARCHAR(40)  NOT NULL DEFAULT '',
    illustration_type VARCHAR(20)  NOT NULL DEFAULT 'audio',
    sort_order        INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    UNIQUE KEY uq_categories_slug (slug)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS products (
    id                VARCHAR(40)  NOT NULL,
    name              VARCHAR(200) NOT NULL,
    slug              VARCHAR(220) NOT NULL,
    sku               VARCHAR(40)  NOT NULL,
    category_id       VARCHAR(40)  NOT NULL,
    price             INT UNSIGNED NOT NULL,
    original_price    INT UNSIGNED NULL,
    stock             INT UNSIGNED NOT NULL DEFAULT 0,
    description       TEXT         NOT NULL,
    specs             JSON         NOT NULL,
    features          JSON         NOT NULL,
    images            JSON         NOT NULL,
    colors            JSON         NOT NULL,
    capacities        JSON         NOT NULL,
    illustration_type VARCHAR(20)  NOT NULL DEFAULT 'audio',
    badge             VARCHAR(40)  NULL,
    is_featured       TINYINT(1)   NOT NULL DEFAULT 0,
    is_best_seller    TINYINT(1)   NOT NULL DEFAULT 0,
    is_new            TINYINT(1)   NOT NULL DEFAULT 0,
    is_active         TINYINT(1)   NOT NULL DEFAULT 1,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_slug (slug),
    UNIQUE KEY uq_products_sku (sku),
    KEY idx_products_category (category_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS promotions (
    code             VARCHAR(20)  NOT NULL,
    title            VARCHAR(160) NOT NULL,
    type             ENUM('percent', 'freeship') NOT NULL DEFAULT 'percent',
    discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_discount     INT UNSIGNED NULL,
    min_order        INT UNSIGNED NOT NULL DEFAULT 0,
    valid_until      DATE         NOT NULL,
    usage_count      INT UNSIGNED NOT NULL DEFAULT 0,
    max_usage        INT UNSIGNED NOT NULL DEFAULT 1,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_number    VARCHAR(20)  NOT NULL,
    user_id         VARCHAR(40)  NULL,
    customer_name   VARCHAR(120) NOT NULL,
    customer_phone  VARCHAR(20)  NOT NULL,
    customer_email  VARCHAR(190) NOT NULL DEFAULT '',
    city            VARCHAR(80)  NOT NULL,
    district        VARCHAR(80)  NOT NULL,
    ward            VARCHAR(80)  NOT NULL DEFAULT '',
    address         VARCHAR(255) NOT NULL,
    note            VARCHAR(300) NULL,
    subtotal        BIGINT UNSIGNED NOT NULL,
    shipping_fee    INT UNSIGNED NOT NULL DEFAULT 0,
    discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
    coupon_code     VARCHAR(20)  NULL,
    total_amount    BIGINT UNSIGNED NOT NULL,
    payment_method  ENUM('cod', 'bank_transfer', 'credit_card') NOT NULL,
    payment_status  ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
    paid_at         DATETIME     NULL,
    status          ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled')
                    NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_number (order_number),
    KEY idx_orders_user (user_id),
    KEY idx_orders_status (status),
    KEY idx_orders_created (created_at),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // An order line keeps its own copy of the name and price: the catalogue may change later
  `CREATE TABLE IF NOT EXISTS order_items (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id          BIGINT UNSIGNED NOT NULL,
    product_id        VARCHAR(40)  NULL,
    product_name      VARCHAR(200) NOT NULL,
    product_sku       VARCHAR(40)  NOT NULL DEFAULT '',
    illustration_type VARCHAR(20)  NOT NULL DEFAULT 'audio',
    image             VARCHAR(500) NULL,
    unit_price        INT UNSIGNED NOT NULL,
    quantity          INT UNSIGNED NOT NULL,
    selected_color    VARCHAR(80)  NULL,
    selected_capacity VARCHAR(80)  NULL,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    KEY idx_order_items_product (product_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS order_events (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id   BIGINT UNSIGNED NOT NULL,
    status     ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled') NOT NULL,
    note       VARCHAR(200) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_events_order (order_id),
    CONSTRAINT fk_order_events_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id                VARCHAR(40)  NOT NULL,
    product_id        VARCHAR(40)  NOT NULL,
    user_id           VARCHAR(40)  NULL,
    user_name         VARCHAR(120) NOT NULL,
    rating            TINYINT UNSIGNED NOT NULL,
    comment           TEXT         NOT NULL,
    verified_purchase TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- One review per customer per product (imported reviews have no user)
    UNIQUE KEY uq_reviews_product_user (product_id, user_id),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS cart_items (
    user_id           VARCHAR(40) NOT NULL,
    product_id        VARCHAR(40) NOT NULL,
    selected_color    VARCHAR(80) NOT NULL DEFAULT '',
    selected_capacity VARCHAR(80) NOT NULL DEFAULT '',
    quantity          INT UNSIGNED NOT NULL,
    position          INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, product_id, selected_color, selected_capacity),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id         VARCHAR(40)  NOT NULL,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(190) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_messages_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email      VARCHAR(190) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/** Newest first, so tables that are referenced by others are dropped last */
const TABLE_NAMES = [
  'newsletter_subscribers',
  'contact_messages',
  'cart_items',
  'reviews',
  'order_events',
  'order_items',
  'orders',
  'promotions',
  'products',
  'categories',
  'users',
];

export async function migrate(): Promise<void> {
  const pool = getPool();
  for (const statement of TABLES) await pool.query(statement);
}

export async function dropAllTables(): Promise<void> {
  const pool = getPool();
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const name of TABLE_NAMES) await pool.query(`DROP TABLE IF EXISTS \`${name}\``);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}
