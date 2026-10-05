import React, { useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Link } from '../../router/RouterContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { isOrderOwnedBy } from '../../services/orders';
import { normalizeText } from '../../utils/validation';
import { formatVND, formatDate, formatDateOnly } from '../../utils/format';
import { User } from '../../types';
import { Search, Lock, Unlock, Eye, Users } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'locked';
type SortKey = 'newest' | 'name' | 'spent-desc' | 'orders-desc';

export const AdminUsersPage: React.FC = () => {
  const { users, orders, setUserLocked } = useAppStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);

  const customers = useMemo(() => users.filter((u) => u.role === 'customer'), [users]);
  const selectedUser = customers.find((u) => u.id === selectedId) ?? null;

  const filteredUsers = useMemo(() => {
    const words = normalizeText(search).split(/\s+/).filter(Boolean);
    const matching = customers.filter((u) => {
      if (status === 'active' && u.isLocked) return false;
      if (status === 'locked' && !u.isLocked) return false;
      if (words.length === 0) return true;
      const haystack = normalizeText([u.name, u.email, u.phone].join(' '));
      return words.every((word) => haystack.includes(word));
    });
    return matching.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'spent-desc':
          return b.totalSpent - a.totalSpent;
        case 'orders-desc':
          return b.ordersCount - a.ordersCount;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [customers, search, status, sort]);

  const selectedOrders = useMemo(
    () =>
      selectedUser
        ? orders
            .filter((o) => isOrderOwnedBy(o, selectedUser))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [orders, selectedUser]
  );

  const applyLock = async (user: User) => {
    const result = await setUserLocked(user.id, !user.isLocked);
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast(
      user.isLocked ? `Đã mở khóa tài khoản "${user.name}"` : `Đã khóa tài khoản "${user.name}"`
    );
  };

  // Unlocking is harmless; locking signs the customer out, so it asks first
  const requestLockChange = (user: User) => {
    if (user.isLocked) applyLock(user);
    else setLockTarget(user);
  };

  const hasFilters = search.trim() !== '' || status !== 'all';
  const selectClass =
    'px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-hidden focus:border-amber-400 cursor-pointer';

  return (
    <AdminLayout title="Khách Hàng">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Tìm khách hàng"
              placeholder="Tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <select
            aria-label="Trạng thái tài khoản"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={selectClass}
          >
            <option value="all">Tất cả tài khoản</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>

          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="newest">Mới đăng ký</option>
            <option value="name">Tên A → Z</option>
            <option value="spent-desc">Chi tiêu nhiều nhất</option>
            <option value="orders-desc">Nhiều đơn nhất</option>
          </select>
        </div>

        <p className="text-xs text-zinc-400">
          Hiển thị <strong className="text-white">{filteredUsers.length}</strong> trên{' '}
          {customers.length} khách hàng
        </p>

        {filteredUsers.length === 0 ? (
          <EmptyState
            tone="dark"
            icon={<Users className="w-7 h-7" />}
            title={hasFilters ? 'Không có khách hàng phù hợp' : 'Chưa có khách hàng nào'}
            description={
              hasFilters
                ? 'Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.'
                : 'Tài khoản khách hàng sẽ xuất hiện tại đây sau khi đăng ký.'
            }
          />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px] bg-zinc-950/40">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Khách hàng</th>
                    <th className="py-3.5 px-4 font-semibold">Số điện thoại</th>
                    <th className="py-3.5 px-4 font-semibold">Ngày đăng ký</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Số đơn</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Tổng chi tiêu</th>
                    <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{u.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-zinc-400">{u.phone || '—'}</td>
                      <td className="py-3.5 px-4 text-zinc-400 tabular-nums whitespace-nowrap">
                        {formatDateOnly(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-semibold text-white text-right">
                        {u.ordersCount}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400 tabular-nums text-right whitespace-nowrap">
                        {formatVND(u.totalSpent)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${
                            u.isLocked
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          }`}
                        >
                          {u.isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedId(u.id)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            aria-label={`Xem chi tiết ${u.name}`}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => requestLockChange(u)}
                            className={`p-2 rounded-lg transition-colors ${
                              u.isLocked
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10'
                            }`}
                            aria-label={u.isLocked ? `Mở khóa ${u.name}` : `Khóa ${u.name}`}
                            title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedId(null)}
        title={selectedUser?.name ?? ''}
        description={selectedUser?.email}
        tone="dark"
      >
        {selectedUser && (
          <div className="space-y-5 text-sm text-zinc-300">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-xs text-zinc-500 block">Đơn hàng</span>
                <strong className="text-base text-white tabular-nums">{selectedUser.ordersCount}</strong>
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Tổng chi tiêu</span>
                <strong className="text-base text-amber-400 tabular-nums">
                  {formatVND(selectedUser.totalSpent)}
                </strong>
              </div>
            </div>

            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Số điện thoại</dt>
                <dd className="text-white tabular-nums">{selectedUser.phone || 'Chưa cập nhật'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 shrink-0">Địa chỉ</dt>
                <dd className="text-white text-right">
                  {[selectedUser.address, selectedUser.district, selectedUser.city]
                    .filter(Boolean)
                    .join(', ') || 'Chưa cập nhật'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Ngày đăng ký</dt>
                <dd className="text-white tabular-nums">{formatDate(selectedUser.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Tài khoản</dt>
                <dd className={`font-semibold ${selectedUser.isLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedUser.isLocked ? 'Đã khóa' : 'Đang hoạt động'}
                </dd>
              </div>
            </dl>

            <div>
              <p className="font-bold text-white mb-2">Lịch sử đơn hàng</p>
              {selectedOrders.length === 0 ? (
                <p className="text-zinc-500">Khách hàng chưa đặt đơn nào.</p>
              ) : (
                <ul className="divide-y divide-zinc-800 max-h-56 overflow-y-auto pr-1">
                  {selectedOrders.map((order) => (
                    <li key={order.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/orders?order=${order.id}`}
                          className="font-mono font-bold text-white hover:text-amber-400"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-zinc-500 tabular-nums">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-white tabular-nums">
                          {formatVND(order.totalAmount)}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => requestLockChange(selectedUser)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  selectedUser.isLocked
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'
                }`}
              >
                {selectedUser.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{selectedUser.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        tone="dark"
        isOpen={!!lockTarget}
        title="Khóa tài khoản?"
        message={
          <>
            <strong className="text-white">{lockTarget?.name}</strong> sẽ bị đăng xuất và không thể
            đăng nhập hay đặt hàng cho đến khi được mở khóa. Các đơn hàng đã đặt không bị ảnh hưởng.
          </>
        }
        confirmLabel="Khóa tài khoản"
        onConfirm={() => {
          if (lockTarget) applyLock(lockTarget);
          setLockTarget(null);
        }}
        onCancel={() => setLockTarget(null)}
      />
    </AdminLayout>
  );
};
