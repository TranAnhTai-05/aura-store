import React from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Link, useRouter } from '../../router/RouterContext';
import { EmptyState } from '../../components/common/EmptyState';
import { describePromotion, isPromotionAvailable } from '../../services/pricing';
import { formatVND, formatDateOnly } from '../../utils/format';
import { Promotion } from '../../types';
import { Tag, Copy, ArrowRight, Check } from 'lucide-react';

export const PromotionsPage: React.FC = () => {
  const { promotions, cart, appliedCoupon, applyCoupon } = useAppStore();
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const available = promotions.filter((p) => isPromotionAvailable(p));

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã ${code}`);
    } catch {
      showToast(`Không thể sao chép tự động. Mã của bạn là ${code}.`, 'info');
    }
  };

  const handleUse = (promo: Promotion) => {
    if (cart.length === 0) {
      copyCode(promo.code);
      navigate('/products');
      return;
    }
    const result = applyCoupon(promo.code);
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast(result.message ?? `Đã áp dụng mã ${promo.code}.`);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-10 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Ưu đãi đang diễn ra
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-zinc-950 font-display">
            Mã Giảm Giá AURA
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Mỗi đơn hàng áp dụng được một mã. Nhập mã trong giỏ hàng để nhận ưu đãi.
          </p>
        </div>

        {available.length === 0 ? (
          <EmptyState
            icon={<Tag className="w-7 h-7" />}
            title="Hiện chưa có chương trình ưu đãi"
            description="Đăng ký nhận bản tin ở cuối trang để biết ngay khi có ưu đãi mới."
            action={
              <Link
                to="/products"
                className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Xem sản phẩm
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {available.map((promo) => {
              const isApplied = appliedCoupon?.code === promo.code;
              const remaining = promo.maxUsage - promo.usageCount;
              return (
                <article
                  key={promo.code}
                  className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                        <Tag className="w-5 h-5" />
                      </div>
                      {isApplied && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Đang áp dụng
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-zinc-900 mb-1 font-sans">{promo.title}</h2>
                    <p className="text-sm text-zinc-600 mb-4">{describePromotion(promo)}</p>

                    <div className="bg-zinc-50 p-3 rounded-2xl border border-dashed border-zinc-300 flex items-center justify-between mb-4">
                      <span className="font-mono font-extrabold text-zinc-950 text-sm tracking-wider">
                        {promo.code}
                      </span>
                      <button
                        onClick={() => copyCode(promo.code)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors"
                        aria-label={`Sao chép mã ${promo.code}`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <ul className="text-xs text-zinc-500 space-y-1 mb-6">
                      <li>
                        Đơn tối thiểu:{' '}
                        <span className="text-zinc-700 tabular-nums">{formatVND(promo.minOrder)}</span>
                      </li>
                      <li>
                        Hạn dùng: <span className="text-zinc-700">{formatDateOnly(promo.validUntil)}</span>
                      </li>
                      <li>
                        Còn lại: <span className="text-zinc-700 tabular-nums">{remaining} lượt</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUse(promo)}
                    disabled={isApplied}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>
                      {isApplied
                        ? 'Đã áp dụng cho giỏ hàng'
                        : cart.length > 0
                        ? 'Áp dụng cho giỏ hàng'
                        : 'Sao chép mã & mua sắm'}
                    </span>
                    {!isApplied && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
