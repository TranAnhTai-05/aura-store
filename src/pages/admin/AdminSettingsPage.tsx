import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { SHOP } from '../../config/shop';
import { formatVND } from '../../utils/format';
import { KeyRound, Store } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { adminUser, changeAdminPassword } = useAppStore();
  const { showToast } = useToast();

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [pending, run] = usePending();

  const setField =
    (field: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
      setError('');
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    const result = await run(() => changeAdminPassword(passwords.current, passwords.next));
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPasswords({ current: '', next: '', confirm: '' });
    showToast('Đã đổi mật khẩu quản trị.');
  };

  const shopRows = [
    { label: 'Hotline', value: SHOP.hotline },
    { label: 'Email hỗ trợ', value: SHOP.supportEmail },
    { label: 'Miễn phí giao hàng từ', value: formatVND(SHOP.freeShippingThreshold) },
    { label: 'Phí vận chuyển', value: formatVND(SHOP.shippingFee) },
    { label: 'Ngưỡng cảnh báo tồn kho', value: `${SHOP.lowStockThreshold} sản phẩm` },
    { label: 'Ngân hàng nhận chuyển khoản', value: `${SHOP.bank.name} · ${SHOP.bank.accountNumber}` },
  ];

  return (
    <AdminLayout title="Cài Đặt">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start max-w-5xl">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-amber-400" />
            Đổi mật khẩu quản trị
          </h2>
          <p className="text-sm text-zinc-400 mb-6">Tài khoản: {adminUser?.email}</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label="Mật khẩu hiện tại" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={setField('current')}
                />
              )}
            </FormField>

            <FormField
              label="Mật khẩu mới"
              required
              tone="dark"
              hint={`Tối thiểu ${SHOP.minPasswordLength} ký tự.`}
            >
              {(control) => (
                <input
                  {...control}
                  type="password"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={setField('next')}
                />
              )}
            </FormField>

            <FormField label="Nhập lại mật khẩu mới" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={setField('confirm')}
                />
              )}
            </FormField>

            {error && (
              <p role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={pending || !passwords.current || !passwords.next || !passwords.confirm}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl text-xs transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>
          </form>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-amber-400" />
            Thông tin cửa hàng
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Các giá trị này được đặt trong tệp <code className="text-zinc-200">src/config/shop.ts</code>.
          </p>

          <dl className="divide-y divide-zinc-800 text-sm">
            {shopRows.map((row) => (
              <div key={row.label} className="py-3 first:pt-0 last:pb-0 flex justify-between gap-4">
                <dt className="text-zinc-400">{row.label}</dt>
                <dd className="text-white font-medium text-right tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </AdminLayout>
  );
};
