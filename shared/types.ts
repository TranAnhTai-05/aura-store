export type IllustrationType =
  | 'audio'
  | 'watch'
  | 'lamp'
  | 'speaker'
  | 'keyboard'
  | 'hub'
  | 'desk'
  | 'camera';

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number;
  /** Percent off, always derived from price / originalPrice by the store */
  discount?: number;
  /** Average of the product's reviews, derived by the store (0 when there are none) */
  rating: number;
  /** Number of reviews, derived by the store */
  reviewsCount: number;
  /** Units sold in non-cancelled orders, derived by the store */
  soldCount?: number;
  stock: number;
  description: string;
  specs: Record<string, string>;
  features: string[];
  /** Image URLs (http(s), absolute path or data URL). Other values fall back to the illustration */
  images: string[];
  illustrationType: IllustrationType;
  badge?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  variants?: {
    colors?: string[];
    capacities?: string[];
  };
  createdAt: string;
  isActive: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  itemCount: number;
  illustrationType: IllustrationType;
};

/** What is persisted for the cart: a reference to the product, never a copy of it */
export type CartLine = {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedCapacity?: string;
};

/** A cart line together with the product it points to (a snapshot once it is part of an order) */
export type CartItem = CartLine & {
  product: Product;
};

export type CartIssue = 'out_of_stock' | 'insufficient_stock';

/** A cart line resolved against the live catalogue */
export type ResolvedCartItem = CartItem & {
  lineId: string;
  /** Highest quantity this line may have given stock and the other lines of the same product */
  maxQuantity: number;
  issue?: CartIssue;
};

export type OrderStatus =
  | 'pending'     // Chờ xác nhận
  | 'confirmed'   // Đã xác nhận
  | 'processing'  // Đang chuẩn bị
  | 'shipping'    // Đang giao
  | 'delivered'   // Đã giao
  | 'cancelled';  // Đã hủy

/** 'credit_card' is kept for orders placed before card payments were withdrawn */
export type PaymentMethod = 'cod' | 'bank_transfer' | 'credit_card';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type CustomerInfo = {
  name: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  note?: string;
};

export type OrderEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  status: OrderStatus;
  history?: OrderEvent[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  role: 'customer' | 'admin';
  createdAt: string;
  /** Sum of the user's non-cancelled orders, derived by the store */
  totalSpent: number;
  /** Number of the user's non-cancelled orders, derived by the store */
  ordersCount: number;
  isLocked: boolean;
};

export type Review = {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
};

export type PromotionType = 'percent' | 'freeship';

export type Promotion = {
  code: string;
  title: string;
  /** Missing on older data: a promotion without a percentage is a free-shipping one */
  type?: PromotionType;
  discountPercent: number;
  maxDiscount?: number;
  minOrder: number;
  validUntil: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type Subscriber = {
  email: string;
  createdAt: string;
};

/** Outcome of a store action that can be refused */
export type ActionResult<T = {}> =
  | ({ ok: true; message?: string } & T)
  | { ok: false; error: string };
