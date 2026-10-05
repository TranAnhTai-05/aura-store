import React, { useEffect } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { ProductImage } from '../common/ProductImage';
import { QuantityStepper } from '../common/QuantityStepper';
import { describeVariant } from '../../services/catalog';
import { formatVND } from '../../utils/format';
import { Link, useRouter } from '../../router/RouterContext';
import { X, Trash2, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, cartSubtotal, cartTotalItems, hasCartIssues, updateCartQuantity, removeFromCart } =
    useAppStore();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const goTo = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    const result = updateCartQuantity(lineId, quantity);
    if (!result.ok) showToast(result.error, 'error');
    else if (result.capped) showToast(`Chỉ còn ${result.quantity} sản phẩm trong kho.`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs aura-fade-in" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col aura-slide-in-right">
        <div className="px-5 sm:px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900" />
            <h2 className="text-base font-semibold text-zinc-900">Giỏ hàng ({cartTotalItems})</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 divide-y divide-zinc-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-zinc-700 font-semibold mb-1">Giỏ hàng của bạn đang trống</p>
              <p className="text-sm text-zinc-400 max-w-xs mb-6">
                Khám phá các thiết bị công nghệ và phong cách sống cao cấp tại AURA.
              </p>
              <button
                onClick={() => goTo('/products')}
                className="px-5 py-3 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Bắt đầu mua sắm
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const variant = describeVariant(item);
              return (
                <div key={item.lineId} className="py-4 flex gap-4">
                  <div className="w-20 h-20 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                    <ProductImage product={item.product} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.lineId)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors p-1.5 -mr-1.5 shrink-0"
                          aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {variant && <p className="text-xs text-zinc-500 mt-0.5">{variant}</p>}
                      {item.issue && (
                        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {item.issue === 'out_of_stock'
                            ? 'Đã hết hàng'
                            : `Chỉ còn ${item.maxQuantity} sản phẩm`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={Math.max(item.maxQuantity, item.quantity)}
                        onChange={(q) => handleQuantityChange(item.lineId, q)}
                        label={item.product.name}
                      />
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        {formatVND(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-zinc-100 bg-zinc-50/50 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Tạm tính</span>
              <span className="text-base font-bold text-zinc-900 tabular-nums">
                {formatVND(cartSubtotal)}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {hasCartIssues
                ? 'Một số sản phẩm không đủ hàng. Vui lòng điều chỉnh trong giỏ hàng trước khi thanh toán.'
                : 'Phí vận chuyển và mã giảm giá được tính ở bước tiếp theo.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => goTo('/cart')}
                className="w-full py-3 px-4 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Xem giỏ hàng
              </button>
              <button
                onClick={() => goTo(hasCartIssues ? '/cart' : '/checkout')}
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Thanh toán</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
