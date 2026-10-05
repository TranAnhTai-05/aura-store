import React, { useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../router/RouterContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductImage } from '../../components/common/ProductImage';
import { OrderStatusBadge, PaymentStatusText } from '../../components/common/OrderStatusBadge';
import { OrderTimeline } from '../../components/common/OrderTimeline';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_SHORT_LABELS,
  getNextStatuses,
  getTransitionError,
} from '../../services/orders';
import { describeVariant } from '../../services/catalog';
import { normalizeText } from '../../utils/validation';
import { ORDER_STATUS_CONFIG, formatDate, formatVND } from '../../utils/format';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { Search, Eye, Printer, ShoppingCart, ArrowRight, BadgeCheck } from 'lucide-react';

type SortKey = 'newest' | 'oldest' | 'total-desc' | 'total-asc';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
];

/** What the button that moves an order forward is called */
const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Xác nhận đơn',
  processing: 'Bắt đầu chuẩn bị',
  shipping: 'Giao cho vận chuyển',
  delivered: 'Đã giao thành công',
};

export const AdminOrdersPage: React.FC = () => {
  const { orders, updateOrderStatus, confirmPayment } = useAppStore();
  const { showToast } = useToast();
  const { queryParams, navigate } = useRouter();

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  // Status filter and the opened order live in the address bar so the dashboard can link to them
  const statusParam = queryParams.get('status');
  const statusFilter: 'all' | OrderStatus = STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : 'all';
  const selectedOrder = orders.find((o) => o.id === queryParams.get('order')) ?? null;

  const setQuery = (patch: { status?: string | null; order?: string | null }) => {
    const params = new URLSearchParams(queryParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    navigate(query ? `/admin/orders?${query}` : '/admin/orders', { replace: true, scroll: false });
  };

  const filteredOrders = useMemo(() => {
    const words = normalizeText(search).split(/\s+/).filter(Boolean);
    const matching = orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
      if (words.length === 0) return true;
      const haystack = normalizeText(
        [o.orderNumber, o.customer.name, o.customer.phone, o.customer.email].join(' ')
      );
      return words.every((word) => haystack.includes(word));
    });

    const byDate = (a: Order, b: Order) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return matching.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return -byDate(a, b);
        case 'total-desc':
          return b.totalAmount - a.totalAmount || byDate(a, b);
        case 'total-asc':
          return a.totalAmount - b.totalAmount || byDate(a, b);
        default:
          return byDate(a, b);
      }
    });
  }, [orders, statusFilter, paymentFilter, search, sort]);

  const moveOrder = async (order: Order, next: OrderStatus) => {
    const result = await updateOrderStatus(order.id, next);
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast(`Đơn ${order.orderNumber}: ${ORDER_STATUS_CONFIG[next].label.toLowerCase()}`);
  };

  const handleConfirmPayment = async (order: Order) => {
    const result = await confirmPayment(order.id);
    if (!result.ok) showToast(result.error, 'error');
    else showToast(`Đã ghi nhận thanh toán cho đơn ${order.orderNumber}`);
  };

  /** The forward step of an order, or why it cannot be taken yet */
  const getAdvance = (order: Order) => {
    const next = getNextStatuses(order).find((status) => status !== 'cancelled');
    if (!next) return null;
    return { next, label: ADVANCE_LABELS[next] ?? ORDER_STATUS_CONFIG[next].label, blockedBy: getTransitionError(order, next) };
  };

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || paymentFilter !== 'all';
  const selectClass =
    'px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-hidden focus:border-amber-400 cursor-pointer';

  const selectedAdvance = selectedOrder ? getAdvance(selectedOrder) : null;
  const canCancelSelected = !!selectedOrder && getNextStatuses(selectedOrder).includes('cancelled');
  const needsPayment =
    !!selectedOrder &&
    selectedOrder.paymentStatus === 'pending' &&
    selectedOrder.paymentMethod !== 'cod' &&
    selectedOrder.status !== 'cancelled';

  return (
    <AdminLayout title="Đơn Hàng">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Tìm đơn hàng"
              placeholder="Mã đơn, tên khách, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <select
            aria-label="Trạng thái đơn hàng"
            value={statusFilter}
            onChange={(e) => setQuery({ status: e.target.value === 'all' ? null : e.target.value })}
            className={selectClass}
          >
            <option value="all">Tất cả trạng thái ({orders.length})</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_CONFIG[status].label} ({orders.filter((o) => o.status === status).length})
              </option>
            ))}
          </select>

          <select
            aria-label="Trạng thái thanh toán"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
            className={selectClass}
          >
            <option value="all">Mọi thanh toán</option>
            <option value="pending">Chưa thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="refunded">Hoàn tiền</option>
          </select>

          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="total-desc">Giá trị cao nhất</option>
            <option value="total-asc">Giá trị thấp nhất</option>
          </select>
        </div>

        <p className="text-xs text-zinc-400">
          Hiển thị <strong className="text-white">{filteredOrders.length}</strong> trên {orders.length} đơn
          hàng
        </p>

        {filteredOrders.length === 0 ? (
          <EmptyState
            tone="dark"
            icon={<ShoppingCart className="w-7 h-7" />}
            title={hasFilters ? 'Không có đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
            description={
              hasFilters
                ? 'Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.'
                : 'Đơn hàng của khách sẽ xuất hiện tại đây.'
            }
            action={
              hasFilters ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setPaymentFilter('all');
                    setQuery({ status: null });
                  }}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px] bg-zinc-950/40">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Mã đơn</th>
                    <th className="py-3.5 px-4 font-semibold">Khách hàng</th>
                    <th className="py-3.5 px-4 font-semibold">Ngày đặt</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Tổng tiền</th>
                    <th className="py-3.5 px-4 font-semibold">Thanh toán</th>
                    <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {filteredOrders.map((order) => {
                    const advance = getAdvance(order);
                    return (
                      <tr key={order.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {order.orderNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{order.customer.name}</p>
                          <p className="text-xs text-zinc-500 tabular-nums">{order.customer.phone}</p>
                        </td>

                        <td className="py-3.5 px-4 tabular-nums text-zinc-400 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white tabular-nums text-right whitespace-nowrap">
                          {formatVND(order.totalAmount)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p>{PAYMENT_METHOD_SHORT_LABELS[order.paymentMethod]}</p>
                          <p className="text-xs">
                            <PaymentStatusText status={order.paymentStatus} tone="dark" />
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <OrderStatusBadge status={order.status} />
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {advance && !advance.blockedBy && (
                              <button
                                onClick={() => moveOrder(order, advance.next)}
                                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                              >
                                {advance.label}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {advance?.blockedBy && (
                              <button
                                onClick={() => handleConfirmPayment(order)}
                                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                              >
                                Xác nhận đã nhận tiền
                              </button>
                            )}
                            <button
                              onClick={() => setQuery({ order: order.id })}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              aria-label={`Xem chi tiết đơn ${order.orderNumber}`}
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setQuery({ order: null })}
        title={`Đơn hàng ${selectedOrder?.orderNumber ?? ''}`}
        description={selectedOrder ? `Đặt lúc ${formatDate(selectedOrder.createdAt)}` : undefined}
        size="lg"
        tone="dark"
        printable
        headerActions={
          <button
            onClick={() => window.print()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="In phiếu đơn hàng"
            title="In phiếu đơn hàng"
          >
            <Printer className="w-4 h-4" />
          </button>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <OrderStatusBadge status={selectedOrder.status} />
                <p className="text-sm text-zinc-400">
                  {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]} ·{' '}
                  <PaymentStatusText status={selectedOrder.paymentStatus} tone="dark" />
                </p>
              </div>

              {(selectedAdvance || canCancelSelected || needsPayment) && (
                <div className="flex flex-wrap items-center gap-2" data-print-hidden>
                  {needsPayment && (
                    <button
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      className="px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      Xác nhận đã nhận tiền
                    </button>
                  )}
                  {selectedAdvance && (
                    <button
                      onClick={() => moveOrder(selectedOrder, selectedAdvance.next)}
                      disabled={!!selectedAdvance.blockedBy}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      {selectedAdvance.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canCancelSelected && (
                    <button
                      onClick={() => setCancelTarget(selectedOrder)}
                      className="px-4 py-2.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              )}
              {selectedAdvance?.blockedBy && (
                <p className="text-xs text-amber-300" data-print-hidden>
                  {selectedAdvance.blockedBy}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm space-y-1.5">
                <p className="font-bold text-white mb-2">Người nhận</p>
                <p className="text-white font-semibold">{selectedOrder.customer.name}</p>
                <p className="text-zinc-300 tabular-nums">{selectedOrder.customer.phone}</p>
                {selectedOrder.customer.email && (
                  <p className="text-zinc-300 break-all">{selectedOrder.customer.email}</p>
                )}
                <p className="text-zinc-400 leading-relaxed">
                  {[
                    selectedOrder.customer.address,
                    selectedOrder.customer.ward,
                    selectedOrder.customer.district,
                    selectedOrder.customer.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {selectedOrder.customer.note && (
                  <p className="pt-2 text-amber-300">Ghi chú: {selectedOrder.customer.note}</p>
                )}
                <p className="pt-2 text-xs text-zinc-500">
                  {selectedOrder.userId ? 'Đặt bằng tài khoản thành viên' : 'Đơn không gắn tài khoản'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="font-bold text-white text-sm mb-4">Tiến độ</p>
                <OrderTimeline order={selectedOrder} tone="dark" />
              </div>
            </div>

            <div>
              <p className="font-bold text-sm text-white pb-2">
                Sản phẩm ({selectedOrder.items.length})
              </p>
              <ul className="divide-y divide-zinc-800">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 overflow-hidden shrink-0" data-print-hidden>
                        <ProductImage product={item.product} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {[item.product.sku, describeVariant(item)].filter(Boolean).join(' · ')}
                        </p>
                        <p className="text-xs text-zinc-400 tabular-nums">
                          {formatVND(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-white tabular-nums shrink-0">
                      {formatVND(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="border-t border-zinc-800 pt-3 space-y-1.5 text-sm text-zinc-400">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd className="tabular-nums font-semibold text-white">
                  {formatVND(selectedOrder.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Phí vận chuyển</dt>
                <dd className="tabular-nums font-semibold text-white">
                  {selectedOrder.shippingFee === 0 ? 'Miễn phí' : formatVND(selectedOrder.shippingFee)}
                </dd>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-rose-300">
                  <dt>Giảm giá{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</dt>
                  <dd className="tabular-nums font-bold">-{formatVND(selectedOrder.discountAmount)}</dd>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1 font-bold text-white">
                <dt>Tổng cộng</dt>
                <dd className="ml-auto text-lg text-amber-400 tabular-nums font-display whitespace-nowrap">
                  {formatVND(selectedOrder.totalAmount)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        tone="dark"
        isOpen={!!cancelTarget}
        title={`Hủy đơn ${cancelTarget?.orderNumber ?? ''}?`}
        message={
          <>
            Sản phẩm trong đơn sẽ được trả lại kho
            {cancelTarget?.paymentStatus === 'paid'
              ? ' và đơn được đánh dấu cần hoàn tiền cho khách'
              : ''}
            . Thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Hủy đơn hàng"
        onConfirm={() => {
          if (cancelTarget) moveOrder(cancelTarget, 'cancelled');
          setCancelTarget(null);
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </AdminLayout>
  );
};
