import type { PoolConnection, Pool } from 'mysql2/promise';
import { getPool, rows } from './pool';
import {
  CartItem,
  Category,
  ContactMessage,
  IllustrationType,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Promotion,
  PromotionType,
  Review,
  Subscriber,
  User,
} from '../../shared/types';
import { calcDiscountPercent } from '../../shared/pricing';

/** Rows as they come out of MySQL, and the functions that turn them into API objects */

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  role: 'customer' | 'admin';
  password_hash: string;
  is_locked: number;
  token_version: number;
  created_at: Date;
  orders_count?: number;
  total_spent?: number;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name: string;
  price: number;
  original_price: number | null;
  stock: number;
  description: string;
  specs: Record<string, string> | string;
  features: string[] | string;
  images: string[] | string;
  colors: string[] | string;
  capacities: string[] | string;
  illustration_type: IllustrationType;
  badge: string | null;
  is_featured: number;
  is_best_seller: number;
  is_new: number;
  is_active: number;
  created_at: Date;
  rating: number | null;
  reviews_count: number;
  sold_count: number;
};

type OrderRow = {
  id: number;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  coupon_code: string | null;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: Date | null;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
};

type OrderItemRow = {
  order_id: number;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  illustration_type: IllustrationType;
  image: string | null;
  unit_price: number;
  quantity: number;
  selected_color: string | null;
  selected_capacity: string | null;
};

type OrderEventRow = { order_id: number; status: OrderStatus; note: string | null; created_at: Date };

/** MariaDB hands JSON columns back as text, MySQL as parsed values */
function json<T>(value: T | string, fallback: T): T {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    district: r.district,
    role: r.role,
    createdAt: r.created_at.toISOString(),
    ordersCount: Number(r.orders_count ?? 0),
    totalSpent: Number(r.total_spent ?? 0),
    isLocked: !!r.is_locked,
  };
}

export function toProduct(r: ProductRow): Product {
  const colors = json<string[]>(r.colors, []);
  const capacities = json<string[]>(r.capacities, []);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    sku: r.sku,
    category: r.category_name,
    price: r.price,
    originalPrice: r.original_price ?? undefined,
    discount: calcDiscountPercent(r.price, r.original_price ?? undefined),
    rating: r.rating === null ? 0 : Math.round(Number(r.rating) * 10) / 10,
    reviewsCount: Number(r.reviews_count),
    soldCount: Number(r.sold_count),
    stock: r.stock,
    description: r.description,
    specs: json<Record<string, string>>(r.specs, {}),
    features: json<string[]>(r.features, []),
    images: json<string[]>(r.images, []),
    illustrationType: r.illustration_type,
    badge: r.badge ?? undefined,
    isFeatured: !!r.is_featured,
    isBestSeller: !!r.is_best_seller,
    isNew: !!r.is_new,
    variants:
      colors.length > 0 || capacities.length > 0
        ? {
            colors: colors.length > 0 ? colors : undefined,
            capacities: capacities.length > 0 ? capacities : undefined,
          }
        : undefined,
    createdAt: r.created_at.toISOString(),
    isActive: !!r.is_active,
  };
}

/**
 * Products with their figures. Rating, review count and units sold are computed
 * from the reviews and orders themselves, so they cannot drift.
 */
