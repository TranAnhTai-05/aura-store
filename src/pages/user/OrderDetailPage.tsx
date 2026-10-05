import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Link, useRouter } from '../../router/RouterContext';
import { ProductImage } from '../../components/common/ProductImage';
import { OrderStatusBadge, PaymentStatusText } from '../../components/common/OrderStatusBadge';
import { OrderTimeline } from '../../components/common/OrderTimeline';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BankTransferDetails } from '../../components/user/BankTransferDetails';
import { NotFoundPage } from './NotFoundPage';
import { PAYMENT_METHOD_LABELS, canCustomerCancel } from '../../services/orders';
import { describeVariant } from '../../services/catalog';
import { formatVND, formatDate } from '../../utils/format';
import { SHOP } from '../../config/shop';
import { ArrowLeft, MapPin, CreditCard, RotateCcw, Printer } from 'lucide-react';

interface OrderDetailPageProps {
  orderNumber: string;
}

/** Rendered behind the customer guard; only finds orders that belong to the signed-in customer */
export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderNumber }) => {
  const { customerOrders, activeProducts, addToCart, cancelOrder } = useAppStore();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const order = customerOrders.find(
    (o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase() || o.id === orderNumber
  );

  if (!order) {
    return (
      <NotFoundPage
        title="Không tìm thấy đơn hàng"
        description="Đơn hàng này không tồn tại hoặc không thuộc tài khoản của bạn."
        homePath="/orders"
        homeLabel="Về danh sách đơn hàng"
      />
    );
  }

  const awaitingTransfer =
    order.paymentMethod === 'bank_transfer' &&
    order.paymentStatus === 'pending' &&
    order.status !== 'cancelled';

  const handleCancel = async () => {
    const result = await cancelOrder(order.id);
    if (result.ok) showToast(`Đã hủy đơn hàng ${order.orderNumber}`);
    else showToast(result.error, 'error');
    setIsCancelling(false);
  };

  const handleReorder = () => {
    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
      const result = addToCart(
        { id: item.productId },
        item.quantity,
        item.selectedColor,
        item.selectedCapacity
      );
      if (result.ok) added += result.added;
      else skipped += 1;
    }
    if (added === 0) {
      showToast('Các sản phẩm trong đơn này hiện đã hết hàng hoặc ngừng kinh doanh.', 'error');
      return;
    }
    showToast(
      skipped > 0
        ? `Đã thêm ${added} sản phẩm vào giỏ. ${skipped} sản phẩm không còn hàng.`
        : `Đã thêm ${added} sản phẩm vào giỏ hàng`,
      skipped > 0 ? 'info' : 'success'
    );
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" data-print-area>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 mb-4"
          data-print-hidden
        >
          <ArrowLeft className="w-4 h-4" />
          Đơn hàng của tôi
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display">
                Đơn hàng {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-zinc-500 mt-1">Đặt lúc {formatDate(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2" data-print-hidden>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              In đơn hàng
            </button>
            <button
              onClick={handleReorder}
              className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mua lại
            </button>
            {canCustomerCancel(order) && (
              <button
                onClick={() => setIsCancelling(true)}
                className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {awaitingTransfer && <BankTransferDetails order={order} />}

            <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 font-display mb-4">
                Sản phẩm ({order.items.length})
              </h2>
              <ul className="divide-y divide-zinc-100">
                {order.items.map((item, index) => {
                  const stillSold = activeProducts.some((p) => p.id === item.productId);
                  const variant = describeVariant(item);
                  return (
                    <li key={index} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0">
                          <ProductImage product={item.product} />
                        </div>
                        <div className="min-w-0">
                          {stillSold ? (
                            <Link
                              to={`/products/${item.productId}`}
                              className="text-sm font-semibold text-zinc-900 hover:underline line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-semibold text-zinc-900 line-clamp-2">
                              {item.product.name}
                            </p>
                          )}
                          {variant && <p className="text-xs text-zinc-500">{variant}</p>}
                          <p className="text-xs text-zinc-400 tabular-nums">
                            {formatVND(item.product.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums shrink-0">
                        {formatVND(item.product.price * item.quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-5 pt-5 border-t border-zinc-100 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <dt>Tạm tính</dt>
                  <dd className="tabular-nums font-medium text-zinc-900">{formatVND(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <dt>Phí vận chuyển</dt>
                  <dd className="tabular-nums font-medium text-zinc-900">
                    {order.shippingFee === 0 ? 'Miễn phí' : formatVND(order.shippingFee)}
                  </dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <dt>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                    <dd className="tabular-nums font-medium">-{formatVND(order.discountAmount)}</dd>
                  </div>
                )}
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1">
                  <dt className="font-bold text-zinc-950 whitespace-nowrap">Tổng thanh toán</dt>
                  <dd className="ml-auto text-xl font-extrabold text-zinc-950 tabular-nums font-display whitespace-nowrap">
                    {formatVND(order.totalAmount)}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3 font-sans">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  Địa chỉ nhận hàng
                </h2>
                <address className="not-italic text-sm text-zinc-600 space-y-1 leading-relaxed">
                  <p className="font-semibold text-zinc-900">{order.customer.name}</p>
                  <p className="tabular-nums">{order.customer.phone}</p>
                  {order.customer.email && <p className="break-all">{order.customer.email}</p>}
                  <p>
                    {[order.customer.address, order.customer.ward, order.customer.district, order.customer.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </address>
                {order.customer.note && (
                  <p className="mt-3 pt-3 border-t border-zinc-100 text-sm text-zinc-600">
                    <span className="text-zinc-400">Ghi chú:</span> {order.customer.note}
                  </p>
                )}
              </section>

              <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3 font-sans">
                  <CreditCard className="w-4 h-4 text-zinc-500" />
                  Thanh toán
                </h2>
                <dl className="text-sm space-y-2">
                  <div>
                    <dt className="text-xs text-zinc-400">Phương thức</dt>
                    <dd className="text-zinc-900 font-medium">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400">Trạng thái</dt>
                    <dd>
                      <PaymentStatusText status={order.paymentStatus} />
                      {order.paidAt && (
                        <span className="text-xs text-zinc-400"> · {formatDate(order.paidAt)}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 font-display mb-5">Tiến độ đơn hàng</h2>
              <OrderTimeline order={order} />
            </section>

            <section
              className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs text-sm text-zinc-600"
              data-print-hidden
            >
              <h2 className="text-sm font-bold text-zinc-900 mb-2 font-sans">Cần hỗ trợ?</h2>
              <p className="leading-relaxed">
                Gọi{' '}
                <a
                  href={`tel:${SHOP.hotline.replace(/\s/g, '')}`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  {SHOP.hotline}
                </a>{' '}
                hoặc{' '}
                <Link to="/contact" className="font-semibold text-zinc-900 hover:underline">
                  gửi tin nhắn
                </Link>{' '}
                kèm mã đơn {order.orderNumber}.
              </p>
            </section>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelling}
        title={`Hủy đơn hàng ${order.orderNumber}?`}
        message="Đơn hàng sẽ bị hủy và không thể khôi phục. Bạn có thể đặt lại bất cứ lúc nào."
        confirmLabel="Hủy đơn hàng"
        cancelLabel="Giữ đơn hàng"
        onConfirm={handleCancel}
        onCancel={() => setIsCancelling(false)}
      />
    </div>
  );
};
