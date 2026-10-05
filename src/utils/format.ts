import { OrderStatus } from '../types';

export { formatVND } from '../../shared/money';

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** 12.500.000 → "12,5 tr" — for chart labels where the full amount does not fit */
export function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  pending: {
    label: 'Chờ xác nhận',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 1,
  },
  confirmed: {
    label: 'Đã xác nhận',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    step: 2,
  },
  processing: {
    label: 'Đang chuẩn bị',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    step: 3,
  },
  shipping: {
    label: 'Đang giao',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    step: 4,
  },
  delivered: {
    label: 'Đã giao',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    step: 5,
  },
  cancelled: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    step: 0,
  },
};

export function getOrderStatusBadge(status: OrderStatus) {
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
}
