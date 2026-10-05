import React from 'react';
import { useToast } from '../../context/ToastContext';
import { SHOP } from '../../config/shop';
import { Order } from '../../types';
import { formatVND } from '../../utils/format';
import { Landmark, Copy } from 'lucide-react';

interface BankTransferDetailsProps {
  order: Pick<Order, 'orderNumber' | 'totalAmount'>;
}

/** What the customer needs to pay an order by bank transfer */
export const BankTransferDetails: React.FC<BankTransferDetailsProps> = ({ order }) => {
  const { showToast } = useToast();

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Đã sao chép ${label}`);
    } catch {
      showToast('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.', 'error');
    }
  };

  const rows = [
    { label: 'Ngân hàng', value: SHOP.bank.name },
    {
      label: 'Số tài khoản',
      value: SHOP.bank.accountNumber,
      copyValue: SHOP.bank.accountNumber.replace(/\s/g, ''),
      copyLabel: 'số tài khoản',
    },
    { label: 'Chủ tài khoản', value: SHOP.bank.accountHolder },
    {
      label: 'Số tiền',
      value: formatVND(order.totalAmount),
      copyValue: String(order.totalAmount),
      copyLabel: 'số tiền',
    },
    {
      label: 'Nội dung',
      value: order.orderNumber,
      copyValue: order.orderNumber,
      copyLabel: 'nội dung chuyển khoản',
    },
  ];

  return (
    <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
      <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm pb-3 border-b border-zinc-100">
        <Landmark className="w-4 h-4 text-zinc-700" />
        <span>Thông tin chuyển khoản</span>
      </div>
      <dl className="pt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500 shrink-0">{row.label}</dt>
            <dd className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-zinc-900 text-right truncate tabular-nums">
                {row.value}
              </span>
              {row.copyValue && (
                <button
                  type="button"
                  onClick={() => copy(row.copyLabel, row.copyValue)}
                  aria-label={`Sao chép ${row.copyLabel}`}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500 leading-relaxed">
        Vui lòng ghi đúng nội dung chuyển khoản. Đơn hàng được xử lý sau khi AURA xác nhận đã nhận
        thanh toán.
      </p>
    </div>
  );
};
