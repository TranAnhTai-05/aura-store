import { Router } from 'express';
import { row, run } from '../db/pool';
import { loadOrders } from '../db/mappers';
import { requireCustomer } from '../auth';
import { badRequest, conflict, forbidden, newId, notFound, text } from '../http';
import { parseCartLines } from './cart';
import { moveOrder, placeOrder } from '../services/orders';
import { canCustomerCancel } from '../../shared/orders';
import { validateReview } from '../../shared/validators';
import { SHOP } from '../../shared/config';

export const ordersRouter = Router();
export const reviewsRouter = Router();

ordersRouter.use(requireCustomer);

/** The signed-in customer's own orders, and nobody else's */
ordersRouter.get('/', async (req, res) => {
  res.json({ orders: await loadOrders('WHERE user_id = ?', [req.user!.id]) });
});

ordersRouter.post('/', async (req, res) => {
  const body = req.body ?? {};
  const customer = body.customer ?? {};
  const order = await placeOrder({
    userId: req.user!.id,
    customer: {
      name: text(customer.name, 120),
      phone: text(customer.phone, 20),
      email: text(customer.email, 190),
      city: text(customer.city, 80),
      district: text(customer.district, 80),
      ward: text(customer.ward, 80),
      address: text(customer.address, 255),
      note: text(customer.note, 300) || undefined,
    },
    paymentMethod: body.paymentMethod,
    lines: parseCartLines(body.lines),
    couponCode: text(body.couponCode, 20).toUpperCase() || undefined,
  });
  res.status(201).json({ order });
});

ordersRouter.post('/:id/cancel', async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) throw notFound('Không tìm thấy đơn hàng.');

  const owner = await row<{ user_id: string | null }>('SELECT user_id FROM orders WHERE id = ?', [
    orderId,
  ]);
  // Someone else's order is reported as missing rather than as forbidden
  if (!owner || owner.user_id !== req.user!.id) throw notFound('Không tìm thấy đơn hàng.');

  const order = await moveOrder(orderId, 'cancelled', 'Khách hàng hủy đơn', (current) => {
    if (!canCustomerCancel(current)) {
      throw forbidden(`Đơn hàng đã được xử lý, vui lòng gọi ${SHOP.hotline} để được hỗ trợ hủy.`);
    }
  });
  res.json({ order });
});

reviewsRouter.post('/', requireCustomer, async (req, res) => {
  const input = {
    productId: text(req.body?.productId, 40),
    rating: Number(req.body?.rating),
    comment: typeof req.body?.comment === 'string' ? req.body.comment.trim() : '',
  };
  const error = validateReview(input);
  if (error) throw badRequest(error);

  const product = await row('SELECT id FROM products WHERE id = ? AND is_active = 1', [
    input.productId,
  ]);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  const user = req.user!;
  const existing = await row('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [
    input.productId,
    user.id,
  ]);
  if (existing) throw conflict('Bạn đã đánh giá sản phẩm này rồi.');

  // "Verified purchase" is decided here, from the customer's delivered orders
  const purchase = await row(
    `SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND o.status = 'delivered' AND oi.product_id = ? LIMIT 1`,
    [user.id, input.productId]
  );

  await run(
    `INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, verified_purchase)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newId('rev'), input.productId, user.id, user.name, input.rating, input.comment, purchase ? 1 : 0]
  );
  res.status(201).json({ ok: true });
});
