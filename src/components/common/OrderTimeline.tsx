import React from 'react';
import { Order } from '../../types';
import { ORDER_FLOW, getOrderHistory } from '../../services/orders';
import { ORDER_STATUS_CONFIG, formatDate } from '../../utils/format';
import { Check, X } from 'lucide-react';

interface OrderTimelineProps {
  order: Order;
  tone?: 'light' | 'dark';
}

/** The fulfilment steps of an order with the time each one was reached */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order, tone = 'light' }) => {
  const dark = tone === 'dark';
  const history = getOrderHistory(order);
  const reachedAt = (status: string) => history.find((event) => event.status === status)?.at;

  const isCancelled = order.status === 'cancelled';
  const cancellation = history.find((event) => event.status === 'cancelled');
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  // A cancelled order shows the steps it completed, followed by the cancellation
  const steps = isCancelled
    ? ORDER_FLOW.filter((status) => status === 'pending' || reachedAt(status))
    : ORDER_FLOW;

  const muted = dark ? 'text-zinc-500' : 'text-zinc-400';
  const strong = dark ? 'text-white' : 'text-zinc-900';
  const line = dark ? 'bg-zinc-800' : 'bg-zinc-200';

  return (
    <ol className="space-y-0">
      {steps.map((status, index) => {
        const isDone = isCancelled || index <= currentIndex;
        const isCurrent = !isCancelled && index === currentIndex;
        const at = reachedAt(status);
        const isLast = index === steps.length - 1 && !isCancelled;

        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${isDone ? 'bg-emerald-500' : line}`} />}
            <span
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : dark
                  ? 'bg-zinc-800 border border-zinc-700'
                  : 'bg-white border-2 border-zinc-200'
              }`}
            >
              {isDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-sm ${isCurrent ? `font-bold ${strong}` : isDone ? `font-medium ${strong}` : muted}`}>
                {ORDER_STATUS_CONFIG[status].label}
              </p>
              {at && <p className={`text-xs tabular-nums ${muted}`}>{formatDate(at)}</p>}
            </div>
          </li>
        );
      })}

      {isCancelled && (
        <li className="relative flex gap-3">
          <span className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-rose-500 text-white">
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={`text-sm font-bold ${dark ? 'text-rose-400' : 'text-rose-700'}`}>Đã hủy</p>
            <p className={`text-xs tabular-nums ${muted}`}>
              {formatDate(cancellation?.at ?? order.updatedAt)}
              {cancellation?.note ? ` · ${cancellation.note}` : ''}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
};
