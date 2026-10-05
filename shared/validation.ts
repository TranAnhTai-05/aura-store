const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Vietnamese mobile numbers: 10 digits starting with 03, 05, 07, 08 or 09 (or +84 / 84) */
const PHONE_PATTERN = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Strips the separators people type in phone numbers: spaces, dots, dashes, brackets */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.\-()]/g, '');
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}

export const PHONE_HINT = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
export const EMAIL_HINT = 'Địa chỉ email không hợp lệ.';

/** Lowercases and removes Vietnamese diacritics so "den ban" matches "Đèn bàn" */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
