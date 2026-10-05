import {
  CartItem,
  Category,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Promotion,
  Review,
  User,
} from '../../shared/types';
import { calcShippingFee, evaluateCoupon } from '../../shared/pricing';
import { getOrderHistory } from '../../shared/orders';
import { SAMPLE_IMAGES } from '../../shared/sampleImages';
import {
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_REVIEWS,
  INITIAL_USERS,
} from './seedData';
import { CatalogProduct, EXTRA_PRODUCTS, ProductKind } from './seedCatalog';
import {
  CUSTOMER_WARDS,
  EXTRA_CUSTOMERS,
  GENERAL_COMMENTS,
  KIND_REMARKS,
  REVIEWER_NAMES,
} from './seedPeople';

/**
 * Builds the sample shop: the hand-written catalogue plus orders and reviews generated
 * around it. The generator is seeded, so every run produces the same shop.
 *
 * Dates are written relative to a reference day and moved forward to today when the
 * database is filled, so "the last 7 days" is never empty however late that happens.
 */

export type Seed = {
  users: User[];
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  orders: Order[];
  reviews: Review[];
  /** The numbers the hand-written orders had before all orders were numbered by date */
  renumbered: Record<string, string>;
};

const REFERENCE = Date.parse('2026-09-29T00:00:00Z');
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const GENERATED_ORDERS = 64;
const ORDER_HISTORY_DAYS = 118;
const FIRST_ORDER_NUMBER = 9701;

/** Small seeded generator (mulberry32): the same sequence on every run */
function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    chance: (probability: number) => next() < probability,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    /** Removes and returns a random element, so that it is not picked twice */
    take: <T>(items: T[]): T => items.splice(Math.floor(next() * items.length), 1)[0],
  };
}

type Random = ReturnType<typeof createRandom>;

function toProduct(item: CatalogProduct): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    category: item.category,
    price: item.price,
    originalPrice: item.originalPrice,
    rating: 0,
    reviewsCount: 0,
    stock: item.stock,
    description: item.description,
    specs: item.specs,
    features: item.features,
    images: [],
    illustrationType: item.illustrationType,
    badge: item.badge,
    isFeatured: item.isFeatured,
    isBestSeller: item.isBestSeller,
    isNew: item.isNew,
    variants:
      item.colors || item.capacities
        ? { colors: item.colors, capacities: item.capacities }
        : undefined,
    createdAt: item.createdAt,
    isActive: true,
  };
}

const withPhotos = (product: Product): Product => ({
  ...product,
  images: (SAMPLE_IMAGES[product.id] ?? []).map((image) => image.url),
});

/** The copy of a product that an order line keeps */
const snapshot = (product: Product): Product => ({ ...product, images: product.images.slice(0, 1) });

function pickWeighted(random: Random, products: Product[], exclude: Set<string>): Product {
  const pool = products.filter((p) => !exclude.has(p.id));
  const weight = (p: Product) => (p.isBestSeller ? 3 : p.isFeatured ? 2 : 1);
  let target = random.next() * pool.reduce((sum, p) => sum + weight(p), 0);
  for (const product of pool) {
    target -= weight(product);
    if (target <= 0) return product;
  }
  return pool[pool.length - 1];
}

function pickStatus(random: Random, ageDays: number): OrderStatus {
  const roll = random.next();
  if (ageDays >= 6) return roll < 0.08 ? 'cancelled' : 'delivered';
  if (ageDays >= 3) return roll < 0.1 ? 'cancelled' : roll < 0.55 ? 'delivered' : 'shipping';
  if (ageDays >= 1) return roll < 0.3 ? 'shipping' : roll < 0.65 ? 'processing' : 'confirmed';
  return roll < 0.6 ? 'pending' : 'confirmed';
}

/** How long after the order each step usually happens */
const STEP_DELAYS: [OrderStatus, number, number][] = [
  ['confirmed', 1 * HOUR, 5 * HOUR],
  ['processing', 6 * HOUR, 20 * HOUR],
  ['shipping', 1 * DAY, 2 * DAY],
  ['delivered', 2.5 * DAY, 4.5 * DAY],
];

