import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { ProductImage } from '../common/ProductImage';
import { searchProducts } from '../../services/catalog';
import { formatVND } from '../../utils/format';
import { Search, X, ArrowRight, SearchX } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 6;

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { activeProducts, categories } = useAppStore();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const results = useMemo(() => searchProducts(activeProducts, query), [activeProducts, query]);
  const visible = results.slice(0, MAX_RESULTS);

  useEffect(() => setHighlighted(0), [query]);

  if (!isOpen) return null;

  const trimmed = query.trim();

  const openProduct = (id: string) => {
    onClose();
    navigate(`/products/${id}`);
  };

  const openAllResults = () => {
    if (!trimmed) return;
    onClose();
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter opens the highlighted product once the arrows were used, else the full result list
      if (highlighted > 0 && visible[highlighted]) openProduct(visible[highlighted].id);
      else openAllResults();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-20"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm sản phẩm"
      onKeyDown={handleKeyDown}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs aura-fade-in" onClick={onClose} />

      <div className="relative mx-auto max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden aura-rise-in">
        <div className="relative flex items-center px-4 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Tìm theo tên, danh mục hoặc mã SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Xóa từ khóa"
              className="p-2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 text-xs text-zinc-500 hover:text-zinc-800 font-medium px-2.5 py-1.5 bg-zinc-100 rounded-md shrink-0"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {!trimmed ? (
            <div className="py-4 px-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Duyệt theo danh mục
              </p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.itemCount > 0)
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onClose();
                        navigate(`/products?category=${encodeURIComponent(category.name)}`);
                      }}
                      className="text-xs px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <SearchX className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-700 font-semibold">
                Không tìm thấy sản phẩm cho "{trimmed}"
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Hãy thử từ khóa ngắn hơn, ví dụ "loa", "tai nghe" hoặc "đèn".
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-2 pb-2">
                <span>Tìm thấy {results.length} sản phẩm</span>
                <button
                  onClick={openAllResults}
                  className="flex items-center gap-1 text-zinc-700 hover:text-zinc-950 font-medium"
                >
                  Xem tất cả kết quả <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {visible.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => openProduct(product.id)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors border ${
                    index === highlighted
                      ? 'bg-zinc-50 border-zinc-200'
                      : 'border-transparent hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                    <ProductImage product={product} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{product.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {product.category} · {product.sku}
                      {product.stock <= 0 && <span className="text-rose-600"> · Hết hàng</span>}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 tabular-nums shrink-0">
                    {formatVND(product.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
