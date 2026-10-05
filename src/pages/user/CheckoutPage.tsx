import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Link } from '../../router/RouterContext';
import { ProductImage } from '../../components/common/ProductImage';
import { FormField } from '../../components/common/FormField';
import { CheckoutAuthModal } from '../../components/user/CheckoutAuthModal';
import { BankTransferDetails } from '../../components/user/BankTransferDetails';
import { usePending } from '../../hooks/usePending';
import { validateCustomerInfo } from '../../services/store';
import { describeVariant } from '../../services/catalog';
import { formatVND } from '../../utils/format';
import { CITY_SUGGESTIONS } from '../../config/shop';
import { PaymentMethod, CustomerInfo, Order, User } from '../../types';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Lock,
  UserCheck,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

// Keeps the checkout form across reloads / navigation within the same browser tab
const DRAFT_KEY = 'aura_checkout_draft';

type CheckoutMethod = Extract<PaymentMethod, 'cod' | 'bank_transfer'>;
type CheckoutDraft = { formData: CustomerInfo; paymentMethod: PaymentMethod };
type FieldErrors = Partial<Record<keyof CustomerInfo, string>>;

const PAYMENT_OPTIONS: { id: CheckoutMethod; title: string; description: string }[] = [
  {
    id: 'cod',
    title: 'Thanh toán khi nhận hàng (COD)',
    description: 'Kiểm tra hàng rồi thanh toán tiền mặt cho nhân viên giao hàng.',
  },
  {
    id: 'bank_transfer',
    title: 'Chuyển khoản ngân hàng',
    description:
      'Thông tin chuyển khoản hiển thị sau khi đặt hàng. Đơn được xử lý khi AURA nhận được thanh toán.',
  },
];

// The order the fields appear in, used to focus the first one that needs attention
const FIELD_ORDER: (keyof CustomerInfo)[] = ['name', 'phone', 'email', 'city', 'district', 'ward', 'address'];

function readDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Draft persistence is best-effort
  }
}

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    shippingFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    hasCartIssues,
    currentUser,
    placeOrder,
  } = useAppStore();

  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<CustomerInfo>(() => {
    const draft = readDraft()?.formData;
    return {
      name: draft?.name || currentUser?.name || '',
      phone: draft?.phone || currentUser?.phone || '',
      email: draft?.email || currentUser?.email || '',
      city: draft?.city || currentUser?.city || '',
      district: draft?.district || currentUser?.district || '',
      ward: draft?.ward || '',
      address: draft?.address || currentUser?.address || '',
      note: draft?.note || '',
    };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>(() =>
    readDraft()?.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cod'
  );
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isPlacing, runPlacing] = usePending();

  // Auth gate: an order can only be confirmed by a signed-in customer
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<'login' | 'place_order'>('login');
  const [placeOrderAfterAuth, setPlaceOrderAfterAuth] = useState(false);

  useEffect(() => {
    if (placedOrder) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, paymentMethod }));
    } catch {
      // Draft persistence is best-effort
    }
  }, [formData, paymentMethod, placedOrder]);

  const submitOrder = async () => {
    const result = await runPlacing(() => placeOrder(formData, paymentMethod));
    if (!result) return;
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    clearDraft();
    setPlacedOrder(result.order);
    window.scrollTo({ top: 0 });
    showToast(`Đặt hàng thành công! Mã đơn ${result.order.orderNumber}`);
  };

  // Resume the order the customer confirmed right before signing in.
  // Runs after the re-render so placeOrder attaches the order to the new account.
  useEffect(() => {
    if (currentUser && placeOrderAfterAuth) {
      setPlaceOrderAfterAuth(false);
      submitOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, placeOrderAfterAuth]);

  if (placedOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center bg-[#fafaf9]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
          Đặt hàng thành công
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-display mb-3">
          Cảm ơn bạn đã tin chọn AURA!
        </h1>
        <p className="text-sm text-zinc-600 max-w-md mb-6 leading-relaxed">
          Đơn hàng <strong className="font-mono text-zinc-900">{placedOrder.orderNumber}</strong> trị giá{' '}
          <strong className="text-zinc-900 tabular-nums">{formatVND(placedOrder.totalAmount)}</strong> đã
          được ghi nhận và đang chờ xác nhận. Bạn có thể theo dõi tiến độ trong mục Đơn hàng của tôi.
        </p>

        {placedOrder.paymentMethod === 'bank_transfer' && (
          <div className="mb-8 max-w-md w-full text-left">
            <BankTransferDetails order={placedOrder} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/orders/${placedOrder.orderNumber}`}
            className="px-6 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
          >
            Xem chi tiết đơn hàng
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-5">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 font-display mb-2">
          Chưa có sản phẩm để thanh toán
        </h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-sm">
          Vui lòng thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name as keyof CustomerInfo;
    setFormData((prev) => ({ ...prev, [name]: e.target.value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const openAuthModal = (intent: 'login' | 'place_order') => {
    setAuthIntent(intent);
    setIsAuthModalOpen(true);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const found = validateCustomerInfo(formData);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      showToast('Vui lòng kiểm tra lại các thông tin được đánh dấu.', 'error');
      return;
    }

    if (hasCartIssues) {
      showToast('Một số sản phẩm không đủ hàng. Vui lòng cập nhật giỏ hàng.', 'error');
      return;
    }

    if (!currentUser) {
      openAuthModal('place_order');
      return;
    }

    submitOrder();
  };

  const handleAuthenticated = (user: User) => {
    setIsAuthModalOpen(false);
    // Fill only what the customer left blank — never overwrite what they typed
    setFormData((prev) => {
      const useSavedAddress = !prev.address.trim() && !!user.address;
      return {
        ...prev,
        name: prev.name.trim() ? prev.name : user.name,
        phone: prev.phone.trim() ? prev.phone : user.phone,
        email: prev.email.trim() ? prev.email : user.email,
        address: useSavedAddress ? user.address : prev.address,
        city: useSavedAddress || !prev.city.trim() ? user.city || prev.city : prev.city,
        district:
          useSavedAddress || !prev.district.trim() ? user.district || prev.district : prev.district,
      };
    });
    setErrors({});
    if (authIntent === 'place_order') {
      setPlaceOrderAfterAuth(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-zinc-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-zinc-700">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <Link to="/cart" className="hover:text-zinc-700">Giỏ hàng</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900 font-medium">Thanh toán</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display mb-8">
          Thanh Toán
        </h1>

        {hasCartIssues && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Một số sản phẩm trong giỏ không còn đủ hàng.{' '}
              <Link to="/cart" className="font-bold underline underline-offset-2">
                Cập nhật giỏ hàng
              </Link>{' '}
              để tiếp tục.
            </p>
          </div>
        )}

        {/* Account status */}
        {currentUser ? (
          <div className="mb-6 flex items-center gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <p className="text-sm text-zinc-600 min-w-0 truncate">
              Đang đặt hàng với tài khoản{' '}
              <strong className="text-zinc-900 font-bold">{currentUser.name}</strong>
              <span className="text-zinc-400"> · {currentUser.email}</span>
            </p>
          </div>
        ) : (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900">
                  Bạn cần đăng nhập để xác nhận đơn hàng
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tài khoản giúp bạn theo dõi vận chuyển, bảo hành và tích lũy ưu đãi thành viên.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="shrink-0 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmitOrder}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
        >
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <Truck className="w-5 h-5 text-zinc-900" />
                <h2 className="text-base font-bold text-zinc-900 font-display">
                  1. Địa chỉ nhận hàng
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Họ và tên người nhận" required error={errors.name}>
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                    />
                  )}
                </FormField>

                <FormField label="Số điện thoại" required error={errors.phone}>
                  {(control) => (
                    <input
                      {...control}
                      type="tel"
                      name="phone"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                    />
                  )}
                </FormField>
              </div>

              <FormField
                label="Email"
                required
                error={errors.email}
                hint="AURA dùng email này để liên hệ khi cần xác minh đơn hàng."
              >
                {(control) => (
                  <input
                    {...control}
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                )}
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Tỉnh / Thành phố" required error={errors.city}>
                  {(control) => (
                    <>
                      <input
                        {...control}
                        type="text"
                        name="city"
                        list="checkout-cities"
                        autoComplete="address-level1"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Hồ Chí Minh"
                      />
                      <datalist id="checkout-cities">
                        {CITY_SUGGESTIONS.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </>
                  )}
                </FormField>

                <FormField label="Quận / Huyện" required error={errors.district}>
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      name="district"
                      autoComplete="address-level2"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Quận 1"
                    />
                  )}
                </FormField>

                <FormField label="Phường / Xã" required error={errors.ward}>
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      name="ward"
                      autoComplete="address-level3"
                      value={formData.ward}
                      onChange={handleInputChange}
                      placeholder="Phường Bến Nghé"
                    />
                  )}
                </FormField>
              </div>

              <FormField label="Số nhà, tên đường" required error={errors.address}>
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 86 Nguyễn Trãi, Tòa Landmark, Tầng 12"
                  />
                )}
              </FormField>

              <FormField label="Ghi chú cho đơn hàng">
                {(control) => (
                  <textarea
                    {...control}
                    rows={2}
                    name="note"
                    maxLength={300}
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Giao sau 17h, gọi trước khi đến..."
                  />
                )}
              </FormField>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <CreditCard className="w-5 h-5 text-zinc-900" />
                <h2 className="text-base font-bold text-zinc-900 font-display">
                  2. Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3" role="radiogroup" aria-label="Phương thức thanh toán">
                {PAYMENT_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === option.id
                        ? 'border-zinc-950 bg-zinc-50 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === option.id}
                      onChange={() => setPaymentMethod(option.id)}
                      className="mt-0.5 w-4 h-4 accent-zinc-900"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900">{option.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs space-y-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 font-display">
                  Đơn hàng ({cart.length} sản phẩm)
                </h2>
                <Link to="/cart" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                  Chỉnh sửa
                </Link>
              </div>

              <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-100 pr-1">
                {cart.map((item) => (
                  <li
                    key={item.lineId}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0">
                        <ProductImage product={item.product} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {[describeVariant(item), `SL: ${item.quantity}`].filter(Boolean).join(' · ')}
                        </p>
                        {item.issue && (
                          <p className="text-xs text-rose-600 font-medium">
                            {item.issue === 'out_of_stock' ? 'Hết hàng' : `Chỉ còn ${item.maxQuantity}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-zinc-900 tabular-nums shrink-0">
                      {formatVND(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2.5 pt-4 border-t border-zinc-100 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <dt>Tạm tính</dt>
                  <dd className="font-semibold text-zinc-900 tabular-nums">{formatVND(cartSubtotal)}</dd>
                </div>

                <div className="flex justify-between text-zinc-600">
                  <dt>Phí vận chuyển</dt>
                  <dd className="font-semibold text-zinc-900 tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">Miễn phí</span>
                    ) : (
                      formatVND(shippingFee)
                    )}
                  </dd>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <dt>Giảm giá ({appliedCoupon?.code})</dt>
                    <dd className="font-bold tabular-nums">-{formatVND(discountAmount)}</dd>
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-100 flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1">
                  <dt className="text-sm font-bold text-zinc-900 whitespace-nowrap">Tổng thanh toán</dt>
                  <dd className="ml-auto text-xl sm:text-2xl font-extrabold text-zinc-950 tabular-nums font-display whitespace-nowrap">
                    {formatVND(grandTotal)}
                  </dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={hasCartIssues || isPlacing}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:shadow-none text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isPlacing ? (
                  <span>Đang đặt hàng...</span>
                ) : (
                  <>
                    {!currentUser && <Lock className="w-4 h-4" />}
                    <span>{currentUser ? 'Xác nhận đặt hàng' : 'Đăng nhập để đặt hàng'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <Link to="/policies#terms" className="underline underline-offset-2 hover:text-zinc-700">
                  Điều khoản dịch vụ
                </Link>{' '}
                của AURA.
              </p>

              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hàng chính hãng · Đổi trả trong 30 ngày</span>
              </div>
            </div>
          </aside>
        </form>
      </div>

      <CheckoutAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        willPlaceOrder={authIntent === 'place_order'}
        prefill={{ name: formData.name, email: formData.email, phone: formData.phone }}
      />
    </div>
  );
};