function buildHistory(random: Random, createdAt: number, status: OrderStatus): OrderEvent[] {
  const events: OrderEvent[] = [{ status: 'pending', at: new Date(createdAt).toISOString() }];
  const latest = REFERENCE - 10 * MINUTE;

  if (status === 'cancelled') {
    const byCustomer = random.chance(0.6);
    let at = createdAt;
    if (!byCustomer) {
      at = Math.min(createdAt + random.between(1, 5) * HOUR, latest - HOUR);
      events.push({ status: 'confirmed', at: new Date(at).toISOString() });
    }
    at = Math.min(at + random.between(1, 18) * HOUR, latest);
    events.push({
      status: 'cancelled',
      at: new Date(at).toISOString(),
      note: byCustomer ? 'Khách hàng hủy đơn' : 'Cửa hàng hủy đơn',
    });
    return events;
  }

  const steps = STEP_DELAYS.slice(0, STEP_DELAYS.findIndex(([step]) => step === status) + 1);
  const room = latest - createdAt;
  steps.forEach(([step, min, max], index) => {
    // A recent order cannot have taken longer than the time that has passed
    const usual = random.between(min, max);
    const at = createdAt + Math.min(usual, (room * (index + 1)) / (steps.length + 1));
    events.push({ status: step, at: new Date(at).toISOString() });
  });
  return events;
}

