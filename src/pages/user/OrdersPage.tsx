import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Link } from '../../router/RouterContext';
import { ProductImage } from '../../components/common/ProductImage';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { canCustomerCancel, getOrderItemsCount } from '../../services/orders';
import { describeVariant } from '../../services/catalog';
import { formatVND, formatDate, ORDER_STATUS_CONFIG } from '../../utils/format';
import { Order, OrderStatus } from '../../types';
import { Package, ArrowRight } from 'lucide-react';

type StatusFilter = 'all' | OrderStatus;

const STATUS_TABS: StatusFilter[] = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
];

const PREVIEW_ITEMS = 2;

/** Rendered behind the customer guard: only the signed-in customer's own orders are listed */
export const OrdersPage: React.FC = () => {
  const { customerOrders, cancelOrder } = useAppStore();
  const { showToast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const filteredOrders =
    selectedStatus === 'all'
      ? customerOrders
      : customerOrders.filter((o) => o.status === selectedStatus);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const result = await cancelOrder(cancelTarget.id);
    if (result.ok) showToast(`Đã hủy đơn hàng ${cancelTarget.orderNumber}`);
    else showToast(result.error, 'error');
    setCancelTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-zinc-400 mb-3" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-zinc-700">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <Link to="/profile" className="hover:text-zinc-700">Tài khoản</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900 font-medium">Đơn hàng</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi trạng thái và xem chi tiết các đơn hàng bạn đã đặt.
          </p>
        </div>

        {customerOrders.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="Bạn chưa có đơn hàng nào"
            description="Khi bạn đặt hàng, đơn sẽ xuất hiện tại đây để bạn theo dõi."
            action={
              <Link
                to="/products"
                className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Bắt đầu mua sắm
              </Link>
            }
          />
        ) : (
          <>
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 border-b border-zinc-200 -mx-4 px-4 sm:mx-0 sm:px-0"
              role="tablist"
              aria-label="Lọc theo trạng thái"
            >
              {STATUS_TABS.map((status) => {
                const count =
                  status === 'all'
                    ? customerOrders.length
                    : customerOrders.filter((o) => o.status === status).length;
                const isActive = selectedStatus === status;
                return (
                  <button
                    key={status}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                    }`}
                  >
                    <span>{status === 'all' ? 'Tất cả' : ORDER_STATUS_CONFIG[status].label}</span>
                    <span
                      className={`text-[11px] px-1.5 rounded-full tabular-nums ${
                        isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                icon={<Package className="w-7 h-7" />}
                title="Không có đơn hàng ở trạng thái này"
                action={
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Xem tất cả đơn hàng
                  </button>
                }
              />
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map((order) => {
                  const hidden = order.items.length - PREVIEW_ITEMS;
                  return (
                    <li
                      key={order.id}
                      className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/orders/${order.orderNumber}`}
                            className="font-mono text-sm font-bold text-zinc-900 hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          <span aria-hidden="true" className="text-zinc-300">·</span>
                          <time className="text-xs text-zinc-500" dateTime={order.createdAt}>
                            {formatDate(order.createdAt)}
                          </time>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <div className="py-4 space-y-3">
                        {order.items.slice(0, PREVIEW_ITEMS).map((item, index) => (
                          <div key={index} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0">
                                <ProductImage product={item.product} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 truncate">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-zinc-400 truncate">
                                  {[describeVariant(item), `SL: ${item.quantity}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-zinc-900 tabular-nums shrink-0">
                              {formatVND(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {hidden > 0 && (
                          <p className="text-xs text-zinc-500">và {hidden} sản phẩm khác</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-zinc-500">
                          {getOrderItemsCount(order)} sản phẩm · Tổng tiền{' '}
                          <span className="text-base font-extrabold text-zinc-950 tabular-nums">
                            {formatVND(order.totalAmount)}
                          </span>
                        </p>

                        <div className="flex items-center gap-2">
                          {canCustomerCancel(order) && (
                            <button
                              onClick={() => setCancelTarget(order)}
                              className="px-3.5 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                            >
                              Hủy đơn
                            </button>
                          )}
                          <Link
                            to={`/orders/${order.orderNumber}`}
                            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <span>Xem chi tiết</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title={`Hủy đơn hàng ${cancelTarget?.orderNumber ?? ''}?`}
        message="Đơn hàng sẽ bị hủy và không thể khôi phục. Bạn có thể đặt lại bất cứ lúc nào."
        confirmLabel="Hủy đơn hàng"
        cancelLabel="Giữ đơn hàng"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};
