import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, Link } from '../../router/RouterContext';
import { ProductImage } from '../../components/common/ProductImage';
import { QuantityStepper } from '../../components/common/QuantityStepper';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { describeVariant } from '../../services/catalog';
import { describePromotion, evaluateCoupon } from '../../services/pricing';
import { formatVND } from '../../utils/format';
import { SHOP } from '../../config/shop';
import { Trash2, ArrowRight, Tag, ShieldCheck, ShoppingBag, AlertCircle, Truck } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartTotalItems,
    shippingFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    enteredCouponCode,
    isCouponValid,
    couponMessage,
    hasCartIssues,
    unavailableCartCount,
    promotions,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useAppStore();

  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const tryCoupon = (code: string) => {
    const result = applyCoupon(code);
    if (result.ok) {
      showToast(result.message ?? 'Đã áp dụng mã giảm giá.');
      setCouponInput('');
      setCouponError('');
    } else {
      setCouponError(result.error);
    }
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    const result = updateCartQuantity(lineId, quantity);
    if (!result.ok) showToast(result.error, 'error');
    else if (result.capped) showToast(`Chỉ còn ${result.quantity} sản phẩm trong kho.`, 'info');
  };

  const handleRemove = (lineId: string, name: string) => {
    removeFromCart(lineId);
    showToast(`Đã xóa "${name}" khỏi giỏ hàng`, 'info');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 font-display mb-2">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="text-sm text-zinc-500 max-w-sm mb-8">
          {unavailableCartCount > 0
            ? 'Các sản phẩm bạn đã chọn hiện không còn được bán.'
            : 'Hãy dạo một vòng và chọn những thiết bị phù hợp cho không gian của bạn.'}
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const missingForFreeShipping = SHOP.freeShippingThreshold - cartSubtotal;
  const suggestions = promotions
    .filter((p) => p.code !== appliedCoupon?.code && evaluateCoupon(p, cartSubtotal, shippingFee).valid)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-zinc-400 mb-4" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-zinc-700">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-900 font-medium">Giỏ hàng</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display mb-8">
          Giỏ Hàng <span className="text-zinc-400 font-sans text-lg font-semibold">({cartTotalItems} sản phẩm)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-8 space-y-4">
            {unavailableCartCount > 0 && (
              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {unavailableCartCount} sản phẩm trong giỏ không còn được bán và đã được loại khỏi đơn
                  hàng.
                </span>
              </div>
            )}

            {hasCartIssues && (
              <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Một số sản phẩm không đủ hàng. Vui lòng giảm số lượng hoặc xóa các sản phẩm được đánh
                  dấu để tiếp tục thanh toán.
                </span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-8 shadow-xs">
              <ul className="divide-y divide-zinc-100">
                {cart.map((item) => {
                  const variant = describeVariant(item);
                  return (
                    <li
                      key={item.lineId}
                      className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center justify-between"
                    >
                      <div className="flex gap-4 items-center flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-50 border border-zinc-200/60 overflow-hidden shrink-0"
                        >
                          <ProductImage product={item.product} />
                        </Link>

                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/products/${item.product.id}`}
                            className="text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {variant && <p className="text-xs text-zinc-500">{variant}</p>}
                          <p className="text-xs text-zinc-500">
                            Đơn giá:{' '}
                            <span className="font-semibold text-zinc-800 tabular-nums">
                              {formatVND(item.product.price)}
                            </span>
                          </p>
                          {item.issue && (
                            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {item.issue === 'out_of_stock'
                                ? 'Sản phẩm đã hết hàng'
                                : `Chỉ còn ${item.maxQuantity} sản phẩm trong kho`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={Math.max(item.maxQuantity, item.quantity)}
                          onChange={(q) => handleQuantityChange(item.lineId, q)}
                          label={item.product.name}
                        />

                        <span className="text-sm sm:text-base font-extrabold text-zinc-950 tabular-nums sm:min-w-[110px] text-right">
                          {formatVND(item.product.price * item.quantity)}
                        </span>

                        <button
                          onClick={() => handleRemove(item.lineId, item.product.name)}
                          className="p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">
                <Link
                  to="/products"
                  className="py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  &larr; Tiếp tục mua sắm
                </Link>
                <button
                  onClick={() => setIsClearing(true)}
                  className="py-2 text-sm font-semibold text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs space-y-6 lg:sticky lg:top-24">
              <h2 className="text-base font-bold text-zinc-900 font-display">Tóm Tắt Đơn Hàng</h2>

              {/* Free shipping progress */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2 text-xs text-zinc-700 mb-2">
                  <Truck className="w-4 h-4 text-zinc-500 shrink-0" />
                  {missingForFreeShipping > 0 ? (
                    <span>
                      Mua thêm <strong className="tabular-nums">{formatVND(missingForFreeShipping)}</strong> để
                      được miễn phí giao hàng
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-700">Đơn hàng được miễn phí giao hàng</span>
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (cartSubtotal / SHOP.freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Coupon */}
              <div>
                <label htmlFor="coupon-code" className="block text-xs font-semibold text-zinc-700 mb-2">
                  Mã giảm giá
                </label>
                {enteredCouponCode ? (
                  <div
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                      isCouponValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Tag className={`w-4 h-4 shrink-0 mt-0.5 ${isCouponValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <div className="min-w-0">
                        <span className={`text-xs font-bold ${isCouponValid ? 'text-emerald-800' : 'text-amber-900'}`}>
                          {enteredCouponCode}
                        </span>
                        <p className={`text-xs ${isCouponValid ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {couponMessage ?? (appliedCoupon ? describePromotion(appliedCoupon) : '')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold shrink-0 p-1"
                    >
                      Gỡ mã
                    </button>
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        tryCoupon(couponInput);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        id="coupon-code"
                        type="text"
                        autoComplete="off"
                        placeholder="Nhập mã"
                        value={couponInput}
                        aria-invalid={!!couponError}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className={`flex-1 min-w-0 px-3 py-2.5 bg-zinc-50 border rounded-xl text-sm uppercase font-mono tracking-wider focus:outline-hidden ${
                          couponError ? 'border-rose-400' : 'border-zinc-200 focus:border-zinc-900'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!couponInput.trim()}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Áp dụng
                      </button>
                    </form>
                    {couponError && (
                      <p role="alert" className="mt-1.5 text-xs text-rose-600">
                        {couponError}
                      </p>
                    )}
                    {suggestions.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs text-zinc-400">Mã áp dụng được cho đơn này:</p>
                        {suggestions.map((promo) => (
                          <button
                            key={promo.code}
                            onClick={() => tryCoupon(promo.code)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-dashed border-zinc-300 rounded-xl text-left hover:border-zinc-500 transition-colors"
                          >
                            <span className="font-mono text-xs font-bold text-zinc-900">{promo.code}</span>
                            <span className="text-xs text-zinc-500 truncate">{describePromotion(promo)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <dl className="space-y-3 pt-4 border-t border-zinc-100 text-sm">
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
                  <dd className="ml-auto text-xl font-extrabold text-zinc-950 tabular-nums font-display whitespace-nowrap">
                    {formatVND(grandTotal)}
                  </dd>
                </div>
              </dl>

              <button
                onClick={() => navigate('/checkout')}
                disabled={hasCartIssues}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:shadow-none text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hàng chính hãng · Kiểm tra trước khi thanh toán</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isClearing}
        title="Xóa toàn bộ giỏ hàng?"
        message={`${cartTotalItems} sản phẩm sẽ bị xóa khỏi giỏ hàng. Mã giảm giá đang áp dụng cũng sẽ được gỡ.`}
        confirmLabel="Xóa giỏ hàng"
        onConfirm={() => {
          clearCart();
          setIsClearing(false);
          showToast('Đã xóa toàn bộ giỏ hàng', 'info');
        }}
        onCancel={() => setIsClearing(false)}
      />
    </div>
  );
};
