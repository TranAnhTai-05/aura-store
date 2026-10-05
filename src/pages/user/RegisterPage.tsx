import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, Link, Redirect, getSafeRedirect } from '../../router/RouterContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { validatePassword } from '../../../shared/validators';
import { EMAIL_HINT, PHONE_HINT, isValidEmail, isValidPhone } from '../../utils/validation';
import { SHOP } from '../../config/shop';
import { ArrowRight, AlertCircle } from 'lucide-react';

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';

export const RegisterPage: React.FC = () => {
  const { registerCustomer, currentUser } = useAppStore();
  const { showToast } = useToast();
  const { navigate, queryParams } = useRouter();

  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [pending, run] = usePending();

  const redirectParam = queryParams.get('redirect');
  const destination = getSafeRedirect(redirectParam, '/');

  if (currentUser) return <Redirect to={destination} />;

  const setField = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const found: Partial<Record<Field, string>> = {};
    if (values.name.trim().length < 2) found.name = 'Vui lòng nhập họ và tên.';
    if (!isValidEmail(values.email)) found.email = EMAIL_HINT;
    if (!isValidPhone(values.phone)) found.phone = PHONE_HINT;
    const passwordError = validatePassword(values.password);
    if (passwordError) found.password = passwordError;
    if (values.confirmPassword !== values.password) {
      found.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    }
    return found;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await run(() => registerCustomer(values));
    if (!result) return;
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    showToast('Tạo tài khoản thành công! Chào mừng bạn đến với AURA.');
    navigate(destination, { replace: true });
  };

  const loginLink = redirectParam ? `/login?redirect=${encodeURIComponent(destination)}` : '/login';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fafaf9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-xs space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 font-display">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Theo dõi đơn hàng, lưu địa chỉ giao hàng và nhận ưu đãi thành viên.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <FormField label="Họ và tên" required error={errors.name}>
            {(control) => (
              <input
                {...control}
                type="text"
                autoComplete="name"
                autoFocus
                value={values.name}
                onChange={setField('name')}
                placeholder="Nguyễn Văn A"
              />
            )}
          </FormField>

          <FormField label="Địa chỉ Email" required error={errors.email}>
            {(control) => (
              <input
                {...control}
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={setField('email')}
                placeholder="tenban@example.com"
              />
            )}
          </FormField>

          <FormField label="Số điện thoại" required error={errors.phone}>
            {(control) => (
              <input
                {...control}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={setField('phone')}
                placeholder="0912345678"
              />
            )}
          </FormField>

          <FormField
            label="Mật khẩu"
            required
            error={errors.password}
            hint={`Tối thiểu ${SHOP.minPasswordLength} ký tự.`}
          >
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={setField('password')}
              />
            )}
          </FormField>

          <FormField label="Nhập lại mật khẩu" required error={errors.confirmPassword}>
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={setField('confirmPassword')}
              />
            )}
          </FormField>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <span>{pending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            Bằng việc tạo tài khoản, bạn đồng ý với{' '}
            <Link to="/policies#terms" className="underline underline-offset-2 hover:text-zinc-700">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/policies#privacy" className="underline underline-offset-2 hover:text-zinc-700">
              Chính sách bảo mật
            </Link>
            .
          </p>
        </form>

        <div className="text-center pt-4 border-t border-zinc-100">
          <p className="text-sm text-zinc-500">
            Đã có tài khoản?{' '}
            <Link to={loginLink} className="font-bold text-zinc-900 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
