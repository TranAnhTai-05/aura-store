import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, Link } from '../../router/RouterContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { formatVND, formatDateOnly } from '../../utils/format';
import { CITY_SUGGESTIONS, SHOP } from '../../config/shop';
import { Package, LogOut, ChevronRight } from 'lucide-react';

/** Rendered behind the customer guard, so a signed-in customer is always present */
export const ProfilePage: React.FC = () => {
  const { currentUser, customerOrders, updateProfile, changePassword, logoutCustomer } = useAppStore();
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const [profile, setProfile] = useState({
    name: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    address: currentUser?.address ?? '',
    city: currentUser?.city ?? '',
    district: currentUser?.district ?? '',
  });
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, runProfile] = usePending();
  const [savingPassword, runPassword] = usePending();

  if (!currentUser) return null;

  const isDirty =
    profile.name !== currentUser.name ||
    profile.phone !== currentUser.phone ||
    profile.address !== currentUser.address ||
    profile.city !== currentUser.city ||
    profile.district !== currentUser.district;

  const setProfileField =
    (field: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));
      setProfileError('');
    };

  const setPasswordField =
    (field: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
      setPasswordError('');
    };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await runProfile(() => updateProfile(profile));
    if (!result) return;
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    showToast('Đã lưu thông tin tài khoản.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordError('Mật khẩu nhập lại không khớp.');
      return;
    }
    const result = await runPassword(() => changePassword(passwords.current, passwords.next));
    if (!result) return;
    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }
    setPasswords({ current: '', next: '', confirm: '' });
    showToast('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
  };

  const handleLogout = async () => {
    await logoutCustomer();
    showToast('Bạn đã đăng xuất.');
    navigate('/');
  };

  const openOrders = customerOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display">
              Tài Khoản Của Tôi
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Thành viên từ {formatDateOnly(currentUser.createdAt)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start sm:self-auto px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 font-display">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-base font-bold text-zinc-900 font-sans">{currentUser.name}</h2>
              <p className="text-xs text-zinc-400 mb-4 break-all">{currentUser.email}</p>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-100 text-left">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <span className="text-[11px] text-zinc-400 block">Đơn hàng</span>
                  <strong className="text-sm font-bold text-zinc-900 tabular-nums">
                    {currentUser.ordersCount}
                  </strong>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl min-w-0">
                  <span className="text-[11px] text-zinc-400 block">Tổng chi tiêu</span>
                  <strong className="text-xs font-bold text-zinc-900 tabular-nums truncate block">
                    {formatVND(currentUser.totalSpent)}
                  </strong>
                </div>
              </div>
            </div>

            <Link
              to="/orders"
              className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Package className="w-5 h-5 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">Đơn hàng của tôi</p>
                  <p className="text-xs text-zinc-500">
                    {openOrders > 0 ? `${openOrders} đơn đang xử lý` : 'Xem lịch sử mua hàng'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
            </Link>
          </div>

          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-5 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 font-display mb-6">
                Thông tin cá nhân & địa chỉ mặc định
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                <FormField label="Họ và tên" required>
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      autoComplete="name"
                      value={profile.name}
                      onChange={setProfileField('name')}
                    />
                  )}
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email" hint="Email đăng nhập không thể thay đổi.">
                    {(control) => (
                      <input {...control} type="email" disabled value={currentUser.email} readOnly />
                    )}
                  </FormField>

                  <FormField label="Số điện thoại" required>
                    {(control) => (
                      <input
                        {...control}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={profile.phone}
                        onChange={setProfileField('phone')}
                      />
                    )}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Tỉnh / Thành phố">
                    {(control) => (
                      <>
                        <input
                          {...control}
                          type="text"
                          list="profile-cities"
                          autoComplete="address-level1"
                          value={profile.city}
                          onChange={setProfileField('city')}
                        />
                        <datalist id="profile-cities">
                          {CITY_SUGGESTIONS.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </FormField>

                  <FormField label="Quận / Huyện">
                    {(control) => (
                      <input
                        {...control}
                        type="text"
                        autoComplete="address-level2"
                        value={profile.district}
                        onChange={setProfileField('district')}
                      />
                    )}
                  </FormField>
                </div>

                <FormField
                  label="Địa chỉ giao hàng mặc định"
                  hint="Được điền sẵn ở bước thanh toán."
                >
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      autoComplete="street-address"
                      value={profile.address}
                      onChange={setProfileField('address')}
                      placeholder="Số nhà, tên đường, khu dân cư..."
                    />
                  )}
                </FormField>

                {profileError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {profileError}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!isDirty || savingProfile}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                  >
                    {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-5 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 font-display mb-6">Đổi mật khẩu</h2>

              <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                <FormField label="Mật khẩu hiện tại" required>
                  {(control) => (
                    <input
                      {...control}
                      type="password"
                      autoComplete="current-password"
                      value={passwords.current}
                      onChange={setPasswordField('current')}
                    />
                  )}
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Mật khẩu mới"
                    required
                    hint={`Tối thiểu ${SHOP.minPasswordLength} ký tự.`}
                  >
                    {(control) => (
                      <input
                        {...control}
                        type="password"
                        autoComplete="new-password"
                        value={passwords.next}
                        onChange={setPasswordField('next')}
                      />
                    )}
                  </FormField>

                  <FormField label="Nhập lại mật khẩu mới" required>
                    {(control) => (
                      <input
                        {...control}
                        type="password"
                        autoComplete="new-password"
                        value={passwords.confirm}
                        onChange={setPasswordField('confirm')}
                      />
                    )}
                  </FormField>
                </div>

                {passwordError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {passwordError}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword || !passwords.current || !passwords.next || !passwords.confirm}
                    className="px-6 py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400 disabled:hover:bg-white text-zinc-900 rounded-xl text-xs font-bold transition-colors"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
