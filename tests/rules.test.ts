/** The business rules shared by the storefront and the API. No database needed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from '../server/db/seedData';
import { DEFAULT_FILTERS, filterProducts, searchProducts } from '../src/services/catalog';
import { calcDiscountPercent, calcShippingFee, evaluateCoupon } from '../shared/pricing';
import { canCustomerCancel, getTransitionError } from '../shared/orders';
import { isValidEmail, isValidPhone, slugify } from '../shared/validation';
import {
  validateCustomerInfo,
  validateProductInput,
  validatePromotionInput,
} from '../shared/validators';
import { Order, OrderStatus } from '../shared/types';

const skus = (query: string) => searchProducts(INITIAL_PRODUCTS, query).map((p) => p.sku);
const [auraxin, freeship, viptech] = INITIAL_PROMOTIONS;
const now = new Date('2026-09-29T10:00:00');

test('search ignores diacritics and letter case', () => {
  assert.deepEqual(skus('den ban'), ['AUR-LP-03']);
  assert.deepEqual(skus('Đèn bàn'), ['AUR-LP-03']);
  assert.deepEqual(skus('aura studio'), ['AUR-HP-01']);
});

test('search finds products by SKU and by category', () => {
  assert.deepEqual(skus('AUR-KB-05'), ['AUR-KB-05']);
  assert.deepEqual(skus('aur-kb'), ['AUR-KB-05']);
  assert.deepEqual(skus('Âm thanh').sort(), ['AUR-HP-01', 'AUR-HP-09', 'AUR-SP-04']);
});

test('search does not match words buried in descriptions', () => {
  // "đến" appears in the headphones' description; it must not match "den"
  assert.deepEqual(skus('den'), ['AUR-LP-03']);
  assert.deepEqual(skus('áo'), []);
  assert.deepEqual(skus('   '), []);
});

test('filters combine and sorting is applied to the result', () => {
  const prices = filterProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    category: 'Âm thanh & Loa',
    price: '3m-8m',
    sort: 'price-asc',
  }).map((p) => p.price);
  assert.deepEqual(prices, [3790000, 7890000]);

  const inStock = filterProducts(
    INITIAL_PRODUCTS.map((p, i) => (i === 0 ? { ...p, stock: 0 } : p)),
    { ...DEFAULT_FILTERS, inStockOnly: true }
  );
  assert.equal(inStock.length, INITIAL_PRODUCTS.length - 1);
});

test('shipping is free from the threshold', () => {
  assert.equal(calcShippingFee(1_999_999), 30_000);
  assert.equal(calcShippingFee(2_000_000), 0);
  assert.equal(calcShippingFee(0), 0);
});

test('percentage coupons respect their cap', () => {
  assert.deepEqual(evaluateCoupon(auraxin, 7_890_000, 0, now), { valid: true, discount: 500_000 });
  assert.deepEqual(evaluateCoupon(auraxin, 1_590_000, 30_000, now), {
    valid: true,
    discount: 159_000,
  });
});

test('free-shipping coupons take off the shipping fee only', () => {
  assert.deepEqual(evaluateCoupon(freeship, 1_590_000, 30_000, now), {
    valid: true,
    discount: 30_000,
  });
  const alreadyFree = evaluateCoupon(freeship, 3_000_000, 0, now);
  assert.equal(alreadyFree.valid && alreadyFree.discount, 0);
});

test('coupons are refused when they do not apply', () => {
  assert.equal(evaluateCoupon(viptech, 7_890_000, 0, now).valid, false); // below minimum
  assert.equal(evaluateCoupon(auraxin, 7_890_000, 0, new Date('2027-01-01T00:00:01')).valid, false);
  assert.equal(evaluateCoupon(auraxin, 7_890_000, 0, new Date('2026-12-31T23:00:00')).valid, true);
  assert.equal(evaluateCoupon({ ...auraxin, usageCount: 1000 }, 7_890_000, 0, now).valid, false);
  assert.equal(evaluateCoupon({ ...auraxin, isActive: false }, 7_890_000, 0, now).valid, false);
});

test('discount percentage comes from the two prices', () => {
  assert.equal(calcDiscountPercent(7_890_000, 8_990_000), 12);
  assert.equal(calcDiscountPercent(1000, 1000), undefined);
  assert.equal(calcDiscountPercent(1000, undefined), undefined);
});

const order = (status: OrderStatus, extra: Partial<Order> = {}): Order => ({
  ...INITIAL_ORDERS[1],
  status,
  ...extra,
});
const allowed = (from: OrderStatus, to: OrderStatus, extra?: Partial<Order>) =>
  getTransitionError(order(from, extra), to) === null;

test('orders move forward one step at a time', () => {
  assert.equal(allowed('pending', 'confirmed'), true);
  assert.equal(allowed('confirmed', 'processing'), true);
  assert.equal(allowed('processing', 'shipping'), true);
  assert.equal(allowed('shipping', 'delivered'), true);
  assert.equal(allowed('pending', 'shipping'), false);
  assert.equal(allowed('pending', 'delivered'), false);
});

test('orders never move backwards and finished orders are final', () => {
  assert.equal(allowed('shipping', 'processing'), false);
  assert.equal(allowed('delivered', 'pending'), false);
  assert.equal(allowed('delivered', 'cancelled'), false);
  assert.equal(allowed('cancelled', 'pending'), false);
});

test('prepaid orders wait for their payment', () => {
  const unpaid = { paymentMethod: 'bank_transfer', paymentStatus: 'pending' } as const;
  const paid = { paymentMethod: 'bank_transfer', paymentStatus: 'paid' } as const;
  assert.equal(allowed('pending', 'confirmed', unpaid), false);
  assert.equal(allowed('pending', 'confirmed', paid), true);
  assert.equal(allowed('pending', 'cancelled', unpaid), true);
});

test('customers can cancel until the order is being prepared', () => {
  assert.equal(canCustomerCancel(order('pending')), true);
  assert.equal(canCustomerCancel(order('confirmed')), true);
  assert.equal(canCustomerCancel(order('processing')), false);
  assert.equal(canCustomerCancel(order('shipping')), false);
});

test('phone numbers and emails are validated', () => {
  assert.deepEqual(['0901234567', '090 123 4567', '+84901234567'].map(isValidPhone), [
    true,
    true,
    true,
  ]);
  assert.deepEqual(['11111111111', '0123456789', '09012345', 'abc', ''].map(isValidPhone), [
    false,
    false,
    false,
    false,
    false,
  ]);
  assert.deepEqual(['a@b.vn', 'a@b', 'a b@c.vn', ''].map(isValidEmail), [true, false, false, false]);
});

test('slugs are plain ASCII', () => {
  assert.equal(slugify('Đế sạc không dây AURA Pad Qi2'), 'de-sac-khong-day-aura-pad-qi2');
});

test('the checkout form reports every missing field', () => {
  const errors = validateCustomerInfo({
    name: '',
    phone: '11111111111',
    email: 'x',
    city: '',
    district: '',
    ward: '',
    address: '',
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    'address',
    'city',
    'district',
    'email',
    'name',
    'phone',
    'ward',
  ]);
});

test('product and promotion forms reject impossible values', () => {
  const product = {
    ...INITIAL_PRODUCTS[0],
    images: [],
  };
  assert.equal(validateProductInput(product), null);
  assert.match(validateProductInput({ ...product, price: 0 })!, /Giá bán/);
  assert.match(validateProductInput({ ...product, stock: Number.NaN })!, /Tồn kho/);
  assert.match(validateProductInput({ ...product, stock: -1 })!, /Tồn kho/);
  assert.match(validateProductInput({ ...product, originalPrice: 1 })!, /Giá gốc/);

  const promo = { ...auraxin, type: 'percent' as const };
  assert.equal(validatePromotionInput(promo), null);
  assert.match(validatePromotionInput({ ...promo, code: 'ab' })!, /Mã khuyến mãi/);
  assert.match(validatePromotionInput({ ...promo, discountPercent: 150 })!, /Mức giảm/);
  assert.match(validatePromotionInput({ ...promo, validUntil: '31/12/2026' })!, /ngày hết hạn/);
});
