import type { PoolConnection } from 'mysql2/promise';
import { rows, row, transaction } from '../db/pool';
import { PromotionRow, loadOrders, toPromotion } from '../db/mappers';
import { badRequest, conflict, notFound } from '../http';
import { CartLine, CustomerInfo, Order, OrderStatus, PaymentMethod } from '../../shared/types';
import { calcShippingFee, evaluateCoupon } from '../../shared/pricing';
import { getTransitionError } from '../../shared/orders';
import { validateCustomerInfo } from '../../shared/validators';
import { normalizePhone } from '../../shared/validation';

type StockRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  is_active: number;
  illustration_type: string;
  images: string[] | string;
  colors: string[] | string;
  capacities: string[] | string;
};

const list = (value: string[] | string): string[] => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export type PlaceOrderInput = {
  userId: string;
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
  couponCode?: string;
};

/**
 * Places an order. Prices, stock and the discount are taken from the database, never
 * from the browser. The product rows are locked while this runs, so two customers
 * cannot both buy the last item.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  if (input.paymentMethod !== 'cod' && input.paymentMethod !== 'bank_transfer') {
    throw badRequest('Phương thức thanh toán không được hỗ trợ.');
  }
  const fieldErrors = Object.values(validateCustomerInfo(input.customer));
  if (fieldErrors.length > 0) throw badRequest(fieldErrors[0]!);
  if (input.lines.length === 0) throw badRequest('Giỏ hàng đang trống.');

  const orderId = await transaction(async (db) => {
    const ids = [...new Set(input.lines.map((l) => l.productId))].sort();
    const products = await rows<StockRow>(
      `SELECT id, name, sku, price, stock, is_active, illustration_type, images, colors, capacities
       FROM products WHERE id IN (${ids.map(() => '?').join(', ')})
       ORDER BY id FOR UPDATE`,
      ids,
      db
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    const wanted = new Map<string, number>();
    for (const line of input.lines) {
      const product = byId.get(line.productId);
      if (!product || !product.is_active) {
        throw conflict('Một sản phẩm trong giỏ không còn được bán. Vui lòng kiểm tra lại giỏ hàng.');
      }
      const colors = list(product.colors);
      const capacities = list(product.capacities);
      if (colors.length > 0 && !colors.includes(line.selectedColor ?? '')) {
        throw badRequest(`Vui lòng chọn lại màu cho "${product.name}".`);
      }
      if (capacities.length > 0 && !capacities.includes(line.selectedCapacity ?? '')) {
        throw badRequest(`Vui lòng chọn lại kích thước cho "${product.name}".`);
      }
      wanted.set(product.id, (wanted.get(product.id) ?? 0) + line.quantity);
    }

    for (const [productId, quantity] of wanted) {
      const product = byId.get(productId)!;
      if (product.stock <= 0) throw conflict(`"${product.name}" đã hết hàng.`);
      if (quantity > product.stock) {
        throw conflict(`"${product.name}" chỉ còn ${product.stock} sản phẩm.`);
      }
    }

    const subtotal = input.lines.reduce(
      (sum, line) => sum + byId.get(line.productId)!.price * line.quantity,
      0
    );
    const shippingFee = calcShippingFee(subtotal);

    let discountAmount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const promo = await row<PromotionRow>(
        'SELECT * FROM promotions WHERE code = ? FOR UPDATE',
        [input.couponCode],
        db
      );
      if (!promo) throw conflict('Mã giảm giá không tồn tại. Vui lòng gỡ mã và thử lại.');
      const evaluation = evaluateCoupon(toPromotion(promo), subtotal, shippingFee);
      if (!evaluation.valid) throw conflict(evaluation.reason);
      discountAmount = evaluation.discount;
      couponCode = promo.code;
      await db.query('UPDATE promotions SET usage_count = usage_count + 1 WHERE code = ?', [
        promo.code,
      ]);
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
    const customer = input.customer;
    const now = new Date();

    const [inserted] = await db.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_email,
         city, district, ward, address, note, subtotal, shipping_fee, discount_amount, coupon_code,
         total_amount, payment_method, payment_status, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)`,
      [
        // Replaced right below, once the id that makes it unique is known
        `T-${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        input.userId,
        customer.name.trim().slice(0, 120),
        normalizePhone(customer.phone),
        customer.email.trim().slice(0, 190),
        customer.city.trim().slice(0, 80),
        customer.district.trim().slice(0, 80),
        customer.ward.trim().slice(0, 80),
        customer.address.trim().slice(0, 255),
        customer.note?.trim().slice(0, 300) || null,
        subtotal,
        shippingFee,
        discountAmount,
        couponCode,
        totalAmount,
        input.paymentMethod,
        now,
        now,
      ]
    );
    const id = (inserted as { insertId: number }).insertId;
    await db.query('UPDATE orders SET order_number = ? WHERE id = ?', [`AUR-${10000 + id}`, id]);

    for (const line of input.lines) {
      const product = byId.get(line.productId)!;
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, illustration_type,
           image, unit_price, quantity, selected_color, selected_capacity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          product.id,
          product.name,
          product.sku,
          product.illustration_type,
          list(product.images)[0] ?? null,
          product.price,
          line.quantity,
          line.selectedColor ?? null,
          line.selectedCapacity ?? null,
        ]
      );
    }

    for (const [productId, quantity] of wanted) {
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
    }

    await db.query(
      "INSERT INTO order_events (order_id, status, created_at) VALUES (?, 'pending', ?)",
      [id, now]
    );
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [input.userId]);

    return id;
  });

  return (await loadOrders('WHERE id = ?', [orderId]))[0];
}

/** Puts the goods back on the shelf and gives the coupon use back */
async function releaseOrder(db: PoolConnection, order: Order) {
  for (const item of order.items) {
    if (!item.productId) continue; // the product was deleted in the meantime
    await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
      item.quantity,
      item.productId,
    ]);
  }
  if (order.couponCode) {
    await db.query(
      'UPDATE promotions SET usage_count = GREATEST(usage_count, 1) - 1 WHERE code = ?',
      [order.couponCode]
    );
  }
}

