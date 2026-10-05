import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../router/RouterContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { SHOP } from '../../config/shop';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';

/** Reached only by typing /admin — nothing in the storefront links here */
export const AdminLoginPage: React.FC = () => {
  const { loginAdmin } = useAppStore();
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [pending, run] = usePending();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run(() => loginAdmin(email, password, rememberMe));
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      setPassword('');
      return;
    }
    showToast('Đăng nhập quản trị thành công.');
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="admin-area min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-display">AURA Admin</h1>
          <p className="text-sm text-zinc-400">Khu vực dành riêng cho quản trị viên.</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4" noValidate>
          <FormField label="Email quản trị" required tone="dark">
            {(control) => (
              <input
                {...control}
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            )}
          </FormField>

          <FormField label="Mật khẩu" required tone="dark">
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

          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 pt-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-amber-400"
            />
            <span>
              Ghi nhớ đăng nhập trong {SHOP.adminRememberDays} ngày
              <span className="block text-xs text-zinc-500">
                Nếu không chọn, phiên làm việc kết thúc sau {SHOP.adminSessionHours} giờ.
              </span>
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>{pending ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