function generateOrders(
  random: Random,
  customers: User[],
  products: Product[],
  promotions: Promotion[]
): Order[] {
  const sellable = products.filter((p) => p.isActive && p.stock > 0);
  const orders: Order[] = [];

  for (let i = 0; i < GENERATED_ORDERS; i++) {
    // Squaring the roll puts more orders in the recent weeks than in the early ones
    const ageDays = Math.floor(ORDER_HISTORY_DAYS * Math.pow(random.next(), 1.8));
    // Between 8:00 and 22:00 Vietnam time
    const minuteOfDay = random.int(1 * 60, 15 * 60);
    const createdAt = Math.min(
      REFERENCE - (ageDays + 1) * DAY + minuteOfDay * MINUTE,
      REFERENCE - 2 * HOUR
    );

    const customer = random.pick(customers);
    const lineCount = 1 + Number(random.chance(0.35)) + Number(random.chance(0.1));
    const chosen = new Set<string>();
    const items: CartItem[] = [];
    for (let line = 0; line < lineCount; line++) {
      const product = pickWeighted(random, sellable, chosen);
      chosen.add(product.id);
      items.push({
        productId: product.id,
        product: snapshot(product),
        quantity: product.price < 1_500_000 && random.chance(0.3) ? 2 : 1,
        selectedColor: product.variants?.colors ? random.pick(product.variants.colors) : undefined,
        selectedCapacity: product.variants?.capacities
          ? random.pick(product.variants.capacities)
          : undefined,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingFee = calcShippingFee(subtotal);

    let discountAmount = 0;
    let couponCode: string | undefined;
    if (random.chance(0.3)) {
      const code =
        subtotal >= 8_000_000 ? 'VIPTECH' : subtotal >= 1_000_000 ? 'AURAXIN' : 'FREESHIP';
      const promo = promotions.find((p) => p.code === code);
      const evaluation = promo && evaluateCoupon(promo, subtotal, shippingFee, new Date(createdAt));
      if (evaluation?.valid && evaluation.discount > 0) {
        discountAmount = evaluation.discount;
        couponCode = code;
      }
    }

    const status = pickStatus(random, ageDays);
    const history = buildHistory(random, createdAt, status);
    const lastEvent = history[history.length - 1];
    const paymentMethod: PaymentMethod = random.chance(0.6) ? 'cod' : 'bank_transfer';

    let paymentStatus: PaymentStatus = 'pending';
    let paidAt: string | undefined;
    if (paymentMethod === 'cod') {
      if (status === 'delivered') {
        paymentStatus = 'paid';
        paidAt = lastEvent.at;
      }
    } else {
      // A transfer order is only processed once it is paid
      const wasPaid =
        status === 'pending' ? random.chance(0.3) : status === 'cancelled' ? random.chance(0.5) : true;
      if (wasPaid) {
        paymentStatus = status === 'cancelled' ? 'refunded' : 'paid';
        paidAt = new Date(
          Math.min(createdAt + random.between(15, 50) * MINUTE, Date.parse(history[1]?.at ?? lastEvent.at))
        ).toISOString();
      }
    }

    orders.push({
      id: '',
      orderNumber: '',
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        district: customer.district,
        ward: CUSTOMER_WARDS[customer.id] ?? '',
        address: customer.address,
      },
      items,
      subtotal,
      shippingFee,
      discountAmount,
      couponCode,
      totalAmount: Math.max(0, subtotal + shippingFee - discountAmount),
      paymentMethod,
      paymentStatus,
      paidAt,
      status,
      history,
      userId: customer.id,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: lastEvent.at,
    });
  }
  return orders;
}

function writeComment(random: Random, stars: number, noun: string, kind: ProductKind, used: Set<string>) {
  const level = Math.max(2, Math.min(5, stars)) as 2 | 3 | 4 | 5;
  const general = GENERAL_COMMENTS[level].filter((text) => !used.has(text));
  const base = random.pick(general.length > 0 ? general : GENERAL_COMMENTS[level]);
  used.add(base);

  const remarks = stars >= 4 ? KIND_REMARKS[kind].praise : KIND_REMARKS[kind].complaint;
  const remark = random.chance(0.7) ? ` ${random.pick(remarks)}` : '';
  const capitalised = noun.charAt(0).toUpperCase() + noun.slice(1);
  return base.replace(/\{Noun\}/g, capitalised).replace(/\{noun\}/g, noun) + remark;
}

function generateReviews(random: Random, orders: Order[], users: User[]): Review[] {
  const reviews: Review[] = [];
  const latest = REFERENCE - HOUR;

  for (const product of EXTRA_PRODUCTS) {
    // Customers who received the product review it first, and are marked as buyers
    const buyers = new Map<string, number>();
    for (const order of orders) {
      if (order.status !== 'delivered' || !order.userId) continue;
      if (!order.items.some((item) => item.productId === product.id)) continue;
      if (!buyers.has(order.userId)) buyers.set(order.userId, Date.parse(order.updatedAt));
    }
    const buyerIds = [...buyers.keys()];
    const names = [...REVIEWER_NAMES];
    const used = new Set<string>();

    product.ratings.forEach((stars, index) => {
      const buyerId = buyerIds[index];
      const buyer = buyerId ? users.find((u) => u.id === buyerId) : undefined;
      const earliest = buyer
        ? buyers.get(buyer.id)! + DAY
        : Date.parse(product.createdAt) + 7 * DAY;
      const at = Math.min(earliest + random.between(0, buyer ? 9 : 60) * DAY, latest);

      reviews.push({
        id: `rev-${product.id.slice(5)}-${index + 1}`,
        productId: product.id,
        userId: buyer?.id,
        userName: buyer?.name ?? random.take(names),
        rating: stars,
        comment: writeComment(random, stars, product.noun, product.kind, used),
        date: new Date(at).toISOString(),
        verifiedPurchase: !!buyer,
      });
    });
  }
  return reviews;
}

export function buildSeed(now: Date = new Date()): Seed {
  // Whole days, so that the time of day of every event stays as written
  const shift = Math.max(0, Math.floor((now.getTime() - REFERENCE) / DAY)) * DAY;
  const moved = (iso: string) => new Date(Date.parse(iso) + shift).toISOString();

  const random = createRandom(20260929);
  const users = [...INITIAL_USERS, ...EXTRA_CUSTOMERS];
  const customers = users.filter((u) => u.role === 'customer');
  const products = [...INITIAL_PRODUCTS, ...EXTRA_PRODUCTS.map(toProduct)].map(withPhotos);
  const byId = new Map(products.map((p) => [p.id, p]));

  // The first orders were written by hand; they get the same treatment as generated ones
  const written: Order[] = INITIAL_ORDERS.map((order) => ({
    ...order,
    userId:
      order.userId ?? customers.find((c) => c.email === order.customer.email)?.id ?? undefined,
    items: order.items.map((item) => ({
      ...item,
      product: snapshot(byId.get(item.productId) ?? item.product),
    })),
    history: getOrderHistory(order),
    paidAt: order.paymentStatus === 'paid' ? order.updatedAt : undefined,
  }));

  const generated = generateOrders(random, customers, products, INITIAL_PROMOTIONS);

  // Everything below is still dated relative to the reference day
  const placed = [...written, ...generated].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const datedReviews = [
    ...INITIAL_REVIEWS.map((review) => ({ ...review, date: `${review.date}T09:00:00Z` })),
    ...generateReviews(random, placed, users),
  ];

  const orders = placed.map((order, index) => ({
    ...order,
    id: String(index + 1),
    orderNumber: `AUR-${FIRST_ORDER_NUMBER + index}`,
    createdAt: moved(order.createdAt),
    updatedAt: moved(order.updatedAt),
    paidAt: order.paidAt ? moved(order.paidAt) : undefined,
    history: order.history?.map((event) => ({ ...event, at: moved(event.at) })),
  }));
  const renumbered: Record<string, string> = {};
  placed.forEach((order, index) => {
    if (order.orderNumber) renumbered[order.orderNumber] = orders[index].orderNumber;
  });
  const reviews = datedReviews.map((review) => ({ ...review, date: moved(review.date) }));

  // A cancelled order gives its coupon use back, so only the others count
  const promotions = INITIAL_PROMOTIONS.map((promo) => ({
    ...promo,
    usageCount:
      promo.usageCount +
      generated.filter((o) => o.couponCode === promo.code && o.status !== 'cancelled').length,
  }));

  return {
    users,
    categories: INITIAL_CATEGORIES,
    products,
    promotions,
    orders,
    reviews,
    renumbered,
  };
}
