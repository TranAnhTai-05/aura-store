import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { PromotionInput } from '../../services/store';
import { describePromotion, getPromotionType, isPromotionExpired } from '../../services/pricing';
import { formatVND, formatDateOnly } from '../../utils/format';
import { Promotion, PromotionType } from '../../types';
import { Tag, Plus, Edit2, Trash2, Pause, Play } from 'lucide-react';

type PromotionForm = {
  code: string;
  title: string;
  type: PromotionType;
  discountPercent: string;
  maxDiscount: string;
  minOrder: string;
  validUntil: string;
  maxUsage: string;
  isActive: boolean;
};

function toForm(promo: Promotion | null): PromotionForm {
  return {
    code: promo?.code ?? '',
    title: promo?.title ?? '',
    type: promo ? getPromotionType(promo) : 'percent',
    discountPercent: promo && promo.discountPercent > 0 ? String(promo.discountPercent) : '',
    maxDiscount: promo?.maxDiscount ? String(promo.maxDiscount) : '',
    minOrder: promo ? String(promo.minOrder) : '0',
    validUntil: promo?.validUntil ?? '',
    maxUsage: promo ? String(promo.maxUsage) : '100',
    isActive: promo?.isActive ?? true,
  };
}

const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

function toInput(form: PromotionForm): PromotionInput {
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title,
    type: form.type,
    discountPercent: form.type === 'percent' ? toNumber(form.discountPercent) : 0,
    maxDiscount: form.maxDiscount.trim() ? Number(form.maxDiscount) : undefined,
    minOrder: toNumber(form.minOrder),
    validUntil: form.validUntil,
    maxUsage: toNumber(form.maxUsage),
    isActive: form.isActive,
  };
}