export const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name,
         COALESCE(r.reviews_count, 0) AS reviews_count,
         r.rating AS rating,
         COALESCE(s.sold_count, 0) AS sold_count
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT product_id, COUNT(*) AS reviews_count, AVG(rating) AS rating
    FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.quantity) AS sold_count
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled' AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
  ) s ON s.product_id = p.id`;

/** Customers with the number and value of their non-cancelled orders */
export const USER_SELECT = `
  SELECT u.*,
         COALESCE(o.orders_count, 0) AS orders_count,
         COALESCE(o.total_spent, 0) AS total_spent
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS orders_count, SUM(total_amount) AS total_spent
    FROM orders WHERE status <> 'cancelled' AND user_id IS NOT NULL
    GROUP BY user_id
  ) o ON o.user_id = u.id`;

export async function loadProducts(onlyActive: boolean): Promise<Product[]> {
  const found = await rows<ProductRow>(
    `${PRODUCT_SELECT} ${onlyActive ? 'WHERE p.is_active = 1' : ''} ORDER BY p.created_at DESC`
  );
  return found.map(toProduct);
}

export async function loadCategories(): Promise<Category[]> {
  const found = await rows<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    illustration_type: IllustrationType;
    item_count: number;
  }>(
    `SELECT c.*, COUNT(p.id) AS item_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     GROUP BY c.id ORDER BY c.sort_order, c.name`
  );
  return found.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    icon: r.icon,
    illustrationType: r.illustration_type,
    itemCount: Number(r.item_count),
  }));
}

export type PromotionRow = {
  code: string;
  title: string;
  type: PromotionType;
  discount_percent: number;
  max_discount: number | null;
  min_order: number;
  valid_until: string;
  usage_count: number;
  max_usage: number;
  is_active: number;
};

export function toPromotion(r: PromotionRow): Promotion {
  return {
    code: r.code,
    title: r.title,
    type: r.type,
    discountPercent: r.discount_percent,
    maxDiscount: r.max_discount ?? undefined,
    minOrder: r.min_order,
    validUntil: String(r.valid_until).slice(0, 10),
    usageCount: r.usage_count,
    maxUsage: r.max_usage,
    isActive: !!r.is_active,
  };
}

export async function loadPromotions(): Promise<Promotion[]> {
  return (await rows<PromotionRow>('SELECT * FROM promotions ORDER BY created_at DESC, code')).map(
    toPromotion
  );
}

export async function loadReviews(): Promise<Review[]> {
  const found = await rows<{
    id: string;
    product_id: string;
    user_id: string | null;
    user_name: string;
    rating: number;
    comment: string;
    verified_purchase: number;
    created_at: Date;
  }>('SELECT * FROM reviews ORDER BY created_at DESC');
  return found.map((r) => ({
    id: r.id,
    productId: r.product_id,
    userId: r.user_id ?? undefined,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    date: r.created_at.toISOString().slice(0, 10),
    verifiedPurchase: !!r.verified_purchase,
  }));
}

/** An order line as the storefront expects it: the purchase together with what was bought */
function toOrderItem(r: OrderItemRow): CartItem {
  return {
    productId: r.product_id ?? '',
    quantity: r.quantity,
    selectedColor: r.selected_color ?? undefined,
    selectedCapacity: r.selected_capacity ?? undefined,
    product: {
      id: r.product_id ?? '',
      name: r.product_name,
      slug: '',
      sku: r.product_sku,
      category: '',
      price: r.unit_price,
      rating: 0,
      reviewsCount: 0,
      stock: 0,
      description: '',
      specs: {},
      features: [],
      images: r.image ? [r.image] : [],
      illustrationType: r.illustration_type,
      createdAt: '',
      isActive: false,
    },
  };
}

/** Loads orders with their lines and history in three queries, however many orders there are */
export async function loadOrders(
  where = '',
  params: (string | number)[] = [],
  executor: Pool | PoolConnection = getPool()
): Promise<Order[]> {
  const orders = await rows<OrderRow>(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC, id DESC`,
    params,
    executor
  );
  if (orders.length === 0) return [];

  const ids = orders.map((o) => o.id);
  const marks = ids.map(() => '?').join(', ');
  const items = await rows<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id IN (${marks}) ORDER BY id`,
    ids,
    executor
  );
  const events = await rows<OrderEventRow>(
    `SELECT * FROM order_events WHERE order_id IN (${marks}) ORDER BY created_at, id`,
    ids,
    executor
  );

  const itemsByOrder = new Map<number, CartItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(toOrderItem(item));
    itemsByOrder.set(item.order_id, list);
  }
  const eventsByOrder = new Map<number, OrderEvent[]>();
  for (const event of events) {
    const list = eventsByOrder.get(event.order_id) ?? [];
    list.push({
      status: event.status,
      at: event.created_at.toISOString(),
      note: event.note ?? undefined,
    });
    eventsByOrder.set(event.order_id, list);
  }

  return orders.map((o) => ({
    id: String(o.id),
    orderNumber: o.order_number,
    customer: {
      name: o.customer_name,
      phone: o.customer_phone,
      email: o.customer_email,
      city: o.city,
      district: o.district,
      ward: o.ward,
      address: o.address,
      note: o.note ?? undefined,
    },
    items: itemsByOrder.get(o.id) ?? [],
    subtotal: Number(o.subtotal),
    shippingFee: o.shipping_fee,
    discountAmount: o.discount_amount,
    couponCode: o.coupon_code ?? undefined,
    totalAmount: Number(o.total_amount),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    paidAt: o.paid_at?.toISOString(),
    status: o.status,
    history: eventsByOrder.get(o.id) ?? [],
    userId: o.user_id ?? undefined,
    createdAt: o.created_at.toISOString(),
    updatedAt: o.updated_at.toISOString(),
  }));
}

export async function loadMessages(): Promise<ContactMessage[]> {
  const found = await rows<{
    id: string;
    name: string;
    email: string;
    message: string;
    is_read: number;
    created_at: Date;
  }>('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return found.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    isRead: !!r.is_read,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function loadSubscribers(): Promise<Subscriber[]> {
  const found = await rows<{ email: string; created_at: Date }>(
    'SELECT * FROM newsletter_subscribers ORDER BY created_at DESC'
  );
  return found.map((r) => ({ email: r.email, createdAt: r.created_at.toISOString() }));
}
