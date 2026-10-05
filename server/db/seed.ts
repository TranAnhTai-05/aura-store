import type { ResultSetHeader } from 'mysql2/promise';
import { getPool, row, transaction } from './pool';
import { SEED_PASSWORDS } from './seedData';
import { buildSeed } from './seedBuilder';
import { hashPassword } from '../auth';
import { getOrderHistory } from '../../shared/orders';
import { getPromotionType } from '../../shared/pricing';

export async function isDatabaseEmpty(): Promise<boolean> {
  const result = await row<{ total: number }>('SELECT COUNT(*) AS total FROM users');
  return (result?.total ?? 0) === 0;
}

export type SeedReport = {
  users: number;
  products: number;
  photos: number;
  orders: number;
  reviews: number;
};

/**
 * 'fill' loads the sample shop into an empty database.
 * 'add' brings a database that is in use up to the current sample shop: it adds what is
 * missing and leaves every existing row — accounts, orders, edited products — as it is.
 */
type Mode = 'fill' | 'add';

async function load(mode: Mode): Promise<SeedReport> {
  const sample = buildSeed();
  const categoryIdByName = new Map(sample.categories.map((c) => [c.name, c.id]));
  const knownUsers = new Set(sample.users.map((u) => u.id));
  const report: SeedReport = { users: 0, products: 0, photos: 0, orders: 0, reviews: 0 };

  await transaction(async (db) => {
    /** Inserts a row; when adding to a database in use, a row that already exists is kept */
    const insert = async (sql: string, values: unknown[]) => {
      const statement = mode === 'add' ? sql.replace(/^\s*INSERT INTO/, 'INSERT IGNORE INTO') : sql;
      const [result] = await db.query<ResultSetHeader>(statement, values);
      return { added: result.affectedRows > 0, id: result.insertId };
    };
    const exists = async (sql: string, values: unknown[]) => {
      const [found] = await db.query(sql, values);
      return (found as unknown[]).length > 0;
    };

    for (const user of sample.users) {
      if (
        mode === 'add' &&
        (await exists('SELECT 1 FROM users WHERE id = ? OR email = ?', [user.id, user.email]))
      ) {
        continue;
      }
      const password = SEED_PASSWORDS[user.id];
      if (!password) throw new Error(`No seed password for ${user.id}`);
      const { added } = await insert(
        `INSERT INTO users (id, name, email, phone, address, city, district, role, password_hash, is_locked, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          user.phone,
          user.address,
          user.city,
          user.district,
          user.role,
          await hashPassword(password),
          user.isLocked ? 1 : 0,
          new Date(user.createdAt),
        ]
      );
      if (added) report.users++;
    }

    for (const [index, category] of sample.categories.entries()) {
      await insert(
        `INSERT INTO categories (id, name, slug, description, icon, illustration_type, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.slug,
          category.description,
          category.icon,
          category.illustrationType,
          index,
        ]
      );
    }

    for (const product of sample.products) {
      const categoryId = categoryIdByName.get(product.category);
      if (!categoryId) throw new Error(`Unknown category "${product.category}" on ${product.id}`);
      const { added } = await insert(
        `INSERT INTO products (id, name, slug, sku, category_id, price, original_price, stock, description,
           specs, features, images, colors, capacities, illustration_type, badge,
           is_featured, is_best_seller, is_new, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.slug,
          product.sku,
          categoryId,
          product.price,
          product.originalPrice ?? null,
          product.stock,
          product.description,
          JSON.stringify(product.specs),
          JSON.stringify(product.features),
          JSON.stringify(product.images),
          JSON.stringify(product.variants?.colors ?? []),
          JSON.stringify(product.variants?.capacities ?? []),
          product.illustrationType,
          product.badge ?? null,
          product.isFeatured ? 1 : 0,
          product.isBestSeller ? 1 : 0,
          product.isNew ? 1 : 0,
          product.isActive ? 1 : 0,
          new Date(product.createdAt),
        ]
      );
      if (added) {
        report.products++;
        report.photos += product.images.length;
      } else if (product.images.length > 0) {
        // A product that is already there only receives photos if it has none of its own
        const [result] = await db.query<ResultSetHeader>(
          'UPDATE products SET images = ? WHERE id = ? AND JSON_LENGTH(images) = 0',
          [JSON.stringify(product.images), product.id]
        );
        if (result.affectedRows > 0) report.photos += product.images.length;
      }
    }

    const presentPromotions = new Set<string>();
    for (const promo of sample.promotions) {
      const { added } = await insert(
        `INSERT INTO promotions (code, title, type, discount_percent, max_discount, min_order, valid_until, usage_count, max_usage, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          promo.code,
          promo.title,
          getPromotionType(promo),
          promo.discountPercent,
          promo.maxDiscount ?? null,
          promo.minOrder,
          promo.validUntil,
          promo.usageCount,
          promo.maxUsage,
          promo.isActive ? 1 : 0,
        ]
      );
      if (!added) presentPromotions.add(promo.code);
    }

    if (mode === 'add') {
      // The first sample orders were numbered by hand; they take their place among the others
      for (const [before, after] of Object.entries(sample.renumbered)) {
        if (before === after) continue;
        if (await exists('SELECT 1 FROM orders WHERE order_number = ?', [after])) continue;
        await db.query('UPDATE orders SET order_number = ? WHERE order_number = ?', [after, before]);
      }
    }

    // Oldest first, so the generated ids follow the order the orders were placed in
    for (const order of sample.orders) {
      if (
        mode === 'add' &&
        (await exists('SELECT 1 FROM orders WHERE order_number = ?', [order.orderNumber]))
      ) {
        continue;
      }
      const { id: orderId } = await insert(
        `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_email,
           city, district, ward, address, note, subtotal, shipping_fee, discount_amount, coupon_code,
           total_amount, payment_method, payment_status, paid_at, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.orderNumber,
          order.userId && knownUsers.has(order.userId) ? order.userId : null,
          order.customer.name,
          order.customer.phone,
          order.customer.email,
          order.customer.city,
          order.customer.district,
          order.customer.ward,
          order.customer.address,
          order.customer.note ?? null,
          order.subtotal,
          order.shippingFee,
          order.discountAmount,
          order.couponCode ?? null,
          order.totalAmount,
          order.paymentMethod,
          order.paymentStatus,
          order.paidAt ? new Date(order.paidAt) : null,
          order.status,
          new Date(order.createdAt),
          new Date(order.updatedAt),
        ]
      );
      report.orders++;

      for (const item of order.items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_sku, illustration_type,
             image, unit_price, quantity, selected_color, selected_capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.product.name,
            item.product.sku,
            item.product.illustrationType,
            item.product.images[0] ?? null,
            item.product.price,
            item.quantity,
            item.selectedColor ?? null,
            item.selectedCapacity ?? null,
          ]
        );
      }

      for (const event of getOrderHistory(order)) {
        await db.query(
          'INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
          [orderId, event.status, event.note ?? null, new Date(event.at)]
        );
      }

      // A promotion that was already there has not counted this order yet
      if (order.couponCode && order.status !== 'cancelled' && presentPromotions.has(order.couponCode)) {
        await db.query('UPDATE promotions SET usage_count = usage_count + 1 WHERE code = ?', [
          order.couponCode,
        ]);
      }
    }

    for (const review of sample.reviews) {
      const { added } = await insert(
        `INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, verified_purchase, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          review.id,
          review.productId,
          review.userId && knownUsers.has(review.userId) ? review.userId : null,
          review.userName,
          review.rating,
          review.comment,
          review.verifiedPurchase ? 1 : 0,
          new Date(review.date),
        ]
      );
      if (added) report.reviews++;
    }
  });

  return report;
}

/** Fills an empty database with the sample shop. Runs in one transaction. */
export async function seed(): Promise<SeedReport> {
  const report = await load('fill');
  // New orders continue after the highest sample order number
  await getPool().query('ALTER TABLE orders AUTO_INCREMENT = 1001');
  return report;
}

/** Adds the sample data that a database in use does not have yet. Deletes nothing. */
export function addMissingSampleData(): Promise<SeedReport> {
  return load('add');
}