function getState(promo: Promotion): { label: string; className: string } {
  if (isPromotionExpired(promo)) {
    return { label: 'Hết hạn', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
  if (promo.usageCount >= promo.maxUsage) {
    return { label: 'Hết lượt', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
  if (!promo.isActive) {
    return { label: 'Tạm dừng', className: 'bg-amber-400/10 text-amber-400 border-amber-400/20' };
  }
  return { label: 'Đang áp dụng', className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' };
}

export const AdminPromotionsPage: React.FC = () => {
  const {
    allPromotions: promotions,
    addPromotion,
    updatePromotion,
    setPromotionActive,
    deletePromotion,
  } = useAppStore();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionForm>(() => toForm(null));
  const [formError, setFormError] = useState('');
  const [saving, runSave] = usePending();
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const openEditor = (promo: Promotion | null) => {
    setEditing(promo);
    setForm(toForm(promo));
    setFormError('');
    setIsModalOpen(true);
  };

  const setField = <K extends keyof PromotionForm>(field: K, value: PromotionForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = toInput(form);
    const result = await runSave(() =>
      editing ? updatePromotion(editing.code, input) : addPromotion(input)
    );
    if (!result) return;
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    showToast(editing ? `Đã cập nhật mã ${editing.code}` : `Đã tạo mã ${input.code}`);
    setIsModalOpen(false);
  };

  const handleToggle = async (promo: Promotion) => {
    const result = await setPromotionActive(promo.code, !promo.isActive);
    if (!result.ok) showToast(result.error, 'error');
    else showToast(promo.isActive ? `Đã tạm dừng mã ${promo.code}` : `Đã kích hoạt mã ${promo.code}`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await deletePromotion(deleteTarget.code);
    if (result.ok) showToast(`Đã xóa mã ${deleteTarget.code}`);
    else showToast(result.error, 'error');
    setDeleteTarget(null);
  };

  return (
    <AdminLayout title="Khuyến Mãi">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-zinc-400">
            Khách hàng nhập mã trong giỏ hàng. Mỗi đơn áp dụng được một mã.
          </p>
          <button
            onClick={() => openEditor(null)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã khuyến mãi</span>
          </button>
        </div>

        {promotions.length === 0 ? (
          <EmptyState
            tone="dark"
            icon={<Tag className="w-7 h-7" />}
            title="Chưa có mã khuyến mãi"
            description="Tạo mã đầu tiên để khách hàng áp dụng khi mua sắm."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {promotions.map((promo) => {
              const state = getState(promo);
              const usage = Math.min(100, (promo.usageCount / promo.maxUsage) * 100);
              return (
                <article
                  key={promo.code}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-base font-extrabold text-amber-400 truncate">
                      {promo.code}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${state.className}`}
                    >
                      {state.label}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white font-sans">{promo.title}</h2>
                    <p className="text-sm text-zinc-300 mt-0.5">{describePromotion(promo)}</p>
                  </div>

                  <dl className="text-xs text-zinc-400 space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <dt>Đơn tối thiểu</dt>
                      <dd className="text-white tabular-nums">{formatVND(promo.minOrder)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Hạn sử dụng</dt>
                      <dd className="text-white tabular-nums">{formatDateOnly(promo.validUntil)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Đã dùng</dt>
                      <dd className="text-white tabular-nums">
                        {promo.usageCount} / {promo.maxUsage}
                      </dd>
                    </div>
                  </dl>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${usage}%` }} />
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggle(promo)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {promo.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {promo.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditor(promo)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        aria-label={`Sửa mã ${promo.code}`}
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(promo)}
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        aria-label={`Xóa mã ${promo.code}`}
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `Sửa mã ${editing.code}` : 'Tạo mã khuyến mãi'}
        tone="dark"
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Mã khuyến mãi"
              required
              tone="dark"
              hint={editing ? 'Mã đã phát hành không thể đổi.' : '3–20 ký tự chữ in hoa hoặc số.'}
            >
              {(control) => (
                <input
                  {...control}
                  type="text"
                  disabled={!!editing}
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="SUMMER10"
                  style={{ fontFamily: 'ui-monospace, monospace' }}
                />
              )}
            </FormField>

            <FormField label="Loại ưu đãi" required tone="dark">
              {(control) => (
                <select
                  {...control}
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value as PromotionType)}
                >
                  <option value="percent">Giảm theo phần trăm</option>
                  <option value="freeship">Miễn phí vận chuyển</option>
                </select>
              )}
            </FormField>
          </div>

          <FormField label="Tên chương trình" required tone="dark">
            {(control) => (
              <input
                {...control}
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Ưu đãi mùa hè"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.type === 'percent' && (
              <FormField label="Mức giảm (%)" required tone="dark">
                {(control) => (
                  <input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setField('discountPercent', e.target.value)}
                  />
                )}
              </FormField>
            )}

            <FormField label="Giảm tối đa (₫)" tone="dark" hint="Để trống nếu không giới hạn.">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.maxDiscount}
                  onChange={(e) => setField('maxDiscount', e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Đơn tối thiểu (₫)" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={form.minOrder}
                  onChange={(e) => setField('minOrder', e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Số lượt sử dụng tối đa" required tone="dark">
              {(control) => (
                <input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.maxUsage}
                  onChange={(e) => setField('maxUsage', e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Hạn sử dụng" required tone="dark" hint="Mã có hiệu lực đến hết ngày này.">
              {(control) => (
                <input
                  {...control}
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setField('validUntil', e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              )}
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span>Cho phép khách hàng sử dụng mã này</span>
          </label>

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
              disabled={saving}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold rounded-xl text-xs transition-colors"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        tone="dark"
        isOpen={!!deleteTarget}
        title={`Xóa mã ${deleteTarget?.code ?? ''}?`}
        message="Khách hàng sẽ không thể dùng mã này nữa. Các đơn hàng đã áp dụng mã vẫn giữ nguyên mức giảm. Nếu chỉ muốn ngừng tạm thời, hãy dùng Tạm dừng."
        confirmLabel="Xóa mã"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
};
