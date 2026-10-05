import React from 'react';
import { Product } from '../../types';
import { ProductImage } from './ProductImage';
import { RatingStars } from './RatingStars';
import { formatVND } from '../../utils/format';
import { Link } from '../../router/RouterContext';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { SHOP } from '../../config/shop';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useAppStore();
  const { showToast } = useToast();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= SHOP.lowStockThreshold;
  const hasOptions =
    (product.variants?.colors?.length ?? 0) > 1 || (product.variants?.capacities?.length ?? 0) > 1;

  const handleAddToCart = () => {
    const result = addToCart(product, 1);
    if (result.ok) showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
    else showToast(result.error, 'error');
  };

  return (
    <div className="group relative flex flex-col bg-white border border-zinc-200/80 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300">
      <Link
        to={`/products/${product.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 block"
        aria-label={product.name}
      >
        <ProductImage
          product={product}
          width={500}
          className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'opacity-60 grayscale' : ''
          }`}
        />

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1 z-10">
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold tracking-wide text-white bg-zinc-900/90 px-2 py-0.5 rounded">
              Hết hàng
            </span>
          ) : (
            <>
              {product.discount && (
                <span className="text-[11px] font-semibold tracking-wider text-rose-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-xs border border-rose-100">
                  -{product.discount}%
                </span>
              )}
              {product.badge && !product.discount && (
                <span className="text-[11px] font-medium tracking-wide text-zinc-700 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-xs border border-zinc-200">
                  {product.badge}
                </span>
              )}
            </>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-xs mb-1.5 min-w-0">
          <span className="uppercase tracking-wider font-medium text-[11px] text-zinc-400 truncate">
            {product.category}
          </span>
          {isLowStock && (
            <>
              <span aria-hidden="true" className="text-zinc-300">·</span>
              <span className="text-amber-700 whitespace-nowrap">Chỉ còn {product.stock}</span>
            </>
          )}
        </div>

        <Link
          to={`/products/${product.id}`}
          className="text-base font-semibold text-zinc-900 hover:text-zinc-600 transition-colors line-clamp-2 leading-snug mb-2"
        >
          {product.name}
        </Link>

        <div className="mb-3">
          <RatingStars rating={product.rating} reviewsCount={product.reviewsCount} />
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-100 space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-zinc-900 tabular-nums">
              {formatVND(product.price)}
            </span>
            {product.originalPrice && product.discount && (
              <span className="text-xs text-zinc-400 line-through tabular-nums">
                {formatVND(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Always visible: hover-only actions cannot be reached on touch screens */}
          {hasOptions ? (
            <Link
              to={`/products/${product.id}`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border border-zinc-300 text-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Chọn phiên bản
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
