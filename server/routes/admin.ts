import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config';
import { row, rows, run } from '../db/pool';
import {
  USER_SELECT,
  UserRow,
  loadCategories,
  loadMessages,
  loadOrders,
  loadProducts,
  loadPromotions,
  loadSubscribers,
  toUser,
} from '../db/mappers';
import {
  endSession,
  getSessionLifetime,
  hashPassword,
  requireAdmin,
  resolveUser,
  startSession,
  verifyPassword,
  wastePasswordCheck,
} from '../auth';
import { badRequest, conflict, newId, notFound, text, unauthorized } from '../http';
import { loginLimiter } from './auth';
import { confirmPayment, moveOrder } from '../services/orders';
import {
  ProductInput,
  PromotionInput,
  validatePassword,
  validateProductInput,
  validatePromotionInput,
} from '../../shared/validators';
import { slugify } from '../../shared/validation';
import { IllustrationType, OrderStatus } from '../../shared/types';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Signing in. Everything below this block requires an administrator session.
// ---------------------------------------------------------------------------

adminRouter.get('/auth/me', async (req, res) => {
  const admin = await resolveUser(req, 'admin');
  res.json({ user: admin ? toUser(admin) : null });
});

adminRouter.post('/auth/login', async (req, res) => {
  const email = text(req.body?.email, 190).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw badRequest('Vui lòng nhập email và mật khẩu.');

  const key = `admin:${req.ip}:${email}`;
  loginLimiter.check(key);

  const account = await row<UserRow>('SELECT * FROM users WHERE email = ?', [email]);
  const isAdmin = !!account && account.role === 'admin' && !account.is_locked;
  const matches = isAdmin
    ? await verifyPassword(password, account.password_hash)
    : await wastePasswordCheck(password);

  if (!isAdmin || !matches) {
    loginLimiter.fail(key);
    throw unauthorized('Tài khoản hoặc mật khẩu quản trị không chính xác.');
  }

  loginLimiter.reset(key);
  startSession(res, 'admin', account, getSessionLifetime('admin', req.body?.remember === true));
  res.json({ user: toUser(account) });
});

adminRouter.post('/auth/logout', (_req, res) => {
  endSession(res, 'admin');
  res.json({ ok: true });
});

adminRouter.use(requireAdmin);

adminRouter.put('/auth/password', async (req, res) => {
  const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!(await verifyPassword(current, req.user!.password_hash))) {
    throw badRequest('Mật khẩu hiện tại không đúng.');
  }
  const error = validatePassword(next);
  if (error) throw badRequest(error);
  if (current === next) throw badRequest('Mật khẩu mới phải khác mật khẩu hiện tại.');

  await run('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [
    await hashPassword(next),
    req.user!.id,
  ]);
  const admin = (await row<UserRow>('SELECT * FROM users WHERE id = ?', [req.user!.id]))!;
  startSession(res, 'admin', admin, getSessionLifetime('admin'));
  res.json({ ok: true });
});

