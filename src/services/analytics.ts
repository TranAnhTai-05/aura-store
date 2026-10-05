import { Order, OrderStatus, Product } from '../types';
import { isCountedOrder } from './orders';

export type RevenueRange = '7d' | '30d' | '6m';

export const REVENUE_RANGES: { value: RevenueRange; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '6m', label: '6 tháng' },
];

export type RevenueBucket = {
  key: string;
  label: string;
  /** Spelled-out period for tooltips and screen readers */
  title: string;
  revenue: number;
  orders: number;
};

const pad = (value: number) => String(value).padStart(2, '0');
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Revenue of non-cancelled orders grouped per day or per month, oldest first, gaps included */
export function getRevenueSeries(orders: Order[], range: RevenueRange, now = new Date()): RevenueBucket[] {
  const buckets: RevenueBucket[] = [];
  const byMonth = range === '6m';

  if (byMonth) {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: monthKey(date),
        label: `T${date.getMonth() + 1}`,
        title: `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
        revenue: 0,
        orders: 0,
      });
    }
  } else {
    const days = range === '7d' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        key: dayKey(date),
        label: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`,
        title: `Ngày ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
        revenue: 0,
        orders: 0,
      });
    }
  }

  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const order of orders) {
    if (!isCountedOrder(order)) continue;
    const created = new Date(order.createdAt);
    const bucket = index.get(byMonth ? monthKey(created) : dayKey(created));
    if (!bucket) continue;
    bucket.revenue += order.totalAmount;
    bucket.orders += 1;
  }
  return buckets;
}

/** Revenue of the period of the same length that came right before the charted one */
export function getPreviousPeriodRevenue(orders: Order[], range: RevenueRange, now = new Date()): number {
  let start: Date;
  let end: Date;
  if (range === '6m') {
    end = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else {
    const days = range === '7d' ? 7 : 30;
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (2 * days - 1));
  }
  return orders
    .filter((order) => {
      if (!isCountedOrder(order)) return false;
      const created = new Date(order.createdAt).getTime();
      return created >= start.getTime() && created < end.getTime();
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);
}

export function getStatusCounts(orders: Order[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

export type ProductSales = {
  productId: string;
  name: string;
  /** The catalogue entry, when the product still exists */
  product?: Product;
  /** The copy kept by the most recent order, used when the product was deleted */
  snapshot: Product;
  quantity: number;
  revenue: number;
};

/** Best sellers by units sold in non-cancelled orders */
export function getTopProducts(orders: Order[], products: Product[], limit = 5): ProductSales[] {
  const sales = new Map<string, ProductSales>();
  for (const order of orders) {
    if (!isCountedOrder(order)) continue;
    for (const item of order.items) {
      const entry = sales.get(item.productId) ?? {
        productId: item.productId,
        name: item.product.name,
        product: products.find((p) => p.id === item.productId),
        snapshot: item.product,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue += item.product.price * item.quantity;
      sales.set(item.productId, entry);
    }
  }
  return [...sales.values()]
    .map((entry) => ({ ...entry, name: entry.product?.name ?? entry.name }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, limit);
}
