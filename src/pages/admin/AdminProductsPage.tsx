import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../router/RouterContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { FormField } from '../../components/common/FormField';
import { ProductImage } from '../../components/common/ProductImage';
import { usePending } from '../../hooks/usePending';
import { ProductInput } from '../../services/store';
import { isImageUrl, matchesSearch } from '../../services/catalog';
import { fileToProductImage } from '../../utils/image';
import { formatVND } from '../../utils/format';
import { SHOP } from '../../config/shop';
import { IllustrationType, Product } from '../../types';
import { Plus, Search, Edit2, Trash2, Sparkles, Upload, X, PackageSearch, Eye, EyeOff } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'hidden' | 'low' | 'out';
type SortKey = 'newest' | 'name' | 'price-desc' | 'stock-asc' | 'sold-desc';

const ILLUSTRATIONS: { value: IllustrationType; label: string }[] = [
  { value: 'audio', label: 'Tai nghe' },
  { value: 'watch', label: 'Đồng hồ' },
  { value: 'lamp', label: 'Đèn bàn' },
  { value: 'speaker', label: 'Loa' },
  { value: 'keyboard', label: 'Bàn phím' },
  { value: 'hub', label: 'Dock / Sạc' },
  { value: 'desk', label: 'Bàn làm việc' },
  { value: 'camera', label: 'Camera' },
];

const MAX_IMAGES = 6;

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  price: string;
  originalPrice: string;
  stock: string;
  illustrationType: IllustrationType;
  badge: string;
  description: string;
  features: string;
  specs: string;
  colors: string;
  capacities: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
};

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const splitList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

function toForm(product: Product | null, defaultCategory: string): ProductForm {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? defaultCategory,
    price: product ? String(product.price) : '',
    originalPrice: product?.originalPrice ? String(product.originalPrice) : '',
    stock: product ? String(product.stock) : '',
    illustrationType: product?.illustrationType ?? 'audio',
    badge: product?.badge ?? '',
    description: product?.description ?? '',
    features: product?.features.join('\n') ?? '',
    specs: product
      ? Object.entries(product.specs)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : '',
    colors: product?.variants?.colors?.join(', ') ?? '',
    capacities: product?.variants?.capacities?.join(', ') ?? '',
    images: product?.images.filter(isImageUrl) ?? [],
    isFeatured: !!product?.isFeatured,
    isActive: product?.isActive ?? true,
  };
}

