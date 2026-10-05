import { Order, OrderEvent, OrderStatus, PaymentMethod, PaymentStatus, User } from './types';

/** The fulfilment path of an order, in order. 'cancelled' sits outside of it. */
export const ORDER_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
];

/** An order only ever moves one step forward, or gets cancelled before it is delivered */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  credit_card: 'Thẻ ngân hàng',
};

export const PAYMENT_METHOD_SHORT_LABELS: Record<PaymentMethod, string> = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Hoàn tiền',
};

export function getNextStatuses(order: Order): OrderStatus[] {
  return TRANSITIONS[order.status] ?? [];
}

/** Returns why the order cannot move to `next`, or null when it can */
export function getTransitionError(order: Order, next: OrderStatus): string | null {
  if (order.status === next) return 'Đơn hàng đang ở trạng thái này.';
  if (order.status === 'delivered') return 'Đơn hàng đã giao, không thể thay đổi trạng thái.';
  if (order.status === 'cancelled') return 'Đơn hàng đã hủy, không thể thay đổi trạng thái.';
  if (!getNextStatuses(order).includes(next)) {
    return 'Không thể bỏ qua bước hoặc quay lại trạng thái trước.';
  }
  // Prepaid orders are only fulfilled once the money has arrived
  if (
    next !== 'cancelled' &&
    order.paymentMethod !== 'cod' &&
    order.paymentStatus !== 'paid'
  ) {
    return 'Cần xác nhận đã nhận thanh toán trước khi xử lý đơn chuyển khoản.';
  }
  return null;
}

/** Customers may withdraw an order until the warehouse starts preparing it */
export function canCustomerCancel(order: Order): boolean {
  return order.status === 'pending' || order.status === 'confirmed';
}

export function isOrderOwnedBy(order: Order, user: Pick<User, 'id' | 'email'>): boolean {
  if (order.userId) return order.userId === user.id;
  // Orders imported without an account are matched on the e-mail they were placed with
  return order.customer.email.toLowerCase() === user.email.toLowerCase();
}

/** Orders that count towards revenue, sales figures and customer spending */
export function isCountedOrder(order: Order): boolean {
  return order.status !== 'cancelled';
}

export function getOrderItemsCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** The recorded history, or the best reconstruction for orders that predate it */
export function getOrderHistory(order: Order): OrderEvent[] {
  if (order.history && order.history.length > 0) return order.history;
  const events: OrderEvent[] = [{ status: 'pending', at: order.createdAt }];
  if (order.status !== 'pending') events.push({ status: order.status, at: order.updatedAt });
  return events;
}

export function nextOrderNumber(orders: Order[]): string {
  const highest = orders.reduce((max, order) => {
    const value = Number.parseInt(order.orderNumber.replace(/\D/g, ''), 10);
    return Number.isFinite(value) && value > max ? value : max;
  }, 10000);
  return `AUR-${highest + 1}`;
}
