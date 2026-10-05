import { SHOP } from './config';
import { CustomerInfo, Product, Promotion } from './types';
import { EMAIL_HINT, PHONE_HINT, isValidEmail, isValidPhone } from './validation';

/**
 * Field rules shared by the forms and the API. The client uses them for instant feedback;
 * the server runs them again because it never trusts what it is sent.
 */

export type ProductInput = Omit<
  Product,
  'id' | 'createdAt' | 'slug' | 'rating' | 'reviewsCount' | 'soldCount' | 'discount'
>;

export type PromotionInput = Omit<Promotion, 'usageCount'>;

export type RegisterInput = { name: string; email: string; phone: string; password: string };

export type ProfileInput = {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
};

export type ContactInput = { name: string; email: string; message: string };

export type ReviewInput = { productId: string; rating: number; comment: string };

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < SHOP.minPasswordLength) {
    return `Mật khẩu cần có tối thiểu ${SHOP.minPasswordLength} ký tự.`;
  }
  if (password.length > 72) return 'Mật khẩu không được dài quá 72 ký tự.';
  return null;
}

export function validateRegistration(input: RegisterInput): string | null {
  if (typeof input.name !== 'string' || input.name.trim().length < 2) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (typeof input.email !== 'string' || !isValidEmail(input.email)) return EMAIL_HINT;
  if (typeof input.phone !== 'string' || !isValidPhone(input.phone)) return PHONE_HINT;
  return validatePassword(input.password);
}

export function validateProfile(input: ProfileInput): string | null {
  if (typeof input.name !== 'string' || input.name.trim().length < 2) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (typeof input.phone !== 'string' || !isValidPhone(input.phone)) return PHONE_HINT;
  return null;
}

export function validateCustomerInfo(
  customer: CustomerInfo
): Partial<Record<keyof CustomerInfo, string>> {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const errors: Partial<Record<keyof CustomerInfo, string>> = {};
  if (text(customer.name).length < 2) errors.name = 'Vui lòng nhập họ tên người nhận.';
  if (!text(customer.phone)) errors.phone = 'Vui lòng nhập số điện thoại.';
  else if (!isValidPhone(customer.phone)) errors.phone = PHONE_HINT;
  if (!text(customer.email)) errors.email = 'Vui lòng nhập email liên hệ.';
  else if (!isValidEmail(customer.email)) errors.email = EMAIL_HINT;
  if (!text(customer.city)) errors.city = 'Vui lòng nhập tỉnh / thành phố.';
  if (!text(customer.district)) errors.district = 'Vui lòng nhập quận / huyện.';
  if (!text(customer.ward)) errors.ward = 'Vui lòng nhập phường / xã.';
  if (text(customer.address).length < 5) errors.address = 'Vui lòng nhập số nhà, tên đường.';
  return errors;
}

/** Everything except SKU uniqueness, which only the database can answer */
export function validateProductInput(input: ProductInput): string | null {
  if (typeof input.name !== 'string' || !input.name.trim()) return 'Vui lòng nhập tên sản phẩm.';
  if (typeof input.sku !== 'string' || !input.sku.trim()) return 'Vui lòng nhập mã SKU.';
  if (!input.category) return 'Vui lòng chọn danh mục.';
  if (!Number.isInteger(input.price) || input.price <= 0) {
    return 'Giá bán phải là số nguyên lớn hơn 0.';
  }
  if (input.originalPrice !== undefined && input.originalPrice !== null) {
    if (!Number.isInteger(input.originalPrice) || input.originalPrice <= 0) {
      return 'Giá gốc phải là số nguyên lớn hơn 0, hoặc để trống.';
    }
    if (input.originalPrice < input.price) return 'Giá gốc không được thấp hơn giá bán.';
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return 'Tồn kho phải là số nguyên không âm.';
  }
  if (typeof input.description !== 'string' || !input.description.trim()) {
    return 'Vui lòng nhập mô tả sản phẩm.';
  }
  return null;
}

export function validatePromotionInput(input: PromotionInput): string | null {
  if (typeof input.code !== 'string' || !/^[A-Z0-9]{3,20}$/.test(input.code)) {
    return 'Mã khuyến mãi gồm 3–20 ký tự chữ in hoa hoặc số, không dấu cách.';
  }
  if (typeof input.title !== 'string' || !input.title.trim()) {
    return 'Vui lòng nhập tên chương trình.';
  }
  if (input.type !== 'percent' && input.type !== 'freeship') return 'Loại ưu đãi không hợp lệ.';
  if (input.type === 'percent') {
    if (
      !Number.isInteger(input.discountPercent) ||
      input.discountPercent < 1 ||
      input.discountPercent > 100
    ) {
      return 'Mức giảm phải là số nguyên từ 1 đến 100%.';
    }
  }
  if (
    input.maxDiscount !== undefined &&
    input.maxDiscount !== null &&
    (!Number.isInteger(input.maxDiscount) || input.maxDiscount <= 0)
  ) {
    return 'Mức giảm tối đa phải là số nguyên lớn hơn 0, hoặc để trống.';
  }
  if (!Number.isInteger(input.minOrder) || input.minOrder < 0) {
    return 'Giá trị đơn tối thiểu phải là số nguyên không âm.';
  }
  if (!Number.isInteger(input.maxUsage) || input.maxUsage < 1) {
    return 'Số lượt sử dụng tối đa phải từ 1 trở lên.';
  }
  if (
    typeof input.validUntil !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil) ||
    Number.isNaN(new Date(`${input.validUntil}T00:00:00`).getTime())
  ) {
    return 'Vui lòng chọn ngày hết hạn hợp lệ.';
  }
  return null;
}

export function validateContact(input: ContactInput): string | null {
  if (typeof input.name !== 'string' || input.name.trim().length < 2) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (typeof input.email !== 'string' || !isValidEmail(input.email)) return EMAIL_HINT;
  if (typeof input.message !== 'string' || input.message.trim().length < 10) {
    return 'Nội dung cần có ít nhất 10 ký tự.';
  }
  if (input.message.length > 2000) return 'Nội dung không được dài quá 2000 ký tự.';
  return null;
}

export function validateReview(input: ReviewInput): string | null {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return 'Vui lòng chọn số sao từ 1 đến 5.';
  }
  if (typeof input.comment !== 'string' || input.comment.trim().length < 10) {
    return 'Nhận xét cần có ít nhất 10 ký tự.';
  }
  if (input.comment.length > 1000) return 'Nhận xét không được dài quá 1000 ký tự.';
  return null;
}