function toInput(form: ProductForm, existing: Product | null): ProductInput {
  const specs: Record<string, string> = {};
  for (const line of splitLines(form.specs)) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    specs[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const colors = splitList(form.colors);
  const capacities = splitList(form.capacities);
  // An empty field must fail validation instead of silently becoming 0
  const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

  return {
    name: form.name,
    sku: form.sku,
    category: form.category,
    price: toNumber(form.price),
    originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : undefined,
    stock: toNumber(form.stock),
    illustrationType: form.illustrationType,
    badge: form.badge.trim() || undefined,
    description: form.description,
    features: splitLines(form.features),
    specs,
    images: form.images,
    variants:
      colors.length > 0 || capacities.length > 0
        ? {
            colors: colors.length > 0 ? colors : undefined,
            capacities: capacities.length > 0 ? capacities : undefined,
          }
        : undefined,
    isFeatured: form.isFeatured,
    isBestSeller: existing?.isBestSeller,
    isNew: existing?.isNew,
    isActive: form.isActive,
  };
}

export const AdminProductsPage: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    setProductActive,
    deleteProduct,
    uploadProductImage,
  } = useAppStore();
  const { showToast } = useToast();
  const { queryParams, navigate } = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(() => toForm(null, categories[0]?.name ?? ''));
  const [formError, setFormError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [saving, runSave] = usePending();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const openEditor = (product: Product | null) => {
    setEditing(product);
    setForm(toForm(product, categories[0]?.name ?? ''));
    setFormError('');
    setImageUrl('');
    setIsModalOpen(true);
  };

  // Deep link from the dashboard: /admin/products?edit=<id>
  const editId = queryParams.get('edit');
  useEffect(() => {
    if (!editId) return;
    const target = products.find((p) => p.id === editId);
    if (target) openEditor(target);
    navigate('/admin/products', { replace: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const filteredProducts = useMemo(() => {
    const matching = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (status === 'active' && !p.isActive) return false;
      if (status === 'hidden' && p.isActive) return false;
      if (status === 'out' && p.stock > 0) return false;
      if (status === 'low' && (p.stock === 0 || p.stock > SHOP.lowStockThreshold)) return false;
      return matchesSearch(p, search);
    });

    return matching.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi');
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return a.stock - b.stock;
        case 'sold-desc':
          return (b.soldCount ?? 0) - (a.soldCount ?? 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [products, category, status, search, sort]);

  const setField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const addImage = (url: string) => {
    if (form.images.length >= MAX_IMAGES) {
      setFormError(`Mỗi sản phẩm có tối đa ${MAX_IMAGES} ảnh.`);
      return false;
    }
    if (form.images.includes(url)) {
      setFormError('Ảnh này đã có trong danh sách.');
      return false;
    }
    setField('images', [...form.images, url]);
    return true;
  };

  const handleAddImageUrl = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setFormError('Đường dẫn ảnh cần bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (addImage(url)) setImageUrl('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      // Scaled down in the browser first, then stored by the server
      const photo = await fileToProductImage(file);
      const result = await uploadProductImage(photo);
      if (result.ok) addImage(result.url);
      else setFormError(result.error);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = toInput(form, editing);
    const result = await runSave(() =>
      editing ? updateProduct(editing.id, input) : addProduct(input)
    );
    if (!result) return;
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    showToast(
      editing ? `Đã cập nhật "${input.name.trim()}"` : `Đã thêm sản phẩm "${input.name.trim()}"`
    );
    setIsModalOpen(false);
  };

  const handleToggleActive = async (product: Product) => {
    const result = await setProductActive(product.id, !product.isActive);
    if (!result.ok) showToast(result.error, 'error');
    else {
      showToast(
        product.isActive
          ? `Đã ẩn "${product.name}" khỏi cửa hàng`
          : `"${product.name}" đã hiển thị trên cửa hàng`
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteProduct(deleteTarget.id);
    if (result.ok) showToast(`Đã xóa sản phẩm "${deleteTarget.name}"`);
    else showToast(result.error, 'error');
    setDeleteTarget(null);
  };

  const hasFilters = search.trim() !== '' || category !== 'all' || status !== 'all';
  const selectClass =
    'px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-hidden focus:border-amber-400 cursor-pointer';

  return (
    <AdminLayout title="Sản Phẩm">
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Tìm sản phẩm"
                placeholder="Tìm tên, SKU, danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <select aria-label="Danh mục" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className={selectClass}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="hidden">Đang ẩn</option>
              <option value="low">Sắp hết hàng</option>
              <option value="out">Hết hàng</option>
            </select>

            <select
              aria-label="Sắp xếp"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClass}
            >
              <option value="newest">Mới nhất</option>
              <option value="name">Tên A → Z</option>
              <option value="price-desc">Giá cao nhất</option>
              <option value="stock-asc">Tồn kho thấp nhất</option>
              <option value="sold-desc">Bán chạy nhất</option>
            </select>
          </div>

          <button
            onClick={() => openEditor(null)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Hiển thị <strong className="text-white">{filteredProducts.length}</strong> trên{' '}
          {products.length} sản phẩm
        </p>

        {filteredProducts.length === 0 ? (
          <EmptyState
            tone="dark"
            icon={<PackageSearch className="w-7 h-7" />}
            title={hasFilters ? 'Không có sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
            description={
              hasFilters
                ? 'Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.'
                : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng.'
            }
            action={
              hasFilters ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                    setStatus('all');
                  }}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px] bg-zinc-950/40">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Sản phẩm</th>
                    <th className="py-3.5 px-4 font-semibold">Danh mục</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Giá bán</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Tồn kho</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Đã bán</th>
                    <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 overflow-hidden shrink-0">
                            <ProductImage product={p} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white line-clamp-1">{p.name}</p>
                            <p className="text-xs text-zinc-500 flex items-center gap-2">
                              <span className="font-mono">{p.sku}</span>
                              {p.isFeatured && (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Nổi bật
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{p.category}</td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <p className="font-bold text-white tabular-nums">{formatVND(p.price)}</p>
                        {p.originalPrice && p.discount && (
                          <p className="text-xs text-zinc-500 tabular-nums line-through">
                            {formatVND(p.originalPrice)}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            p.stock === 0
                              ? 'text-rose-400'
                              : p.stock <= SHOP.lowStockThreshold
                              ? 'text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums text-zinc-300">
                        {p.soldCount ?? 0}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${
                            p.isActive
                              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {p.isActive ? 'Đang bán' : 'Đang ẩn'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            aria-label={p.isActive ? `Ẩn ${p.name}` : `Hiển thị ${p.name}`}
                            title={p.isActive ? 'Ẩn khỏi cửa hàng' : 'Hiển thị trên cửa hàng'}
                          >
                            {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditor(p)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            aria-label={`Sửa ${p.name}`}
                            title="Sửa sản phẩm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            aria-label={`Xóa ${p.name}`}
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        size="lg"
        tone="dark"
      >
        <form onSubmit={handleSave} className="space-y-5" noValidate>
          <FormField label="Tên sản phẩm" required tone="dark">
            {(control) => (
              <input
                {...control}
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mã SKU" required tone="dark" hint="Mỗi sản phẩm có một mã riêng.">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  value={form.sku}
                  onChange={(e) => setField('sku', e.target.value.toUpperCase())}
                  placeholder="AUR-HP-01"
                  style={{ fontFamily: 'ui-monospace, monospace' }}
                />
              )}
            </FormField>

            <FormField label="Danh mục" required tone="dark">
              {(control) => (
                <select
                  {...control}
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Giá bán (₫)" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Giá gốc (₫)" tone="dark" hint="Để trống nếu không giảm giá.">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.originalPrice}
                  onChange={(e) => setField('originalPrice', e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Tồn kho" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                />
              )}
            </FormField>
          </div>

          <FormField label="Mô tả sản phẩm" required tone="dark">
            {(control) => (
              <textarea
                {...control}
                rows={3}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Đặc điểm nổi bật" tone="dark" hint="Mỗi dòng một đặc điểm.">
              {(control) => (
                <textarea
                  {...control}
                  rows={4}
                  value={form.features}
                  onChange={(e) => setField('features', e.target.value)}
                />
              )}
            </FormField>

            <FormField
              label="Thông số kỹ thuật"
              tone="dark"
              hint="Mỗi dòng theo dạng  Tên: Giá trị"
            >
              {(control) => (
                <textarea
                  {...control}
                  rows={4}
                  value={form.specs}
                  onChange={(e) => setField('specs', e.target.value)}
                  placeholder={'Pin: 45 giờ\nTrọng lượng: 248g'}
                />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Màu sắc" tone="dark" hint="Phân tách bằng dấu phẩy.">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  value={form.colors}
                  onChange={(e) => setField('colors', e.target.value)}
                  placeholder="Đen, Bạc, Xám"
                />
              )}
            </FormField>

            <FormField label="Kích thước / Cấu hình" tone="dark" hint="Phân tách bằng dấu phẩy.">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  value={form.capacities}
                  onChange={(e) => setField('capacities', e.target.value)}
                />
              )}
            </FormField>
          </div>

          {/* Images */}
          <div>
            <p className="text-xs font-semibold text-zinc-300 mb-1.5">
              Hình ảnh ({form.images.length}/{MAX_IMAGES})
            </p>

            {form.images.length > 0 && (
              <ul className="flex flex-wrap gap-3 mb-3">
                {form.images.map((image, index) => (
                  <li key={image} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
                    <img src={image} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-center text-[10px] font-semibold bg-black/70 text-white py-0.5">
                        Ảnh chính
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setField('images', form.images.filter((i) => i !== image))}
                      aria-label={`Xóa ảnh ${index + 1}`}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                aria-label="Đường dẫn ảnh"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="https://... (đường dẫn ảnh)"
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!imageUrl.trim()}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 disabled:hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Thêm ảnh
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Đang xử lý...' : 'Tải ảnh lên'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Khi chưa có ảnh, cửa hàng hiển thị hình minh họa theo loại sản phẩm bên dưới.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Hình minh họa mặc định" tone="dark">
              {(control) => (
                <select
                  {...control}
                  value={form.illustrationType}
                  onChange={(e) => setField('illustrationType', e.target.value as IllustrationType)}
                >
                  {ILLUSTRATIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField label="Nhãn hiển thị" tone="dark" hint="Ví dụ: Mới ra mắt. Có thể để trống.">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  maxLength={24}
                  value={form.badge}
                  onChange={(e) => setField('badge', e.target.value)}
                />
              )}
            </FormField>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-zinc-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              <span>Hiển thị trên cửa hàng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setField('isFeatured', e.target.checked)}
                className="w-4 h-4 accent-amber-400"
              />
              <span>Sản phẩm nổi bật</span>
            </label>
          </div>

          {formError && (
            <p role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {formError}
            </p>
          )}

          <div className="pt-5 border-t border-zinc-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold rounded-xl text-xs transition-colors"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        tone="dark"
        isOpen={!!deleteTarget}
        title="Xóa sản phẩm?"
        message={
          <>
            Sản phẩm <strong className="text-white">"{deleteTarget?.name}"</strong> và các đánh giá
            của nó sẽ bị xóa vĩnh viễn. Đơn hàng đã đặt vẫn giữ nguyên thông tin. Nếu chỉ muốn tạm
            ngừng bán, hãy ẩn sản phẩm.
          </>
        }
        confirmLabel="Xóa sản phẩm"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
};