/** Everything the admin area shows, in one request */
adminRouter.get('/overview', async (_req, res) => {
  const [products, categories, orders, users, promotions, messages, subscribers] =
    await Promise.all([
      loadProducts(false),
      loadCategories(),
      loadOrders(),
      rows<UserRow>(`${USER_SELECT} ORDER BY u.created_at DESC`),
      loadPromotions(),
      loadMessages(),
      loadSubscribers(),
    ]);
  res.json({
    products,
    categories,
    orders,
    users: users.map(toUser),
    promotions,
    messages,
    subscribers,
  });
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const ILLUSTRATIONS: IllustrationType[] = [
  'audio',
  'watch',
  'lamp',
  'speaker',
  'keyboard',
  'hub',
  'desk',
  'camera',
];

const MAX_IMAGES = 6;

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value.map((entry) => text(entry, maxLength)).filter(Boolean);
  return [...new Set(cleaned)].slice(0, maxItems);
}

function parseProduct(body: Record<string, unknown>): ProductInput {
  const specs: Record<string, string> = {};
  if (body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
    for (const [key, value] of Object.entries(body.specs).slice(0, 30)) {
      const name = text(key, 80);
      if (name) specs[name] = text(value, 200);
    }
  }
  const variants = (body.variants ?? {}) as Record<string, unknown>;
  const colors = stringList(variants.colors, 12, 80);
  const capacities = stringList(variants.capacities, 12, 80);
  const images = stringList(body.images, MAX_IMAGES, 500).filter((url) =>
    /^(https?:\/\/|\/uploads\/)/i.test(url)
  );

  return {
    name: text(body.name, 200),
    sku: text(body.sku, 40).toUpperCase(),
    category: text(body.category, 120),
    price: Number(body.price),
    originalPrice:
      body.originalPrice === undefined || body.originalPrice === null || body.originalPrice === ''
        ? undefined
        : Number(body.originalPrice),
    stock: Number(body.stock),
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : '',
    specs,
    features: stringList(body.features, 20, 300),
    images,
    illustrationType: ILLUSTRATIONS.includes(body.illustrationType as IllustrationType)
      ? (body.illustrationType as IllustrationType)
      : 'audio',
    badge: text(body.badge, 40) || undefined,
    isFeatured: body.isFeatured === true,
    isBestSeller: body.isBestSeller === true,
    isNew: body.isNew === true,
    variants: colors.length > 0 || capacities.length > 0 ? { colors, capacities } : undefined,
    isActive: body.isActive !== false,
  };
}

/** Validates a product and resolves what only the database knows: its category and SKU */
async function checkProduct(input: ProductInput, ignoreId?: string): Promise<string> {
  const error = validateProductInput(input);
  if (error) throw badRequest(error);

  const category = await row<{ id: string }>('SELECT id FROM categories WHERE name = ?', [
    input.category,
  ]);
  if (!category) throw badRequest('Danh mục không tồn tại.');

  const duplicate = await row<{ id: string }>('SELECT id FROM products WHERE sku = ? AND id <> ?', [
    input.sku,
    ignoreId ?? '',
  ]);
  if (duplicate) throw conflict(`Mã SKU "${input.sku}" đã được dùng cho sản phẩm khác.`);

  return category.id;
}

adminRouter.post('/products', async (req, res) => {
  const input = parseProduct(req.body ?? {});
  const categoryId = await checkProduct(input);

  const id = newId('prod');
  const baseSlug = slugify(input.name) || id;
  const taken = await row('SELECT id FROM products WHERE slug = ?', [baseSlug]);
  const slug = taken ? `${baseSlug}-${id.slice(-6)}` : baseSlug;

  await run(
    `INSERT INTO products (id, name, slug, sku, category_id, price, original_price, stock, description,
       specs, features, images, colors, capacities, illustration_type, badge,
       is_featured, is_best_seller, is_new, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      slug.slice(0, 220),
      input.sku,
      categoryId,
      input.price,
      input.originalPrice ?? null,
      input.stock,
      input.description,
      JSON.stringify(input.specs),
      JSON.stringify(input.features),
      JSON.stringify(input.images),
      JSON.stringify(input.variants?.colors ?? []),
      JSON.stringify(input.variants?.capacities ?? []),
      input.illustrationType,
      input.badge ?? null,
      input.isFeatured ? 1 : 0,
      input.isBestSeller ? 1 : 0,
      1,
      input.isActive ? 1 : 0,
    ]
  );
  res.status(201).json({ id });
});

adminRouter.put('/products/:id', async (req, res) => {
  const id = req.params.id;
  const existing = await row<{ is_best_seller: number; is_new: number }>(
    'SELECT is_best_seller, is_new FROM products WHERE id = ?',
    [id]
  );
  if (!existing) throw notFound('Không tìm thấy sản phẩm.');

  const input = parseProduct(req.body ?? {});
  const categoryId = await checkProduct(input, id);

  await run(
    `UPDATE products SET name = ?, sku = ?, category_id = ?, price = ?, original_price = ?, stock = ?,
       description = ?, specs = ?, features = ?, images = ?, colors = ?, capacities = ?,
       illustration_type = ?, badge = ?, is_featured = ?, is_active = ?
     WHERE id = ?`,
    [
      input.name,
      input.sku,
      categoryId,
      input.price,
      input.originalPrice ?? null,
      input.stock,
      input.description,
      JSON.stringify(input.specs),
      JSON.stringify(input.features),
      JSON.stringify(input.images),
      JSON.stringify(input.variants?.colors ?? []),
      JSON.stringify(input.variants?.capacities ?? []),
      input.illustrationType,
      input.badge ?? null,
      input.isFeatured ? 1 : 0,
      input.isActive ? 1 : 0,
      id,
    ]
  );
  res.json({ ok: true });
});

adminRouter.patch('/products/:id/active', async (req, res) => {
  const result = await run('UPDATE products SET is_active = ? WHERE id = ?', [
    req.body?.isActive === true ? 1 : 0,
    req.params.id,
  ]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy sản phẩm.');
  res.json({ ok: true });
});

adminRouter.delete('/products/:id', async (req, res) => {
  const product = await row<{ images: string[] | string }>('SELECT images FROM products WHERE id = ?', [
    req.params.id,
  ]);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  // Reviews and cart lines go with the product; orders keep their own copy of what was bought
  await run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Product photos
// ---------------------------------------------------------------------------

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

fs.mkdirSync(config.uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    // The name is generated here; nothing from the uploaded file name reaches the disk
    filename: (_req, file, done) => done(null, `${newId('img')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (IMAGE_TYPES[file.mimetype]) done(null, true);
    else done(badRequest('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.'));
  },
});

adminRouter.post('/uploads', upload.single('image'), (req, res) => {
  if (!req.file) throw badRequest('Vui lòng chọn một tệp ảnh.');
  res.status(201).json({ url: `/uploads/${path.basename(req.file.filename)}` });
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
];

adminRouter.patch('/orders/:id/status', async (req, res) => {
  const orderId = Number(req.params.id);
  const next = req.body?.status as OrderStatus;
  if (!Number.isInteger(orderId)) throw notFound('Không tìm thấy đơn hàng.');
  if (!STATUSES.includes(next)) throw badRequest('Trạng thái không hợp lệ.');

  const order = await moveOrder(
    orderId,
    next,
    next === 'cancelled' ? 'Cửa hàng hủy đơn' : undefined
  );
  res.json({ order });
});

adminRouter.post('/orders/:id/confirm-payment', async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) throw notFound('Không tìm thấy đơn hàng.');
  res.json({ order: await confirmPayment(orderId) });
});

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

adminRouter.patch('/users/:id/lock', async (req, res) => {
  const lock = req.body?.isLocked === true;
  // Raising the version ends the customer's sessions, so unlocking does not sign them back in
  const result = await run(
    `UPDATE users SET is_locked = ?, token_version = token_version + ?
     WHERE id = ? AND role = 'customer'`,
    [lock ? 1 : 0, lock ? 1 : 0, req.params.id]
  );
  if (result.affectedRows === 0) throw notFound('Không tìm thấy khách hàng.');
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

function parsePromotion(body: Record<string, unknown>, code: string): PromotionInput {
  const type = body.type === 'freeship' ? 'freeship' : 'percent';
  return {
    code,
    title: text(body.title, 160),
    type,
    discountPercent: type === 'percent' ? Number(body.discountPercent) : 0,
    maxDiscount:
      body.maxDiscount === undefined || body.maxDiscount === null || body.maxDiscount === ''
        ? undefined
        : Number(body.maxDiscount),
    minOrder: Number(body.minOrder),
    validUntil: text(body.validUntil, 10),
    maxUsage: Number(body.maxUsage),
    isActive: body.isActive !== false,
  };
}

adminRouter.post('/promotions', async (req, res) => {
  const input = parsePromotion(req.body ?? {}, text(req.body?.code, 20).toUpperCase());
  const error = validatePromotionInput(input);
  if (error) throw badRequest(error);

  const existing = await row('SELECT code FROM promotions WHERE code = ?', [input.code]);
  if (existing) throw conflict(`Mã "${input.code}" đã tồn tại.`);

  await run(
    `INSERT INTO promotions (code, title, type, discount_percent, max_discount, min_order, valid_until, max_usage, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.code,
      input.title,
      input.type!,
      input.discountPercent,
      input.maxDiscount ?? null,
      input.minOrder,
      input.validUntil,
      input.maxUsage,
      input.isActive ? 1 : 0,
    ]
  );
  res.status(201).json({ ok: true });
});

adminRouter.put('/promotions/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const existing = await row<{ usage_count: number }>(
    'SELECT usage_count FROM promotions WHERE code = ?',
    [code]
  );
  if (!existing) throw notFound('Không tìm thấy mã khuyến mãi.');

  const input = parsePromotion(req.body ?? {}, code);
  const error = validatePromotionInput(input);
  if (error) throw badRequest(error);
  if (input.maxUsage < existing.usage_count) {
    throw conflict(`Mã đã được dùng ${existing.usage_count} lượt, không thể đặt giới hạn thấp hơn.`);
  }

  await run(
    `UPDATE promotions SET title = ?, type = ?, discount_percent = ?, max_discount = ?, min_order = ?,
       valid_until = ?, max_usage = ?, is_active = ?
     WHERE code = ?`,
    [
      input.title,
      input.type!,
      input.discountPercent,
      input.maxDiscount ?? null,
      input.minOrder,
      input.validUntil,
      input.maxUsage,
      input.isActive ? 1 : 0,
      code,
    ]
  );
  res.json({ ok: true });
});

adminRouter.patch('/promotions/:code/active', async (req, res) => {
  const result = await run('UPDATE promotions SET is_active = ? WHERE code = ?', [
    req.body?.isActive === true ? 1 : 0,
    req.params.code.toUpperCase(),
  ]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy mã khuyến mãi.');
  res.json({ ok: true });
});

adminRouter.delete('/promotions/:code', async (req, res) => {
  const result = await run('DELETE FROM promotions WHERE code = ?', [req.params.code.toUpperCase()]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy mã khuyến mãi.');
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

adminRouter.patch('/messages/:id/read', async (req, res) => {
  const result = await run('UPDATE contact_messages SET is_read = ? WHERE id = ?', [
    req.body?.isRead === true ? 1 : 0,
    req.params.id,
  ]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy tin nhắn.');
  res.json({ ok: true });
});

adminRouter.delete('/messages/:id', async (req, res) => {
  const result = await run('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy tin nhắn.');
  res.json({ ok: true });
});

adminRouter.delete('/subscribers/:email', async (req, res) => {
  const result = await run('DELETE FROM newsletter_subscribers WHERE email = ?', [
    req.params.email.toLowerCase(),
  ]);
  if (result.affectedRows === 0) throw notFound('Không tìm thấy email.');
  res.json({ ok: true });
});
