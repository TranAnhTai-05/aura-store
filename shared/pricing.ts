import { SHOP } from './config';
import { Promotion, PromotionType } from './types';
import { formatVND } from './money';

export function calcShippingFee(subtotal: number): number {
  if (subtotal === 0 || subtotal >= SHOP.freeShippingThreshold) return 0;
  return SHOP.shippingFee;
}

export function getPromotionType(promo: Promotion): PromotionType {
  return promo.type ?? (promo.discountPercent > 0 ? 'percent' : 'freeship');
}

export function isPromotionExpired(promo: Promotion, now: Date = new Date()): boolean {
  // A promotion is valid until the end of its last day
  const end = new Date(`${promo.validUntil}T23:59:59`);
  return !Number.isNaN(end.getTime()) && end.getTime() < now.getTime();
}

/** Whether the promotion can be offered to customers at all, regardless of their cart */
export function isPromotionAvailable(promo: Promotion, now: Date = new Date()): boolean {
  return promo.isActive && !isPromotionExpired(promo, now) && promo.usageCount < promo.maxUsage;
}

export function describePromotion(promo: Promotion): string {
  if (getPromotionType(promo) === 'freeship') return 'Miễn phí vận chuyển';
  return promo.maxDiscount
    ? `Giảm ${promo.discountPercent}%, tối đa ${formatVND(promo.maxDiscount)}`
    : `Giảm ${promo.discountPercent}%`;
}

export type CouponEvaluation =
  | { valid: true; discount: number; note?: string }
  | { valid: false; reason: string };

/** Single source of truth for whether a promotion applies to a cart and how much it takes off */
export function evaluateCoupon(
  promo: Promotion,
  subtotal: number,
  shippingFee: number,
  now: Date = new Date()
): CouponEvaluation {
  if (!promo.isActive) return { valid: false, reason: 'Mã giảm giá này đã ngừng áp dụng.' };
  if (isPromotionExpired(promo, now)) return { valid: false, reason: 'Mã giảm giá đã hết hạn.' };
  if (promo.usageCount >= promo.maxUsage) {
    return { valid: false, reason: 'Mã giảm giá đã hết lượt sử dụng.' };
  }
  if (subtotal < promo.minOrder) {
    return {
      valid: false,
      reason: `Đơn hàng cần đạt tối thiểu ${formatVND(promo.minOrder)} để dùng mã ${promo.code}.`,
    };
  }

  if (getPromotionType(promo) === 'freeship') {
    if (shippingFee === 0) {
      return { valid: true, discount: 0, note: 'Đơn hàng này đã được miễn phí vận chuyển.' };
    }
    return { valid: true, discount: Math.min(shippingFee, promo.maxDiscount ?? shippingFee) };
  }

  const raw = Math.round((subtotal * promo.discountPercent) / 100);
  return { valid: true, discount: Math.min(raw, promo.maxDiscount ?? raw, subtotal) };
}

export function calcDiscountPercent(price: number, originalPrice?: number): number | undefined {
  if (!originalPrice || originalPrice <= price) return undefined;
  const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
  return percent > 0 ? percent : undefined;
}
