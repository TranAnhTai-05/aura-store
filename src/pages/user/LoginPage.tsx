import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, Link, Redirect, getSafeRedirect } from '../../router/RouterContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { SHOP } from '../../config/shop';
import { ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginCustomer, currentUser } = useAppStore();
  const { showToast } = useToast();
  const { navigate, queryParams } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, run] = usePending();

  const redirectParam = queryParams.get('redirect');
  const destination = getSafeRedirect(redirectParam, '/');

  if (currentUser) return <Redirect to={destination} />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run(() => loginCustomer(email, password));
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(`Xin chào ${result.user.name}, đăng nhập thành công!`);
    navigate(destination, { replace: true });
  };

  const registerLink = redirectParam
    ? `/register?redirect=${encodeURIComponent(destination)}`
    : '/register';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fafaf9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-xs space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 font-display">Đăng nhập</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {redirectParam
              ? 'Vui lòng đăng nhập để tiếp tục.'
              : 'Quản lý đơn hàng và nhận ưu đãi thành viên.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <FormField label="Địa chỉ Email" required>
            {(control) => (
              <input
                {...control}
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="tenban@example.com"
              />
            )}
          </FormField>

          <FormField label="Mật khẩu" required>
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
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
            <span>{pending ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-zinc-500 text-center">
            Quên mật khẩu? Gọi{' '}
            <a href={`tel:${SHOP.hotline.replace(/\s/g, '')}`} className="font-semibold text-zinc-800 hover:underline">
              {SHOP.hotline}
            </a>{' '}
            để được hỗ trợ khôi phục tài khoản.
          </p>
        </form>

        <div className="text-center pt-4 border-t border-zinc-100">
          <p className="text-sm text-zinc-500">
            Chưa có tài khoản?{' '}
            <Link to={registerLink} className="font-bold text-zinc-900 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
