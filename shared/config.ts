/** Business settings of the shop. Everything that used to be repeated as a literal lives here. */
export const SHOP = {
  name: 'AURA',
  hotline: '1900 8899',
  supportEmail: 'support@aura.vn',
  address: '86 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',

  /** Orders from this subtotal ship for free */
  freeShippingThreshold: 2_000_000,
  shippingFee: 30_000,

  /** Stock at or below this level is flagged as running low */
  lowStockThreshold: 10,

  bank: {
    name: 'Techcombank (Hội sở chính)',
    accountNumber: '1903 8899 7766',
    accountHolder: 'CONG TY TNHH AURA VIETNAM',
  },

  customerSessionDays: 7,
  adminSessionHours: 8,
  adminRememberDays: 7,

  minPasswordLength: 6,
} as const;

/** Suggestions for the province / city field; the field still accepts free text */
export const CITY_SUGGESTIONS = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Huế',
  'Khánh Hòa',
  'Lâm Đồng',
  'Quảng Ninh',
  'Đồng Nai',
  'Nghệ An',
  'Thanh Hóa',
];
