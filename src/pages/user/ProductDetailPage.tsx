import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter, Link } from '../../router/RouterContext';
import { ProductImage } from '../../components/common/ProductImage';
import { RatingStars } from '../../components/common/RatingStars';
import { ProductCard } from '../../components/common/ProductCard';
import { QuantityStepper } from '../../components/common/QuantityStepper';
import { NotFoundPage } from './NotFoundPage';
import { usePending } from '../../hooks/usePending';
import { getProductImages, sortProducts } from '../../services/catalog';
import { getImageCredit } from '../../services/imageCredits';
import { formatVND, formatDateOnly } from '../../utils/format';
import { SHOP } from '../../config/shop';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Star,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface ProductDetailPageProps {
  /** A product id or slug taken from the address bar */
  productId: string;
}

type Tab = 'desc' | 'specs' | 'reviews';

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId }) => {
  const { activeProducts, cart, reviews, currentUser, addToCart, addReview, hasPurchased } =
    useAppStore();
  const { showToast } = useToast();
  const { navigate, path } = useRouter();

  const product = activeProducts.find((p) => p.id === productId || p.slug === productId);

  const [selectedColor, setSelectedColor] = useState(product?.variants?.colors?.[0] ?? '');
  const [selectedCapacity, setSelectedCapacity] = useState(product?.variants?.capacities?.[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('desc');
  const [activeImage, setActiveImage] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [sendingReview, runReview] = usePending();

  const productReviews = useMemo(
    () =>
      reviews
        .filter((r) => r.productId === product?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reviews, product?.id]
  );

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = activeProducts.filter((p) => p.id !== product.id);
    const sameCategory = sortProducts(others.filter((p) => p.category === product.category), 'bestseller');
    // Small categories are topped up with the shop's best sellers
    const rest = sortProducts(others.filter((p) => p.category !== product.category), 'bestseller');
    return [...sameCategory, ...rest].slice(0, 4);
  }, [activeProducts, product]);

  if (!product) {
    return (
      <NotFoundPage
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh."
        homePath="/products"
        homeLabel="Xem tất cả sản phẩm"
      />
    );
  }

  const images = getProductImages(product);
  const photoCredit = getImageCredit(images[activeImage]);
  const inCart = cart
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const available = Math.max(0, product.stock - inCart);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= SHOP.lowStockThreshold;
  const canBuy = available > 0;
  const chosenQuantity = Math.min(quantity, Math.max(available, 1));

  const ownReview = currentUser
    ? productReviews.find((r) => r.userId === currentUser.id)
    : undefined;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: productReviews.filter((r) => r.rating === stars).length,
  }));

  const handleAddToCart = (): boolean => {
    const result = addToCart(product, chosenQuantity, selectedColor, selectedCapacity);
    if (!result.ok) {
      showToast(result.error, 'error');
      return false;
    }
    showToast(
      result.capped
        ? `Chỉ còn ${result.added} sản phẩm, đã thêm ${result.added} vào giỏ hàng`
        : `Đã thêm ${result.added} × "${product.name}" vào giỏ hàng`,
      result.capped ? 'info' : 'success'
    );
    setQuantity(1);
    return true;
  };

  const handleBuyNow = () => {
    // What is already in the cart is enough to check out when no more stock can be added
    if (!canBuy && inCart > 0) {
      navigate('/checkout');
      return;
    }
    if (handleAddToCart()) navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await runReview(() =>
      addReview({ productId: product.id, rating: reviewRating, comment: reviewComment })
    );
    if (!result) return;
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast('Cảm ơn bạn đã đánh giá sản phẩm!');
    setReviewComment('');
    setReviewRating(5);
  };

  const tabButton = (tab: Tab) =>
    `px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
      activeTab === tab ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
    }`;

  const variantButton = (isSelected: boolean) =>
    `px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
      isSelected
        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
    }`;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-zinc-400 mb-6 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-zinc-700">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-zinc-700">Sản phẩm</Link>
          <span>/</span>
          <Link
            to={`/products?category=${encodeURIComponent(product.category)}`}
            className="hover:text-zinc-700"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 bg-white p-5 sm:p-8 lg:p-10 rounded-3xl border border-zinc-200/80 shadow-xs mb-12 sm:mb-16">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl bg-zinc-50 border border-zinc-200/60 overflow-hidden">
              <ProductImage
                product={product}
                src={images[activeImage]}
                width={960}
                className={`w-full h-full ${isOutOfStock ? 'opacity-70' : ''}`}
              />
              <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
                {isOutOfStock && (
                  <span className="bg-zinc-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                    Hết hàng
                  </span>
                )}
                {product.discount && !isOutOfStock && (
                  <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                    Tiết kiệm {product.discount}%
                  </span>
                )}
              </div>
            </div>

            {photoCredit && (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ảnh minh họa:{' '}
                <a
                  href={photoCredit.source}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-zinc-700 underline underline-offset-2"
                >
                  {photoCredit.author}
                </a>{' '}
                · {photoCredit.license} · Wikimedia Commons
              </p>
            )}

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Ảnh sản phẩm">
                {images.map((image, index) => (
                  <button
                    key={image}
                    role="tab"
                    aria-selected={activeImage === index}
                    aria-label={`Ảnh ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-zinc-50 ${
                      activeImage === index
                        ? 'border-zinc-900 shadow-sm'
                        : 'border-zinc-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ProductImage product={product} src={image} />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-100 text-center">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <Truck className="w-4 h-4 text-zinc-700 mx-auto mb-1" />
                <p className="text-xs font-semibold text-zinc-800">Miễn phí giao hàng</p>
                <p className="text-[11px] text-zinc-400">Đơn từ {formatVND(SHOP.freeShippingThreshold)}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <ShieldCheck className="w-4 h-4 text-zinc-700 mx-auto mb-1" />
                <p className="text-xs font-semibold text-zinc-800">Bảo hành 24 tháng</p>
                <p className="text-[11px] text-zinc-400">1 đổi 1 lỗi phần cứng</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <RotateCcw className="w-4 h-4 text-zinc-700 mx-auto mb-1" />
                <p className="text-xs font-semibold text-zinc-800">Đổi trả 30 ngày</p>
                <p className="text-[11px] text-zinc-400">Theo chính sách đổi trả</p>
              </div>
            </div>
          </div>

          {/* Purchase module */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2 flex-wrap">
                <span className="uppercase tracking-wider font-semibold text-zinc-400">
                  {product.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-zinc-400">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display leading-tight mb-3">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="py-2 hover:opacity-80 transition-opacity"
                  aria-label="Xem đánh giá của khách hàng"
                >
                  <RatingStars rating={product.rating} reviewsCount={product.reviewsCount} size="md" />
                </button>
                {(product.soldCount ?? 0) > 0 && (
                  <>
                    <span className="text-xs text-zinc-300">|</span>
                    <span className="text-xs text-zinc-500">
                      Đã bán <strong className="text-zinc-800 tabular-nums">{product.soldCount}</strong>
                    </span>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 mb-6">
                <p className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tabular-nums font-display break-words">
                  {formatVND(product.price)}
                </p>
                {product.originalPrice && product.discount && (
                  <p className="mt-1 flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-zinc-400 line-through tabular-nums">
                      {formatVND(product.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Tiết kiệm {formatVND(product.originalPrice - product.price)}
                    </span>
                  </p>
                )}
              </div>

              <p className="text-sm text-zinc-600 leading-relaxed mb-6">{product.description}</p>

              {product.variants?.colors && product.variants.colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-semibold text-zinc-900 mb-2.5">
                    <span>Màu sắc</span>
                    <span className="text-zinc-500 font-normal">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu sắc">
                    {product.variants.colors.map((color) => (
                      <button
                        key={color}
                        role="radio"
                        aria-checked={selectedColor === color}
                        onClick={() => setSelectedColor(color)}
                        className={variantButton(selectedColor === color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.capacities && product.variants.capacities.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-semibold text-zinc-900 mb-2.5">
                    <span>Kích thước / Cấu hình</span>
                    <span className="text-zinc-500 font-normal">{selectedCapacity}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kích thước">
                    {product.variants.capacities.map((cap) => (
                      <button
                        key={cap}
                        role="radio"
                        aria-checked={selectedCapacity === cap}
                        onClick={() => setSelectedCapacity(cap)}
                        className={variantButton(selectedCapacity === cap)}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-zinc-900 mb-2">Số lượng</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <QuantityStepper
                    value={canBuy ? chosenQuantity : 0}
                    min={canBuy ? 1 : 0}
                    max={available}
                    onChange={setQuantity}
                    label={product.name}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {isOutOfStock
                      ? 'Hết hàng'
                      : isLowStock
                      ? `Chỉ còn ${product.stock} sản phẩm`
                      : `Còn hàng (${product.stock} sản phẩm)`}
                  </span>
                </div>
                {inCart > 0 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Bạn đã có {inCart} sản phẩm này trong giỏ hàng
                    {!canBuy && !isOutOfStock ? ' — đây là toàn bộ số lượng còn lại.' : '.'}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-zinc-100 space-y-3">
              {isOutOfStock && (
                <div className="flex items-start gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600">
                  <AlertCircle className="w-4 h-4 shrink-0 text-zinc-500" />
                  <span>
                    Sản phẩm tạm hết hàng. Liên hệ {SHOP.hotline} để được báo khi có hàng trở lại.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!canBuy}
                  className="w-full py-3.5 px-4 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 text-zinc-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Thêm vào giỏ</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || (!canBuy && inCart === 0)}
                  className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:shadow-none text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Hết hàng' : 'Mua ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div
          id="product-tabs"
          className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-10 mb-12 sm:mb-16 scroll-mt-24"
        >
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-4 mb-8 overflow-x-auto" role="tablist">
            <button role="tab" aria-selected={activeTab === 'desc'} onClick={() => setActiveTab('desc')} className={tabButton('desc')}>
              Mô tả & Tính năng
            </button>
            <button role="tab" aria-selected={activeTab === 'specs'} onClick={() => setActiveTab('specs')} className={tabButton('specs')}>
              Thông số kỹ thuật
            </button>
            <button role="tab" aria-selected={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} className={tabButton('reviews')}>
              <span>Đánh giá</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                  activeTab === 'reviews' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-800'
                }`}
              >
                {productReviews.length}
              </span>
            </button>
          </div>

          {activeTab === 'desc' && (
            <div className="space-y-6 max-w-3xl">
              <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

              {product.features.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 font-sans">
                    Đặc điểm nổi bật
                  </h3>
                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-zinc-700">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              {Object.keys(product.specs).length === 0 ? (
                <p className="text-sm text-zinc-500">Thông số kỹ thuật đang được cập nhật.</p>
              ) : (
                <dl className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-1 p-4 text-sm ${
                        index % 2 === 0 ? 'bg-zinc-50/50' : 'bg-white'
                      }`}
                    >
                      <dt className="font-semibold text-zinc-500">{key}</dt>
                      <dd className="sm:col-span-2 font-medium text-zinc-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-4">
                {productReviews.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 mb-2">
                    <div className="text-center sm:pr-6 sm:border-r border-zinc-200 shrink-0">
                      <p className="text-4xl font-extrabold text-zinc-950 font-display tabular-nums">
                        {product.rating.toFixed(1)}
                      </p>
                      <div className="flex justify-center mt-1">
                        <RatingStars rating={product.rating} showCount={false} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{productReviews.length} đánh giá</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingBreakdown.map(({ stars, count }) => (
                        <div key={stars} className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="w-10 tabular-nums">{stars} sao</span>
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${(count / productReviews.length) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {productReviews.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6">
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận!
                  </p>
                ) : (
                  productReviews.map((review) => (
                    <article key={review.id} className="p-4 rounded-2xl bg-white border border-zinc-200/80">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-bold text-zinc-900">{review.userName}</span>
                          {review.verifiedPurchase && (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                        <time className="text-xs text-zinc-400 tabular-nums shrink-0" dateTime={review.date}>
                          {formatDateOnly(review.date)}
                        </time>
                      </div>
                      <RatingStars rating={review.rating} showCount={false} />
                      <p className="mt-2 text-sm text-zinc-700 leading-relaxed">{review.comment}</p>
                    </article>
                  ))
                )}
              </div>

              <div className="lg:col-span-5">
                <div className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 lg:sticky lg:top-24">
                  <h3 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-2 font-sans">
                    <MessageSquare className="w-4 h-4 text-zinc-700" />
                    <span>Đánh giá của bạn</span>
                  </h3>

                  {!currentUser ? (
                    <>
                      <p className="text-sm text-zinc-500 mb-4">
                        Đăng nhập để chia sẻ trải nghiệm của bạn về sản phẩm này.
                      </p>
                      <Link
                        to={`/login?redirect=${encodeURIComponent(path)}`}
                        className="inline-block px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Đăng nhập để đánh giá
                      </Link>
                    </>
                  ) : ownReview ? (
                    <p className="text-sm text-zinc-500">
                      Bạn đã đánh giá sản phẩm này {ownReview.rating} sao vào ngày{' '}
                      {formatDateOnly(ownReview.date)}. Cảm ơn bạn!
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 mb-4">
                        {hasPurchased(product.id)
                          ? 'Đánh giá của bạn sẽ được gắn nhãn "Đã mua hàng".'
                          : 'Đánh giá được gắn nhãn "Đã mua hàng" khi bạn có đơn đã giao chứa sản phẩm này.'}
                      </p>

                      <form onSubmit={handleReviewSubmit} className="space-y-4" noValidate>
                        <div>
                          <p className="text-xs font-semibold text-zinc-700 mb-1">Mức độ hài lòng</p>
                          <div className="flex items-center gap-1" role="radiogroup" aria-label="Số sao">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={reviewRating === star}
                                aria-label={`${star} sao`}
                                onClick={() => setReviewRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= reviewRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-zinc-200 text-zinc-200'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-zinc-700 ml-2">{reviewRating}/5</span>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="review-comment" className="block text-xs font-semibold text-zinc-700 mb-1">
                            Nhận xét <span className="text-rose-600">*</span>
                          </label>
                          <textarea
                            id="review-comment"
                            rows={4}
                            maxLength={1000}
                            placeholder="Chất lượng, độ hoàn thiện, trải nghiệm sử dụng..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:border-zinc-900"
                          />
                          <p className="mt-1 text-xs text-zinc-400">Tối thiểu 10 ký tự.</p>
                        </div>

                        <button
                          type="submit"
                          disabled={sendingReview}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          {sendingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 font-display">
                Có thể bạn cũng thích
              </h2>
              <Link to="/products" className="text-sm font-semibold text-zinc-600 hover:text-zinc-950">
                Xem tất cả &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
