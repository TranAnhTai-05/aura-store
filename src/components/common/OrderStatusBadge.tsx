import React from 'react';
import { OrderStatus, PaymentStatus } from '../../types';
import { getOrderStatusBadge } from '../../utils/format';
import { PAYMENT_STATUS_LABELS } from '../../services/orders';

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const config = getOrderStatusBadge(status);
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border whitespace-nowrap ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
};

const PAYMENT_TONES: Record<PaymentStatus, { light: string; dark: string }> = {
  pending: { light: 'text-amber-700', dark: 'text-amber-400' },
  paid: { light: 'text-emerald-700', dark: 'text-emerald-400' },
  refunded: { light: 'text-zinc-600', dark: 'text-zinc-300' },
};

export const PaymentStatusText: React.FC<{ status: PaymentStatus; tone?: 'light' | 'dark' }> = ({
  status,
  tone = 'light',
}) => (
  <span className={`font-semibold ${PAYMENT_TONES[status][tone]}`}>
    {PAYMENT_STATUS_LABELS[status]}
  </span>
);
