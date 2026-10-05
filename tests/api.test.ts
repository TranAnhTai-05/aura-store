/**
 * The API against a real MySQL database.
 *
 * Uses its own database (the DB_NAME from .env followed by "_test"), which is wiped and
 * filled with the sample data at the start. The shop's own database is never touched.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env'), quiet: true });
process.env.DB_NAME = `${process.env.DB_NAME}_test`;

let server: Server;
let baseUrl = '';
let closeDatabase: () => Promise<void>;

before(async () => {
  // Imported only now, so that the server reads the test database name set above
  const { connect, disconnect } = await import('../server/db/pool');
  const { dropAllTables, migrate } = await import('../server/db/schema');
  const { seed } = await import('../server/db/seed');
  const { createApp } = await import('../server/app');

  await connect();
  await dropAllTables();
  await migrate();
  await seed();
  closeDatabase = disconnect;

  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDatabase();
});

/** A browser: keeps its cookies between requests */
class Browser {
  private cookies = new Map<string, string>();

  async request(method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
    const response = await fetch(baseUrl + url, {
      method,
      headers: {
        'X-Aura-Client': 'web',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(this.cookies.size > 0
          ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') }
          : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const [name, value] = pair.split('=');
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    const data = (await response.json().catch(() => ({}))) as any;
    return { status: response.status, data, setCookie: response.headers.getSetCookie() };
  }

  get = (url: string) => this.request('GET', url);
  post = (url: string, body: unknown = {}) => this.request('POST', url, body);
  put = (url: string, body: unknown = {}) => this.request('PUT', url, body);
  patch = (url: string, body: unknown = {}) => this.request('PATCH', url, body);
  delete = (url: string) => this.request('DELETE', url);
}

const ADMIN = { email: 'admin@aura.vn', password: 'admin123' };
const DEMO = { email: 'tyce@example.com', password: '123456' };

const address = {
  name: 'Khách Kiểm Thử',
  phone: '0905123456',
  email: 'kiemthu@example.com',
  city: 'Đà Nẵng',
  district: 'Hải Châu',
  ward: 'Thạch Thang',
  address: '25 Lê Duẩn',
};

let counter = 0;
async function newCustomer() {
  const browser = new Browser();
  const email = `khach${++counter}.${Date.now()}@example.com`;
  const result = await browser.post('/api/auth/register', {
    name: `Khách ${counter}`,
    email,
    phone: '0905123456',
    password: 'mat-khau-thu',
  });
  assert.equal(result.status, 201);
  return { browser, email, user: result.data.user };
}

async function admin() {
  const browser = new Browser();
  assert.equal((await browser.post('/api/admin/auth/login', ADMIN)).status, 200);
  return browser;
}

const catalog = async () => (await new Browser().get('/api/catalog')).data;
const product = async (id: string) => (await catalog()).products.find((p: any) => p.id === id);
const promotion = async (code: string) =>
  (await catalog()).promotions.find((p: any) => p.code === code);

const order = (browser: Browser, lines: unknown[], extra: Record<string, unknown> = {}) =>
  browser.post('/api/orders', { customer: address, paymentMethod: 'cod', lines, ...extra });

// ---------------------------------------------------------------------------

test('the catalogue comes from the database with computed figures', async () => {
  const { buildSeed } = await import('../server/db/seedBuilder');
  const { isCountedOrder } = await import('../shared/orders');
  const sample = buildSeed();

  const { products, categories, promotions, reviews } = await catalog();
  assert.equal(products.length, sample.products.length);
  assert.equal(promotions.length, 3);
  assert.equal(reviews.length, sample.reviews.length);

  // Every figure a product shows is worked out from its reviews and orders
  for (const expected of sample.products) {
    const own = sample.reviews.filter((r) => r.productId === expected.id);
    const average = own.reduce((sum, r) => sum + r.rating, 0) / (own.length || 1);
    const sold = sample.orders
      .filter(isCountedOrder)
      .flatMap((o) => o.items)
      .filter((item) => item.productId === expected.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const actual = products.find((p: any) => p.id === expected.id);
    assert.equal(actual.reviewsCount, own.length, `${expected.id} reviews`);
    assert.equal(actual.rating, Math.round(average * 10) / 10, `${expected.id} rating`);
    assert.equal(actual.soldCount, sold, `${expected.id} sold`);
    assert.deepEqual(actual.images, expected.images);
  }

  const headphones = products.find((p: any) => p.id === 'prod-01');
  assert.equal(headphones.category, 'Âm thanh & Loa');
  assert.equal(headphones.reviewsCount, 3); // three reviews in the sample data
  assert.equal(headphones.rating, 4.7); // (5 + 5 + 4) / 3
  assert.equal(headphones.discount, 12);

  // The sample shop has something to show at every price and rating level
  const ratings = products.filter((p: any) => p.reviewsCount > 0).map((p: any) => p.rating);
  assert.ok(products.some((p: any) => p.price < 1_000_000));
  assert.ok(products.some((p: any) => p.price > 8_000_000));
  assert.ok(ratings.some((r: number) => r >= 4.5));
  assert.ok(ratings.some((r: number) => r < 3));
  assert.ok(products.some((p: any) => p.reviewsCount === 0));

  const audio = categories.find((c: any) => c.name === 'Âm thanh & Loa');
  assert.equal(audio.itemCount, sample.products.filter((p) => p.category === audio.name).length);
});

test('adding the sample data again changes nothing', async () => {
  const { addMissingSampleData } = await import('../server/db/seed');
  const before = await catalog();
  assert.deepEqual(await addMissingSampleData(), {
    users: 0,
    products: 0,
    photos: 0,
    orders: 0,
    reviews: 0,
  });
  assert.deepEqual(await catalog(), before);
});

test('changes without the client header are refused', async () => {
  const response = await fetch(`${baseUrl}/api/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'csrf@example.com' }),
  });
  assert.equal(response.status, 403);
});

test('registration validates its input and refuses duplicates', async () => {
  const browser = new Browser();
  const base = { name: 'Người Mới', email: 'moi@example.com', phone: '0905123456', password: 'du-dai-roi' };

  assert.equal((await browser.post('/api/auth/register', { ...base, password: '123' })).status, 400);
  assert.equal((await browser.post('/api/auth/register', { ...base, phone: '11111111111' })).status, 400);
  assert.equal((await browser.post('/api/auth/register', { ...base, email: 'khong-hop-le' })).status, 400);
  assert.equal((await browser.post('/api/auth/register', { ...base, email: DEMO.email })).status, 409);
  assert.equal((await browser.post('/api/auth/register', base)).status, 201);
});

test('signing in checks the password and sets an httpOnly cookie', async () => {
  const browser = new Browser();
  const wrong = await browser.post('/api/auth/login', { ...DEMO, password: 'sai-mat-khau' });
  assert.equal(wrong.status, 401);
  assert.equal((await browser.get('/api/auth/me')).data.user, null);

  const right = await browser.post('/api/auth/login', DEMO);
  assert.equal(right.status, 200);
  assert.equal(right.data.user.name, 'Lê Hoàng Nam');
  assert.equal('password_hash' in right.data.user, false);
  assert.match(right.setCookie.join(';'), /aura_session=.*HttpOnly/i);

  assert.equal((await browser.get('/api/auth/me')).data.user.email, DEMO.email);
  await browser.post('/api/auth/logout');
  assert.equal((await browser.get('/api/auth/me')).data.user, null);
});

test('unknown accounts and wrong passwords get the same answer', async () => {
  const browser = new Browser();
  const unknown = await browser.post('/api/auth/login', { email: 'ai-do@example.com', password: 'x' });
  const wrong = await browser.post('/api/auth/login', { ...DEMO, password: 'x' });
  assert.equal(unknown.status, wrong.status);
  assert.equal(unknown.data.error, wrong.data.error);
});

test('customers and administrators cannot use each other\'s door', async () => {
  const browser = new Browser();
  assert.equal((await browser.post('/api/auth/login', ADMIN)).status, 401);
  assert.equal((await browser.post('/api/admin/auth/login', DEMO)).status, 401);
});

test('the admin area is closed to visitors and to customers', async () => {
  const visitor = new Browser();
  assert.equal((await visitor.get('/api/admin/overview')).status, 401);
  assert.equal((await visitor.patch('/api/admin/orders/1/status', { status: 'confirmed' })).status, 401);

  const { browser: customer } = await newCustomer();
  assert.equal((await customer.get('/api/admin/overview')).status, 403);
  assert.equal((await customer.delete('/api/admin/products/prod-01')).status, 403);
  assert.ok(await product('prod-01'), 'the product is still there');

  const overview = await (await admin()).get('/api/admin/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.data.orders.length >= 5, true);
});

test('a tampered session is not accepted', async () => {
  const browser = new Browser();
  const response = await fetch(`${baseUrl}/api/orders`, {
    headers: { Cookie: 'aura_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLWFkbWluIn0.' },
  });
  assert.equal(response.status, 401);
  assert.equal((await browser.get('/api/orders')).status, 401);
});

test('an order uses the shop\'s prices, not the ones sent by the browser', async () => {
  const { browser, user } = await newCustomer();
  const before = await product('prod-10');

  const placed = await order(browser, [
    { productId: 'prod-10', quantity: 2, selectedColor: 'Xám Mờ Titan', price: 1, product: { price: 1 } },
  ]);
  assert.equal(placed.status, 201);

  const created = placed.data.order;
  assert.equal(created.subtotal, 2 * 1_590_000);
  assert.equal(created.shippingFee, 0); // above the free shipping threshold
  assert.equal(created.totalAmount, 3_180_000);
  assert.equal(created.status, 'pending');
  assert.equal(created.paymentStatus, 'pending');
  assert.equal(created.userId, user.id);
  assert.match(created.orderNumber, /^AUR-\d+$/);
  assert.equal(created.customer.phone, '0905123456');
  assert.deepEqual(created.history.map((e: any) => e.status), ['pending']);

  assert.equal((await product('prod-10')).stock, before.stock - 2);
  assert.equal((await product('prod-10')).soldCount, before.soldCount + 2);
});

test('shipping is charged below the threshold and coupons are applied by the server', async () => {
  const { browser } = await newCustomer();
  const usageBefore = (await promotion('AURAXIN')).usageCount;

  const placed = await order(
    browser,
    [{ productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' }],
    { couponCode: 'auraxin' }
  );
  assert.equal(placed.status, 201);
  assert.equal(placed.data.order.subtotal, 1_590_000);
  assert.equal(placed.data.order.shippingFee, 30_000);
  assert.equal(placed.data.order.discountAmount, 159_000);
  assert.equal(placed.data.order.totalAmount, 1_590_000 + 30_000 - 159_000);
  assert.equal(placed.data.order.couponCode, 'AURAXIN');
  assert.equal((await promotion('AURAXIN')).usageCount, usageBefore + 1);
});

test('a coupon that does not apply stops the order', async () => {
  const { browser } = await newCustomer();
  const stock = (await product('prod-10')).stock;

  const placed = await order(
    browser,
    [{ productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' }],
    { couponCode: 'VIPTECH' } // needs 8.000.000₫
  );
  assert.equal(placed.status, 409);
  assert.equal((await product('prod-10')).stock, stock, 'nothing was taken from stock');
});

test('an order needs a valid address, a known variant and a supported payment method', async () => {
  const { browser } = await newCustomer();
  const line = { productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' };

  assert.equal((await browser.post('/api/orders', { customer: { ...address, phone: '123' }, paymentMethod: 'cod', lines: [line] })).status, 400);
  assert.equal((await order(browser, [{ ...line, selectedColor: 'Hồng Cánh Sen' }])).status, 400);
  assert.equal((await order(browser, [line], { paymentMethod: 'credit_card' })).status, 400);
  assert.equal((await order(browser, [])).status, 400);
  assert.equal((await order(browser, [{ productId: 'khong-co', quantity: 1 }])).status, 409);
  assert.equal((await new Browser().post('/api/orders', { customer: address, paymentMethod: 'cod', lines: [line] })).status, 401);
});

test('more than what is in stock cannot be ordered, and nothing changes when it fails', async () => {
  const { browser } = await newCustomer();
  const desk = await product('prod-07');
  const charger = await product('prod-10');

  const placed = await order(browser, [
    { productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' },
    // Two lines of the same product are counted together
    { productId: 'prod-07', quantity: desk.stock, selectedCapacity: '160 x 75 cm' },
    { productId: 'prod-07', quantity: 1, selectedCapacity: '180 x 80 cm' },
  ]);
  assert.equal(placed.status, 409);
  assert.match(placed.data.error, /chỉ còn/);
  assert.equal((await product('prod-07')).stock, desk.stock);
  assert.equal((await product('prod-10')).stock, charger.stock, 'the whole order was rolled back');
  assert.equal((await browser.get('/api/orders')).data.orders.length, 0);
});

test('two customers cannot both buy the last item', async () => {
  const shop = await admin();
  const created = await shop.post('/api/admin/products', {
    name: 'Bản giới hạn chỉ còn một chiếc',
    sku: 'AUR-LAST-01',
    category: 'Phụ kiện cao cấp',
    price: 500_000,
    stock: 1,
    description: 'Dùng để kiểm tra việc mua đồng thời.',
  });
  assert.equal(created.status, 201);

  const buyers = await Promise.all([newCustomer(), newCustomer(), newCustomer(), newCustomer()]);
  const results = await Promise.all(
    buyers.map(({ browser }) => order(browser, [{ productId: created.data.id, quantity: 1 }]))
  );

  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409]);
  assert.equal((await product(created.data.id)).stock, 0);
});

test('customers see and cancel only their own orders', async () => {
  const owner = await newCustomer();
  const stranger = await newCustomer();
  const stock = (await product('prod-10')).stock;

  const placed = await order(owner.browser, [
    { productId: 'prod-10', quantity: 3, selectedColor: 'Trắng Băng Giá' },
  ]);
  const id = placed.data.order.id;

  assert.equal((await owner.browser.get('/api/orders')).data.orders.length, 1);
  assert.equal((await stranger.browser.get('/api/orders')).data.orders.length, 0);
  assert.equal((await stranger.browser.post(`/api/orders/${id}/cancel`)).status, 404);
  assert.equal((await product('prod-10')).stock, stock - 3);

  const cancelled = await owner.browser.post(`/api/orders/${id}/cancel`);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.order.status, 'cancelled');
  assert.equal((await product('prod-10')).stock, stock, 'the goods are back on the shelf');
  assert.equal((await owner.browser.post(`/api/orders/${id}/cancel`)).status, 409);
});

test('an order goes through its steps in order, and ends there', async () => {
  const { browser } = await newCustomer();
  const shop = await admin();
  const placed = await order(browser, [
    { productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' },
  ]);
  const id = placed.data.order.id;
  const move = (status: string) => shop.patch(`/api/admin/orders/${id}/status`, { status });

  assert.equal((await move('shipping')).status, 409, 'steps cannot be skipped');
  assert.equal((await move('nonsense')).status, 400);

  for (const status of ['confirmed', 'processing', 'shipping']) {
    assert.equal((await move(status)).status, 200);
  }
  assert.equal((await move('confirmed')).status, 409, 'no going back');
  assert.equal((await browser.post(`/api/orders/${id}/cancel`)).status, 403, 'too late for the customer');

  const delivered = await move('delivered');
  assert.equal(delivered.status, 200);
  assert.equal(delivered.data.order.paymentStatus, 'paid', 'cash was collected on delivery');
  assert.deepEqual(
    delivered.data.order.history.map((e: any) => e.status),
    ['pending', 'confirmed', 'processing', 'shipping', 'delivered']
  );

  assert.equal((await move('pending')).status, 409);
  assert.equal((await move('cancelled')).status, 409);

  // The customer sees what the shop did
  const mine = (await browser.get('/api/orders')).data.orders[0];
  assert.equal(mine.status, 'delivered');
});

test('a bank transfer order waits for its payment, and is refunded when cancelled', async () => {
  const { browser } = await newCustomer();
  const shop = await admin();
  const stock = (await product('prod-10')).stock;
  const usage = (await promotion('AURAXIN')).usageCount;

  const placed = await order(
    browser,
    [{ productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' }],
    { paymentMethod: 'bank_transfer', couponCode: 'AURAXIN' }
  );
  const id = placed.data.order.id;
  assert.equal(placed.data.order.paymentStatus, 'pending');

  const early = await shop.patch(`/api/admin/orders/${id}/status`, { status: 'confirmed' });
  assert.equal(early.status, 409);
  assert.match(early.data.error, /thanh toán/);

  const paid = await shop.post(`/api/admin/orders/${id}/confirm-payment`);
  assert.equal(paid.data.order.paymentStatus, 'paid');
  assert.equal((await shop.post(`/api/admin/orders/${id}/confirm-payment`)).status, 409);
  assert.equal((await shop.patch(`/api/admin/orders/${id}/status`, { status: 'confirmed' })).status, 200);

  const cancelled = await shop.patch(`/api/admin/orders/${id}/status`, { status: 'cancelled' });
  assert.equal(cancelled.data.order.paymentStatus, 'refunded');
  assert.equal((await product('prod-10')).stock, stock);
  assert.equal((await promotion('AURAXIN')).usageCount, usage);
});

test('a review is one per customer and marked verified only after delivery', async () => {
  const { browser } = await newCustomer();
  const shop = await admin();
  const review = { productId: 'prod-06', rating: 4, comment: 'Dùng ổn định, xuất hình tốt.' };

  assert.equal((await new Browser().post('/api/reviews', review)).status, 401);
  assert.equal((await browser.post('/api/reviews', { ...review, comment: 'ngắn' })).status, 400);
  assert.equal((await browser.post('/api/reviews', { ...review, rating: 9 })).status, 400);

  const before = await product('prod-06');
  assert.equal((await browser.post('/api/reviews', review)).status, 201);
  assert.equal((await browser.post('/api/reviews', review)).status, 409);

  const after = await product('prod-06');
  assert.equal(after.reviewsCount, before.reviewsCount + 1);
  const saved = (await catalog()).reviews.find(
    (r: any) => r.productId === 'prod-06' && r.comment === review.comment
  );
  assert.equal(saved.verifiedPurchase, false, 'nothing was bought yet');

  // Another customer buys the product, receives it, and then reviews it
  const buyer = await newCustomer();
  const placed = await order(buyer.browser, [
    { productId: 'prod-06', quantity: 1, selectedColor: 'Bạc Nguyên Bản' },
  ]);
  for (const status of ['confirmed', 'processing', 'shipping', 'delivered']) {
    await shop.patch(`/api/admin/orders/${placed.data.order.id}/status`, { status });
  }
  await buyer.browser.post('/api/reviews', { ...review, comment: 'Đã mua và rất hài lòng.' });
  const verified = (await catalog()).reviews.find((r: any) => r.comment === 'Đã mua và rất hài lòng.');
  assert.equal(verified.verifiedPurchase, true);
});

test('locking an account ends its session, and unlocking does not bring it back', async () => {
  const { browser, user } = await newCustomer();
  const shop = await admin();
  assert.equal((await browser.get('/api/orders')).status, 200);

  await shop.patch(`/api/admin/users/${user.id}/lock`, { isLocked: true });
  assert.equal((await browser.get('/api/orders')).status, 401);
  const login = await browser.post('/api/auth/login', { email: user.email, password: 'mat-khau-thu' });
  assert.equal(login.status, 403);

  await shop.patch(`/api/admin/users/${user.id}/lock`, { isLocked: false });
  assert.equal((await browser.get('/api/orders')).status, 401, 'the old session stays closed');
  assert.equal(
    (await browser.post('/api/auth/login', { email: user.email, password: 'mat-khau-thu' })).status,
    200
  );

  // Administrators cannot be locked through this endpoint
  assert.equal((await shop.patch('/api/admin/users/user-admin/lock', { isLocked: true })).status, 404);
});

test('changing the password signs out the other devices', async () => {
  const { browser: laptop, email } = await newCustomer();
  const phone = new Browser();
  await phone.post('/api/auth/login', { email, password: 'mat-khau-thu' });

  assert.equal((await laptop.put('/api/auth/password', { currentPassword: 'sai', newPassword: 'mat-khau-moi' })).status, 400);
  assert.equal((await laptop.put('/api/auth/password', { currentPassword: 'mat-khau-thu', newPassword: '123' })).status, 400);
  assert.equal((await laptop.put('/api/auth/password', { currentPassword: 'mat-khau-thu', newPassword: 'mat-khau-moi' })).status, 200);

  assert.equal((await laptop.get('/api/orders')).status, 200, 'this device stays signed in');
  assert.equal((await phone.get('/api/orders')).status, 401);
  assert.equal((await new Browser().post('/api/auth/login', { email, password: 'mat-khau-thu' })).status, 401);
  assert.equal((await new Browser().post('/api/auth/login', { email, password: 'mat-khau-moi' })).status, 200);
});

test('the cart is saved with the account', async () => {
  const { browser, email } = await newCustomer();
  const saved = await browser.put('/api/cart', {
    lines: [
      { productId: 'prod-01', quantity: 1, selectedColor: 'Đen Titan Obsidian' },
      { productId: 'prod-01', quantity: 2, selectedColor: 'Đen Titan Obsidian' }, // merged
      { productId: 'khong-co', quantity: 1 }, // dropped
      { productId: 'prod-10', quantity: 0 }, // dropped
    ],
  });
  assert.deepEqual(saved.data.lines, [
    { productId: 'prod-01', quantity: 3, selectedColor: 'Đen Titan Obsidian' },
  ]);

  const otherDevice = new Browser();
  await otherDevice.post('/api/auth/login', { email, password: 'mat-khau-thu' });
  assert.equal((await otherDevice.get('/api/cart')).data.lines.length, 1);

  await order(browser, [{ productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' }]);
  assert.equal((await otherDevice.get('/api/cart')).data.lines.length, 0, 'emptied by the order');
});

test('administrators manage the products customers see', async () => {
  const shop = await admin();
  const input = {
    name: 'Đế sạc không dây AURA Pad',
    sku: 'aur-pad-01',
    category: 'Phụ kiện cao cấp',
    price: 890_000,
    originalPrice: 1_090_000,
    stock: 5,
    description: 'Đế sạc không dây chuẩn Qi2.',
    features: ['Sạc nhanh 15W'],
    specs: { 'Công suất': '15W' },
    variants: { colors: ['Đen', 'Trắng'] },
    images: ['https://example.com/pad.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA'],
  };

  assert.equal((await shop.post('/api/admin/products', { ...input, sku: 'AUR-HP-01' })).status, 409);
  assert.equal((await shop.post('/api/admin/products', { ...input, price: -5 })).status, 400);
  assert.equal((await shop.post('/api/admin/products', { ...input, originalPrice: 100 })).status, 400);
  assert.equal((await shop.post('/api/admin/products', { ...input, category: 'Không có' })).status, 400);

  const created = await shop.post('/api/admin/products', input);
  assert.equal(created.status, 201);
  const id = created.data.id;

  let shown = await product(id);
  assert.equal(shown.sku, 'AUR-PAD-01');
  assert.equal(shown.slug, 'de-sac-khong-day-aura-pad');
  assert.equal(shown.discount, 18);
  assert.deepEqual(shown.images, ['https://example.com/pad.jpg'], 'only real image addresses are kept');
  assert.deepEqual(shown.variants.colors, ['Đen', 'Trắng']);

  assert.equal((await shop.put(`/api/admin/products/${id}`, { ...input, price: 990_000, stock: 0 })).status, 200);
  shown = await product(id);
  assert.equal(shown.price, 990_000);
  assert.equal(shown.stock, 0);

  const { browser } = await newCustomer();
  assert.equal((await order(browser, [{ productId: id, quantity: 1, selectedColor: 'Đen' }])).status, 409);

  assert.equal((await shop.patch(`/api/admin/products/${id}/active`, { isActive: false })).status, 200);
  assert.equal(await product(id), undefined, 'hidden products leave the storefront');
  const overview = (await shop.get('/api/admin/overview')).data;
  assert.ok(overview.products.find((p: any) => p.id === id), 'but stay in the admin list');

  assert.equal((await shop.delete(`/api/admin/products/${id}`)).status, 200);
  assert.equal((await shop.delete(`/api/admin/products/${id}`)).status, 404);
});

test('deleting a product keeps the orders that contain it', async () => {
  const shop = await admin();
  const created = await shop.post('/api/admin/products', {
    name: 'Sản phẩm sẽ bị xóa',
    sku: 'AUR-DEL-01',
    category: 'Phụ kiện cao cấp',
    price: 250_000,
    stock: 3,
    description: 'Dùng để kiểm tra việc giữ lịch sử đơn hàng.',
  });
  const { browser } = await newCustomer();
  const placed = await order(browser, [{ productId: created.data.id, quantity: 2 }]);
  assert.equal(placed.status, 201);

  await shop.delete(`/api/admin/products/${created.data.id}`);

  const kept = (await browser.get('/api/orders')).data.orders[0];
  assert.equal(kept.items[0].product.name, 'Sản phẩm sẽ bị xóa');
  assert.equal(kept.items[0].product.price, 250_000);
  assert.equal(kept.totalAmount, 530_000);
});

test('administrators manage promotions', async () => {
  const shop = await admin();
  const input = {
    code: 'kiemthu5',
    title: 'Ưu đãi kiểm thử',
    type: 'percent',
    discountPercent: 5,
    minOrder: 0,
    maxUsage: 1,
    validUntil: '2030-12-31',
  };

  assert.equal((await shop.post('/api/admin/promotions', { ...input, discountPercent: 150 })).status, 400);
  assert.equal((await shop.post('/api/admin/promotions', { ...input, code: 'AURAXIN' })).status, 409);
  assert.equal((await shop.post('/api/admin/promotions', input)).status, 201);
  assert.equal((await promotion('KIEMTHU5')).discountPercent, 5);

  // A code with a single use can be used once
  const first = await newCustomer();
  const second = await newCustomer();
  const line = [{ productId: 'prod-10', quantity: 1, selectedColor: 'Xám Mờ Titan' }];
  assert.equal((await order(first.browser, line, { couponCode: 'KIEMTHU5' })).status, 201);
  assert.equal((await order(second.browser, line, { couponCode: 'KIEMTHU5' })).status, 409);

  assert.equal((await shop.put('/api/admin/promotions/KIEMTHU5', { ...input, maxUsage: 0 })).status, 400);
  assert.equal((await shop.patch('/api/admin/promotions/KIEMTHU5/active', { isActive: false })).status, 200);
  assert.equal(await promotion('KIEMTHU5'), undefined, 'paused codes are not offered');
  assert.equal((await shop.delete('/api/admin/promotions/KIEMTHU5')).status, 200);
});

test('contact messages and newsletter sign-ups reach the admin inbox', async () => {
  const visitor = new Browser();
  assert.equal((await visitor.post('/api/contact', { name: 'A', email: 'x', message: 'ngắn' })).status, 400);
  assert.equal(
    (await visitor.post('/api/contact', {
      name: 'Người Hỏi',
      email: 'hoi@example.com',
      message: 'Tôi cần tư vấn về bàn nâng hạ.',
    })).status,
    201
  );
  assert.equal((await visitor.post('/api/newsletter', { email: 'khong-hop-le' })).status, 400);
  assert.equal((await visitor.post('/api/newsletter', { email: 'BanTin@Example.com' })).status, 201);
  assert.equal((await visitor.post('/api/newsletter', { email: 'bantin@example.com' })).status, 409);

  const shop = await admin();
  const { messages, subscribers } = (await shop.get('/api/admin/overview')).data;
  const message = messages.find((m: any) => m.email === 'hoi@example.com');
  assert.equal(message.isRead, false);
  assert.ok(subscribers.find((s: any) => s.email === 'bantin@example.com'));

  assert.equal((await shop.patch(`/api/admin/messages/${message.id}/read`, { isRead: true })).status, 200);
  assert.equal((await shop.delete(`/api/admin/messages/${message.id}`)).status, 200);
  assert.equal((await shop.delete('/api/admin/subscribers/bantin@example.com')).status, 200);
});

test('only images can be uploaded, and only by administrators', async () => {
  const upload = async (browser: Browser, type: string, name: string) => {
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type }), name);
    const cookies = (browser as any).cookies as Map<string, string>;
    const response = await fetch(`${baseUrl}/api/admin/uploads`, {
      method: 'POST',
      headers: {
        'X-Aura-Client': 'web',
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
      },
      body: form,
    });
    return { status: response.status, data: (await response.json()) as any };
  };

  const shop = await admin();
  assert.equal((await upload(new Browser(), 'image/jpeg', 'a.jpg')).status, 401);
  assert.equal((await upload(shop, 'text/html', 'a.html')).status, 400);
  assert.equal((await upload(shop, 'application/x-msdownload', 'a.jpg.exe')).status, 400);

  const saved = await upload(shop, 'image/jpeg', '../../evil name.jpg');
  assert.equal(saved.status, 201);
  assert.match(saved.data.url, /^\/uploads\/img-[a-z0-9]+\.jpg$/, 'the server picks the file name');
  assert.equal((await fetch(baseUrl + saved.data.url)).status, 200);

  // Leave the uploads folder as it was found
  fs.rmSync(path.resolve(import.meta.dirname, '..', 'server', saved.data.url.slice(1)));
});

test('repeated wrong passwords are slowed down', async () => {
  const browser = new Browser();
  const attempt = () =>
    browser.post('/api/auth/login', { email: 'quan.tran@example.com', password: 'doan-mo' });

  for (let i = 0; i < 8; i++) assert.equal((await attempt()).status, 401);
  const blocked = await attempt();
  assert.equal(blocked.status, 429);

  // Even the right password has to wait, otherwise guessing would still pay off
  const right = await browser.post('/api/auth/login', {
    email: 'quan.tran@example.com',
    password: '123456',
  });
  assert.equal(right.status, 429);
});
