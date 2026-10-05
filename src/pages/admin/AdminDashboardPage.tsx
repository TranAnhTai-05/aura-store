import React, { useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { ProductImage } from '../../components/common/ProductImage';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from '../../router/RouterContext';
import {
  REVENUE_RANGES,
  RevenueRange,
  getPreviousPeriodRevenue,
  getRevenueSeries,
  getStatusCounts,
  getTopProducts,
} from '../../services/analytics';
import { PAYMENT_METHOD_SHORT_LABELS, isCountedOrder } from '../../services/orders';
import {
  ORDER_STATUS_CONFIG,
  formatCompactVND,
  formatDate,
  formatVND,
} from '../../utils/format';
import { SHOP } from '../../config/shop';
import { OrderStatus } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

const STATUS_BAR_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  processing: 'bg-indigo-400',
  shipping: 'bg-purple-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
};

const card = 'bg-zinc-900 border border-zinc-800 rounded-3xl';

export const AdminDashboardPage: React.FC = () => {
  const { products, orders, users } = useAppStore();
  const [range, setRange] = useState<RevenueRange>('30d');

  const stats = useMemo(() => {
    const counted = orders.filter(isCountedOrder);
    const customers = users.filter((u) => u.role === 'customer');
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return {
      revenue: counted.reduce((sum, o) => sum + o.totalAmount, 0),
      collected: counted
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      orders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      products: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      customers: customers.length,
      newCustomers: customers.filter((u) => new Date(u.createdAt) >= monthStart).length,
    };
  }, [orders, products, users]);

  const series = useMemo(() => getRevenueSeries(orders, range), [orders, range]);
  const periodRevenue = series.reduce((sum, bucket) => sum + bucket.revenue, 0);
  const periodOrders = series.reduce((sum, bucket) => sum + bucket.orders, 0);
  const previousRevenue = useMemo(() => getPreviousPeriodRevenue(orders, range), [orders, range]);
  const change =
    previousRevenue > 0 ? ((periodRevenue - previousRevenue) / previousRevenue) * 100 : null;
  const peak = Math.max(...series.map((bucket) => bucket.revenue), 0);
  const labelEvery = series.length > 12 ? 5 : 1;

  const statusCounts = useMemo(() => getStatusCounts(orders), [orders]);
  const topProducts = useMemo(() => getTopProducts(orders, products), [orders, products]);
  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.isActive && p.stock <= SHOP.lowStockThreshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [products]
  );
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [orders]
  );

  const metrics = [
    {
      label: 'Doanh thu',
      value: formatVND(stats.revenue),
      note: `Đã thu ${formatVND(stats.collected)}`,
      icon: DollarSign,
      accent: 'bg-amber-400/10 text-amber-400',
    },
    {
      label: 'Đơn hàng',
      value: String(stats.orders),
      note: stats.pendingOrders > 0 ? `${stats.pendingOrders} đơn chờ xác nhận` : 'Không có đơn chờ xác nhận',
      to: stats.pendingOrders > 0 ? '/admin/orders?status=pending' : '/admin/orders',
      icon: ShoppingCart,
      accent: 'bg-sky-400/10 text-sky-400',
    },
    {
      label: 'Sản phẩm',
      value: String(stats.products),
      note: `${stats.activeProducts} đang bán · ${stats.products - stats.activeProducts} đang ẩn`,
      to: '/admin/products',
      icon: Package,
      accent: 'bg-purple-400/10 text-purple-400',
    },
    {
      label: 'Khách hàng',
      value: String(stats.customers),
      note: `${stats.newCustomers} tài khoản mới trong tháng`,
      to: '/admin/users',
      icon: Users,
      accent: 'bg-emerald-400/10 text-emerald-400',
    },
  ];

  return (
    <AdminLayout title="Tổng Quan">
      <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {metrics.map(({ label, value, note, to, icon: Icon, accent }) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">{label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-white font-display tabular-nums truncate">
                  {value}
                </p>
                <p className="mt-1 text-xs text-zinc-400 truncate">{note}</p>
              </>
            );
            return to ? (
              <Link key={label} to={to} className={`${card} p-5 sm:p-6 hover:border-zinc-700 transition-colors`}>
                {body}
              </Link>
            ) : (
              <div key={label} className={`${card} p-5 sm:p-6`}>
                {body}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Revenue chart */}
          <section className={`${card} lg:col-span-8 p-5 sm:p-7`}>
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-white font-display">Doanh thu theo thời gian</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xl font-extrabold text-white tabular-nums">
                    {formatVND(periodRevenue)}
                  </span>
                  <span className="text-xs text-zinc-400">{periodOrders} đơn hàng</span>
                  {change !== null && (
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {change >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(1).replace('.', ',')}% so với kỳ trước
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl self-start" role="tablist">
                {REVENUE_RANGES.map((option) => (
                  <button
                    key={option.value}
                    role="tab"
                    aria-selected={range === option.value}
                    onClick={() => setRange(option.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      range === option.value
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {peak === 0 ? (
              <EmptyState
                bare
                tone="dark"
                icon={<BarChart3 className="w-7 h-7" />}
                title="Chưa có doanh thu trong khoảng thời gian này"
                description="Biểu đồ sẽ hiển thị khi có đơn hàng được đặt."
              />
            ) : (
              <div role="img" aria-label={`Biểu đồ doanh thu, tổng ${formatVND(periodRevenue)}`}>
                <div className="flex items-end gap-1 sm:gap-1.5 h-52 border-b border-zinc-800">
                  {series.map((bucket) => (
                    <div
                      key={bucket.key}
                      className="group relative flex-1 h-full flex items-end justify-center"
                    >
                      <div
                        className={`w-full max-w-10 rounded-t-md transition-colors ${
                          bucket.revenue > 0
                            ? 'bg-amber-400/80 group-hover:bg-amber-300'
                            : 'bg-zinc-800'
                        }`}
                        style={{
                          height: bucket.revenue > 0 ? `${Math.max(3, (bucket.revenue / peak) * 100)}%` : '2px',
                        }}
                      />
                      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs shadow-xl">
                        <p className="text-zinc-400">{bucket.title}</p>
                        <p className="font-bold text-white tabular-nums">{formatVND(bucket.revenue)}</p>
                        <p className="text-zinc-500">{bucket.orders} đơn</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 sm:gap-1.5 mt-2" aria-hidden="true">
                  {series.map((bucket, index) => (
                    <span
                      key={bucket.key}
                      className="flex-1 text-center text-[10px] text-zinc-500 tabular-nums overflow-visible whitespace-nowrap"
                    >
                      {index % labelEvery === 0 ? bucket.label : ''}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Cao nhất: {formatCompactVND(peak)} · Tính trên các đơn không bị hủy, theo ngày đặt hàng.
                </p>
              </div>
            )}
          </section>

          {/* Order statistics */}
          <section className={`${card} lg:col-span-4 p-5 sm:p-7`}>
            <h2 className="text-base font-bold text-white font-display mb-5">Trạng thái đơn hàng</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500">Chưa có đơn hàng nào.</p>
            ) : (
              <ul className="space-y-3.5">
                {(Object.keys(statusCounts) as OrderStatus[]).map((status) => {
                  const count = statusCounts[status];
                  return (
                    <li key={status}>
                      <Link
                        to={`/admin/orders?status=${status}`}
                        className="block group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-zinc-300 group-hover:text-white transition-colors">
                            {ORDER_STATUS_CONFIG[status].label}
                          </span>
                          <span className="font-bold text-white tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${STATUS_BAR_COLORS[status]}`}
                            style={{ width: `${(count / orders.length) * 100}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Top products */}
          <section className={`${card} p-5 sm:p-7`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white font-display">Sản phẩm bán chạy</h2>
              <Link to="/admin/products" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
                Tất cả sản phẩm
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">Chưa có sản phẩm nào được bán.</p>
            ) : (
              <ol className="divide-y divide-zinc-800">
                {topProducts.map((entry, index) => (
                  <li key={entry.productId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-zinc-500 tabular-nums">{index + 1}</span>
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 overflow-hidden shrink-0">
                      <ProductImage product={entry.product ?? entry.snapshot} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                      <p className="text-xs text-zinc-400">
                        {entry.product ? `Tồn kho: ${entry.product.stock}` : 'Đã xóa khỏi danh mục'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white tabular-nums">{entry.quantity} đã bán</p>
                      <p className="text-xs text-amber-400 tabular-nums">{formatVND(entry.revenue)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Stock alerts */}
          <section className={`${card} p-5 sm:p-7`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white font-display">Cảnh báo tồn kho</h2>
              <span className="text-xs text-zinc-500">Từ {SHOP.lowStockThreshold} sản phẩm trở xuống</span>
            </div>

            {lowStock.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">Tất cả sản phẩm đang bán đều đủ hàng.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {lowStock.map((product) => (
                  <li key={product.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${product.stock === 0 ? 'text-rose-400' : 'text-amber-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{product.sku}</p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums shrink-0 ${
                        product.stock === 0 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {product.stock === 0 ? 'Hết hàng' : `Còn ${product.stock}`}
                    </span>
                    <Link
                      to={`/admin/products?edit=${product.id}`}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                    >
                      Nhập hàng
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Recent orders */}
        <section className={`${card} p-5 sm:p-7`}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-bold text-white font-display">Đơn hàng gần đây</h2>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
            >
              <span>Tất cả đơn hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:-mx-7 px-5 sm:px-7">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Mã đơn</th>
                    <th className="py-3 px-4 font-semibold">Khách hàng</th>
                    <th className="py-3 px-4 font-semibold">Thời gian</th>
                    <th className="py-3 px-4 font-semibold">Thanh toán</th>
                    <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                    <th className="py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3 pl-4 font-semibold text-right">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-white whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{order.customer.name}</p>
                        <p className="text-xs text-zinc-500 tabular-nums">{order.customer.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-zinc-400 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {PAYMENT_METHOD_SHORT_LABELS[order.paymentMethod]}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white tabular-nums text-right whitespace-nowrap">
                        {formatVND(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          to={`/admin/orders?order=${order.id}`}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};
