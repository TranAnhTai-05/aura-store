import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { Link, useRouter } from '../../router/RouterContext';
import { ProductCard } from '../../components/common/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  DEFAULT_FILTERS,
  PRICE_RANGES,
  ProductFilters,
  RATING_OPTIONS,
  SORT_OPTIONS,
  SortOption,
  filterProducts,
} from '../../services/catalog';
import { Category, Product } from '../../types';
import { Search, SlidersHorizontal, X, RotateCcw, SearchX } from 'lucide-react';

const PAGE_SIZE = 12;

interface FilterPanelProps {
  idPrefix: string;
  filters: ProductFilters;
  categories: Category[];
  products: Product[];
  onChange: (patch: Partial<ProductFilters>) => void;
}

/** The filter controls, shared by the desktop sidebar and the mobile drawer */
const FilterPanel: React.FC<FilterPanelProps> = ({ idPrefix, filters, categories, products, onChange }) => {
  const categoryButton = (isSelected: boolean) =>
    `w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
      isSelected ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:bg-zinc-100'
    }`;

  return (
    <div className="space-y-7">
      <div>
        <label
          htmlFor={`${idPrefix}-search`}
          className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2"
        >
          Tìm kiếm
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={`${idPrefix}-search`}
            type="search"
            placeholder="Tên, danh mục, mã SKU..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              aria-label="Xóa từ khóa"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Danh mục</p>
        <div className="space-y-1">
          <button
            onClick={() => onChange({ category: 'all' })}
            aria-pressed={filters.category === 'all'}
            className={categoryButton(filters.category === 'all')}
          >
            <span>Tất cả danh mục</span>
            <span className="text-xs opacity-70 tabular-nums">{products.length}</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ category: cat.name })}
              aria-pressed={filters.category === cat.name}
              className={categoryButton(filters.category === cat.name)}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs opacity-70 tabular-nums">{cat.itemCount}</span>
            </button>
          ))}
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Mức giá</legend>
        <div className="space-y-1">
          {[{ id: 'all', label: 'Tất cả mức giá' }, ...PRICE_RANGES].map((range) => (
            <label
              key={range.id}
              className="flex items-center gap-2.5 py-1.5 text-sm text-zinc-700 cursor-pointer"
            >
              <input
                type="radio"
                name={`${idPrefix}-price`}
                checked={filters.price === range.id}
                onChange={() => onChange({ price: range.id })}
                className="w-4 h-4 accent-zinc-900"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Đánh giá</legend>
        <div className="space-y-1">
          {[{ value: 0, label: 'Tất cả' }, ...RATING_OPTIONS].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2.5 py-1.5 text-sm text-zinc-700 cursor-pointer"
            >
              <input
                type="radio"
                name={`${idPrefix}-rating`}
                checked={filters.minRating === option.value}
                onChange={() => onChange({ minRating: option.value })}
                className="w-4 h-4 accent-zinc-900"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => onChange({ inStockOnly: e.target.checked })}
          className="w-4 h-4 accent-zinc-900 rounded"
        />
        <span>Chỉ hiện sản phẩm còn hàng</span>
      </label>
    </div>
  );
};

export const ProductsPage: React.FC = () => {
  const { activeProducts, categories } = useAppStore();
  const { queryParams, navigate } = useRouter();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // The address bar is the single source of truth, so filtered views can be shared and
  // links such as the footer categories work even when this page is already open.
  const filters = useMemo<ProductFilters>(() => {
    const category = queryParams.get('category') ?? 'all';
    const price = queryParams.get('price') ?? 'all';
    const sort = queryParams.get('sort') as SortOption | null;
    const rating = Number(queryParams.get('rating'));
    return {
      search: queryParams.get('search') ?? '',
      category: categories.some((c) => c.name === category) ? category : 'all',
      price: PRICE_RANGES.some((r) => r.id === price) ? price : 'all',
      minRating: RATING_OPTIONS.some((o) => o.value === rating) ? rating : 0,
      inStockOnly: queryParams.get('stock') === '1',
      sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : DEFAULT_FILTERS.sort,
    };
  }, [queryParams, categories]);

  const updateFilters = (patch: Partial<ProductFilters>) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.search.trim()) params.set('search', next.search);
    if (next.category !== 'all') params.set('category', next.category);
    if (next.price !== 'all') params.set('price', next.price);
    if (next.minRating > 0) params.set('rating', String(next.minRating));
    if (next.inStockOnly) params.set('stock', '1');
    if (next.sort !== DEFAULT_FILTERS.sort) params.set('sort', next.sort);
    const query = params.toString();
    navigate(query ? `/products?${query}` : '/products', { replace: true, scroll: false });
  };

  const resetFilters = () => updateFilters({ ...DEFAULT_FILTERS, sort: filters.sort });

  const filteredProducts = useMemo(
    () => filterProducts(activeProducts, filters),
    [activeProducts, filters]
  );

  useEffect(() => setVisibleCount(PAGE_SIZE), [filters]);

  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileFilterOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileFilterOpen]);

  const activeChips: { label: string; clear: Partial<ProductFilters> }[] = [];
  if (filters.search.trim()) activeChips.push({ label: `"${filters.search.trim()}"`, clear: { search: '' } });
  if (filters.category !== 'all') activeChips.push({ label: filters.category, clear: { category: 'all' } });
  if (filters.price !== 'all') {
    const range = PRICE_RANGES.find((r) => r.id === filters.price);
    if (range) activeChips.push({ label: range.label, clear: { price: 'all' } });
  }
  if (filters.minRating > 0) {
    activeChips.push({ label: `Từ ${filters.minRating} sao`, clear: { minRating: 0 } });
  }
  if (filters.inStockOnly) activeChips.push({ label: 'Còn hàng', clear: { inStockOnly: false } });

  const panelProps = { filters, categories, products: activeProducts, onChange: updateFilters };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-xs text-zinc-400 mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-zinc-700">Trang chủ</Link>
            <span className="mx-1.5">/</span>
            <span className="text-zinc-700 font-medium">Sản phẩm</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-950 font-display">
                {filters.category === 'all' ? 'Tất Cả Sản Phẩm' : filters.category}
              </h1>
              <p className="text-sm text-zinc-500 mt-1" aria-live="polite">
                {filteredProducts.length === activeProducts.length
                  ? `${activeProducts.length} sản phẩm`
                  : `${filteredProducts.length} trên ${activeProducts.length} sản phẩm`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
                <span>Bộ lọc</span>
                {activeChips.length > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-zinc-900 text-white text-[11px] flex items-center justify-center tabular-nums">
                    {activeChips.length}
                  </span>
                )}
              </button>

              <label className="flex-1 sm:flex-none flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-xs">
                <span className="text-xs text-zinc-500 whitespace-nowrap">Sắp xếp</span>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
                  className="flex-1 min-w-0 text-sm font-semibold text-zinc-900 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => updateFilters(chip.clear)}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  <span className="max-w-[180px] truncate">{chip.label}</span>
                  <X className="w-3.5 h-3.5 text-zinc-400" aria-label="Bỏ bộ lọc" />
                </button>
              ))}
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <FilterPanel idPrefix="desktop" {...panelProps} />
            </div>
          </aside>

          <section className="lg:col-span-3" aria-label="Danh sách sản phẩm">
            {activeProducts.length === 0 ? (
              <EmptyState
                icon={<SearchX className="w-7 h-7" />}
                title="Cửa hàng chưa có sản phẩm"
                description="Các sản phẩm mới sẽ sớm được cập nhật. Vui lòng quay lại sau."
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={<SearchX className="w-7 h-7" />}
                title="Không tìm thấy sản phẩm phù hợp"
                description="Hãy thử từ khóa khác hoặc nới lỏng bộ lọc danh mục, mức giá và đánh giá."
                action={
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {filteredProducts.slice(0, visibleCount).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {filteredProducts.length > visibleCount && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="px-8 py-3 bg-white border border-zinc-300 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      Xem thêm {Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} sản phẩm
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc sản phẩm">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs aura-fade-in"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col aura-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <span className="text-base font-bold text-zinc-900 font-display">Bộ lọc sản phẩm</span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Đóng bộ lọc"
                className="p-2 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel idPrefix="mobile" {...panelProps} />
            </div>

            <div className="p-4 border-t border-zinc-100 flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
              >
                Xem {filteredProducts.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
