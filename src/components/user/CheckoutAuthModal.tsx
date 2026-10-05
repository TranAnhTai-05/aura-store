import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import { usePending } from '../../hooks/usePending';
import { SHOP } from '../../config/shop';
import { User } from '../../types';
import { ArrowRight, AlertCircle } from 'lucide-react';

type AuthTab = 'login' | 'register';

interface CheckoutAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
  /** True when the modal was opened by pressing the order button */
  willPlaceOrder: boolean;
  /** Values already typed in the checkout form, used to prefill the auth forms */
  prefill: { name: string; email: string; phone: string };
}

export const CheckoutAuthModal: React.FC<CheckoutAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  willPlaceOrder,
  prefill,
}) => {
  const { loginCustomer, registerCustomer } = useAppStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, run] = usePending();

  // Reset the forms each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName(prefill.name);
    setEmail(prefill.email);
    setPhone(prefill.phone);
    setPassword('');
    setError('');
    // Someone who filled in the checkout form without signing in is most likely new here
    setTab(willPlaceOrder ? 'register' : 'login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run(() =>
      tab === 'login'
        ? loginCustomer(email, password)
        : registerCustomer({ name, email, phone, password })
    );
    if (!result) return;

    if (!result.ok) {
      setError(result.error);
      // The email already has an account: offer to sign in with it instead
      if (tab === 'register' && /đã có tài khoản/.test(result.error)) {
        setTab('login');
        setPassword('');
      }
      return;
    }
    showToast(
      tab === 'login'
        ? `Xin chào ${result.user.name}, đăng nhập thành công!`
        : 'Tạo tài khoản thành công! Chào mừng bạn đến với AURA.'
    );
    onAuthenticated(result.user);
  };

  const submitLabel =
    tab === 'login'
      ? willPlaceOrder
        ? 'Đăng nhập & đặt hàng'
        : 'Đăng nhập'
      : willPlaceOrder
      ? 'Tạo tài khoản & đặt hàng'
      : 'Tạo tài khoản';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={willPlaceOrder ? 'Đăng nhập để hoàn tất đơn hàng' : 'Đăng nhập tài khoản AURA'}
      description={
        willPlaceOrder
          ? 'Thông tin giao hàng bạn vừa nhập được giữ nguyên. Đơn hàng sẽ được xác nhận ngay sau khi đăng nhập.'
          : 'Đăng nhập để theo dõi đơn hàng, bảo hành và nhận ưu đãi thành viên.'
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl" role="tablist">
          {(['login', 'register'] as AuthTab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => switchTab(t)}
              className={`py-2.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {tab === 'register' && (
            <FormField label="Họ và tên" required>
              {(control) => (
                <input
                  {...control}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                />
              )}
            </FormField>
          )}

          <FormField label="Địa chỉ Email" required>
            {(control) => (
              <input
                {...control}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@example.com"
                autoComplete="email"
              />
            )}
          </FormField>

          {tab === 'register' && (
            <FormField label="Số điện thoại" required>
              {(control) => (
                <input
                  {...control}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  autoComplete="tel"
                />
              )}
            </FormField>
          )}

          <FormField
            label="Mật khẩu"
            required
            hint={tab === 'register' ? `Tối thiểu ${SHOP.minPasswordLength} ký tự.` : undefined}
          >
            {(control) => (
              <input
                {...control}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            )}
          </FormField>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <span>{pending ? 'Đang xử lý...' : submitLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