/**
 * Moves an order to another status. `guard` lets the caller add its own condition
 * (e.g. that a customer may only cancel early); it sees the order as it is locked.
 */
export async function moveOrder(
  orderId: number,
  next: OrderStatus,
  note: string | undefined,
  guard?: (order: Order) => void
): Promise<Order> {
  await transaction(async (db) => {
    const locked = await row('SELECT id FROM orders WHERE id = ? FOR UPDATE', [orderId], db);
    if (!locked) throw notFound('Không tìm thấy đơn hàng.');

    const order = (await loadOrders('WHERE id = ?', [orderId], db))[0];
    // What the order itself allows comes first, so a finished order is reported as finished
    const error = getTransitionError(order, next);
    if (error) throw conflict(error);
    guard?.(order);

    const now = new Date();
    let paymentStatus = order.paymentStatus;
    let paidAt: Date | null = order.paidAt ? new Date(order.paidAt) : null;

    if (next === 'delivered' && paymentStatus === 'pending') {
      // Cash on delivery is collected by the courier on hand-over
      paymentStatus = 'paid';
      paidAt = now;
    }
    if (next === 'cancelled') {
      await releaseOrder(db, order);
      if (paymentStatus === 'paid') paymentStatus = 'refunded';
    }

    await db.query(
      'UPDATE orders SET status = ?, payment_status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
      [next, paymentStatus, paidAt, now, orderId]
    );
    await db.query(
      'INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
      [orderId, next, note ?? null, now]
    );
  });

  return (await loadOrders('WHERE id = ?', [orderId]))[0];
}

export async function confirmPayment(orderId: number): Promise<Order> {
  await transaction(async (db) => {
    const order = await row<{ status: OrderStatus; payment_status: string }>(
      'SELECT status, payment_status FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
      db
    );
    if (!order) throw notFound('Không tìm thấy đơn hàng.');
    if (order.status === 'cancelled') throw conflict('Đơn hàng đã hủy.');
    if (order.payment_status !== 'pending') {
      throw conflict('Đơn hàng này đã được ghi nhận thanh toán.');
    }
    const now = new Date();
    await db.query(
      "UPDATE orders SET payment_status = 'paid', paid_at = ?, updated_at = ? WHERE id = ?",
      [now, now, orderId]
    );
  });
  return (await loadOrders('WHERE id = ?', [orderId]))[0];
}
