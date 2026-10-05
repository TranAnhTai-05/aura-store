import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductImage } from '../../components/common/ProductImage';
import { ProductIllustration } from '../../components/common/ProductIllustration';
import { RatingStars } from '../../components/common/RatingStars';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from '../../router/RouterContext';
import { sortProducts } from '../../services/catalog';
import { formatVND } from '../../utils/format';
import { ArrowRight, Sparkles, Shield, Award, PackageSearch, Truck } from 'lucide-react';
import { SHOP } from '../../config/shop';

type Tab = 'featured' | 'bestseller' | 'new';

const TABS: { id: Tab; label: string }[] = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'bestseller', label: 'Bán chạy' },
  { id: 'new', label: 'Mới về' },
];

export const HomePage: React.FC = () => {
  const { activeProducts, categories, reviews } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('featured');

  // The campaign spot goes to the best-selling featured product that can actually be bought
  const heroProduct = useMemo(() => {
    const inStock = activeProducts.filter((p) => p.stock > 0);
    const featured = inStock.filter((p) => p.isFeatured);
    return sortProducts(featured.length > 0 ? featured : inStock, 'bestseller')[0];
  }, [activeProducts]);

  const displayedProducts = useMemo(() => {
    if (activeTab === 'featured') {
      return sortProducts(activeProducts.filter((p) => p.isFeatured), 'newest');
    }
    if (activeTab === 'bestseller') {
      return sortProducts(
        activeProducts.filter((p) => (p.soldCount ?? 0) > 0 || p.isBestSeller),
        'bestseller'
      );
    }
    return sortProducts(activeProducts, 'newest');
  }, [activeProducts, activeTab]);

  const testimonials = useMemo(
    () =>
      reviews
        .filter((r) => r.rating >= 4 && activeProducts.some((p) => p.id === r.productId))
        .sort((a, b) => Number(b.verifiedPurchase) - Number(a.verifiedPurchase) || b.date.localeCompare(a.date))
        .slice(0, 3),
    [reviews, activeProducts]
  );

  const visibleCategories = categories.filter((c) => c.itemCount > 0);

  return (
    <div className="min-h-screen">
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-14 lg:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bộ sưu tập {new Date().getFullYear()}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-display text-balance">
                Đỉnh Cao Công Nghệ, <br />
                <span className="text-zinc-400">Thuần Khiết Tối Giản.</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
                Thiết bị âm thanh, đồng hồ thông minh và giải pháp không gian làm việc được chế tác
                từ vật liệu bền bỉ, thiết kế để dùng lâu dài.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/products"
                  className="px-6 py-3.5 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  <span>Khám phá sản phẩm</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/promotions"
                  className="px-6 py-3.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
                >
                  Xem ưu đãi
                </Link>
              </div>

              <div className="pt-8 border-t border-zinc-800/80 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-white">24 tháng</p>
                  <p className="text-xs text-zinc-400">Bảo hành 1 đổi 1</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-white">30 ngày</p>
                  <p className="text-xs text-zinc-400">Đổi trả linh hoạt</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-white">Miễn phí</p>
                  <p className="text-xs text-zinc-400">
                    Giao đơn từ {formatVND(SHOP.freeShippingThreshold)}
                  </p>
                </div>
              </div>
            </div>

            {heroProduct && (
              <div className="lg:col-span-5">
                <Link
                  to={`/products/${heroProduct.id}`}
                  className="group block relative mx-auto max-w-md lg:max-w-none aspect-square rounded-3xl bg-zinc-900 p-4 sm:p-6 border border-zinc-800 shadow-2xl overflow-hidden"
                >
                  <ProductImage product={heroProduct} width={960} className="w-full h-full rounded-2xl" />
                  <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-6 bg-zinc-950/85 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-400 font-medium truncate">{heroProduct.name}</p>
                      <p className="text-base font-bold text-white tabular-nums">
                        {formatVND(heroProduct.price)}
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-xl group-hover:bg-zinc-200 transition-colors shrink-0">
                      Xem chi tiết
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Categories */}
      {visibleCategories.length > 0 && (
        <section className="py-14 sm:py-16 bg-white border-b border-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Danh mục
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-display">
                  Khám phá theo danh mục
                </h2>
              </div>
              <Link
                to="/products"
                className="mt-4 md:mt-0 text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-1"
              >
                <span>Xem tất cả sản phẩm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {visibleCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-xs p-2 mb-4 group-hover:scale-105 transition-transform duration-300">
                    <ProductIllustration type={cat.illustrationType} className="w-full h-full" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">{cat.name}</h3>
                  <span className="text-xs text-zinc-400">{cat.itemCount} sản phẩm</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Product selection */}
      <section className="py-14 sm:py-20 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Sản phẩm chọn lọc
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-display">
                Thiết bị chuẩn mực cuộc sống
              </h2>
            </div>

            <div
              className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-xl self-start md:self-auto"
              role="tablist"
              aria-label="Nhóm sản phẩm"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="w-7 h-7" />}
              title="Chưa có sản phẩm trong nhóm này"
              description="Hãy xem toàn bộ sản phẩm đang được bán tại cửa hàng."
              action={
                <Link
                  to="/products"
                  className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Xem tất cả sản phẩm
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {displayedProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {activeProducts.length > 0 && (
            <div className="mt-12 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
              >
                <span>Xem tất cả {activeProducts.length} sản phẩm</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. Brand story */}
      <section className="py-14 sm:py-20 bg-zinc-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Triết lý thiết kế AURA
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
                Độ Bền Vượt Thời Gian. <br />
                Chế Tác Chính Xác Từng Milimet.
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Mỗi thiết bị AURA được làm từ vật liệu được tuyển chọn: hợp kim nhôm nguyên khối,
                Titanium và gỗ tự nhiên. Không chi tiết thừa, không thỏa hiệp về chất lượng.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
                {[
                  { icon: Shield, title: 'Vật liệu tuyển chọn', text: 'Titanium, nhôm Anodized, gỗ óc chó' },
                  { icon: Award, title: 'Bảo hành 24 tháng', text: '1 đổi 1 với lỗi phần cứng' },
                  { icon: Truck, title: 'Giao hàng toàn quốc', text: 'Kiểm tra hàng trước khi nhận' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="p-2.5 bg-zinc-800 rounded-xl text-amber-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-sans">{title}</h3>
                      <p className="text-xs text-zinc-400 mt-1">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white border-b-2 border-white pb-1 hover:text-zinc-300 transition-colors"
                >
                  <span>Tìm hiểu thêm về AURA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[4/3] rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700/60 p-3">
                    <ProductIllustration type="watch" className="w-full h-full" />
                  </div>
                  <div className="aspect-square rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700/60 p-3">
                    <ProductIllustration type="keyboard" className="w-full h-full" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700/60 p-3">
                    <ProductIllustration type="lamp" className="w-full h-full" />
                  </div>
                  <div className="aspect-[4/3] rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700/60 p-3">
                    <ProductIllustration type="speaker" className="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Reviews */}
      {testimonials.length > 0 && (
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Đánh giá từ khách hàng
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-display">
                Trải nghiệm thực tế từ cộng đồng
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((review) => {
                const product = activeProducts.find((p) => p.id === review.productId);
                return (
                  <figure
                    key={review.id}
                    className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between"
                  >
                    <div>
                      <RatingStars rating={review.rating} showCount={false} />
                      <blockquote className="mt-3 text-sm text-zinc-700 leading-relaxed mb-6">
                        "{review.comment}"
                      </blockquote>
                    </div>

                    <figcaption className="pt-4 border-t border-zinc-200/60 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{review.userName}</p>
                        {product && (
                          <Link
                            to={`/products/${product.id}`}
                            className="text-xs text-zinc-500 hover:text-zinc-900 truncate block"
                          >
                            {product.name}
                          </Link>
                        )}
                      </div>
                      {review.verifiedPurchase && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200 shrink-0">
                          Đã mua hàng
                        </span>
                      )}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
