import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionResult,
  CartLine,
  Category,
  ContactMessage,
  CustomerInfo,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Promotion,
  ResolvedCartItem,
  Review,
  Subscriber,
  User,
} from '../types';
import { api, ApiResult } from './api';
import { removeRetiredStorage, usePersistentState } from './storage';
import { getLineId } from './catalog';
import { calcShippingFee, evaluateCoupon } from './pricing';
import {
  ContactInput,
  ProductInput,
  ProfileInput,
  PromotionInput,
  RegisterInput,
  ReviewInput,
} from '../../shared/validators';

export type { ProductInput, PromotionInput };
export { validateCustomerInfo } from '../../shared/validators';

removeRetiredStorage();

type LoadStatus = 'loading' | 'ready' | 'error';

type Catalog = {
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  reviews: Review[];
};

type AdminData = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  promotions: Promotion[];
  messages: ContactMessage[];
  subscribers: Subscriber[];
};

const EMPTY_CATALOG: Catalog = { products: [], categories: [], promotions: [], reviews: [] };
const EMPTY_ADMIN: AdminData = {
  products: [],
  categories: [],
  orders: [],
  users: [],
  promotions: [],
  messages: [],
  subscribers: [],
};

/** How often open pages ask the server for changes made elsewhere */
const REFRESH_INTERVAL_MS = 30_000;
const MIN_REFRESH_GAP_MS = 5_000;
/** Cart changes are saved to the account once the customer stops clicking */
const CART_SAVE_DELAY_MS = 500;

const GUEST = 'guest';

const fail = (error: string) => ({ ok: false as const, error });

/** Turns the server's answer into what the pages expect, keeping only the listed fields */
function toAction<T extends object>(result: ApiResult<T>): ActionResult<T> {
  if (!result.ok) return fail(result.error);
  const { ok: _ok, ...data } = result;
  return { ok: true, ...(data as T) };
}

/** Adds up two carts, line by line */
function mergeCarts(a: CartLine[], b: CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>();
  for (const line of [...a, ...b]) {
    const key = getLineId(line);
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line);
  }
  return [...merged.values()];
}

/**
 * A state setter that ignores values equal to the current one. The pages refresh in the
 * background; without this, every refresh would re-render them even when nothing changed.
 */
function useStableSetter<T>(setState: (value: T) => void) {
  const last = useRef<string | null>(null);
  return useCallback(
    (value: T) => {
      const serialized = JSON.stringify(value);
      if (serialized === last.current) return;
      last.current = serialized;
      setState(value);
    },
    [setState]
  );
}

/** Calls `refresh` every half minute and whenever the tab is looked at again */
function useLiveRefresh(enabled: boolean, refresh: () => void) {
  const latest = useRef(refresh);
  latest.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    // Opening a page fires "focus" right after the first load; that is not worth a reload
    let lastRun = Date.now();
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRun < MIN_REFRESH_GAP_MS) return;
      lastRun = Date.now();
      latest.current();
    };
    const timer = window.setInterval(tick, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [enabled]);
}

export const useStore = () => {
  // What the server knows
  const [catalog, setCatalog] = useState<Catalog>(EMPTY_CATALOG);
  const [catalogStatus, setCatalogStatus] = useState<LoadStatus>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isSessionKnown, setIsSessionKnown] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [adminData, setAdminData] = useState<AdminData>(EMPTY_ADMIN);
  const [adminStatus, setAdminStatus] = useState<LoadStatus>('loading');

  const applyCatalog = useStableSetter(setCatalog);
  const applyOrders = useStableSetter(setCustomerOrders);
  const applyAdminData = useStableSetter(setAdminData);
  const applyCurrentUser = useStableSetter(setCurrentUser);
  const applyAdminUser = useStableSetter(setAdminUser);

  // What belongs to this browser
  const [cartLines, setCartLines] = usePersistentState<CartLine[]>('aura_cart', []);
  const [cartOwner, setCartOwner] = usePersistentState<string>('aura_cart_owner', GUEST);
  const [couponCode, setCouponCode] = usePersistentState<string | null>('aura_coupon_code', null);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  const refreshCatalog = useCallback(async () => {
    const result = await api.get<Catalog>('/api/catalog');
    if (result.ok) {
      applyCatalog({
        products: result.products,
        categories: result.categories,
        promotions: result.promotions,
        reviews: result.reviews,
      });
      setCatalogStatus('ready');
    } else {
      // A failed refresh keeps showing what was loaded before
      setCatalogStatus((status) => (status === 'ready' ? 'ready' : 'error'));
    }
    return result.ok;
  }, [applyCatalog]);

  const retryCatalog = useCallback(() => {
    setCatalogStatus('loading');
    return refreshCatalog();
  }, [refreshCatalog]);

  const refreshSession = useCallback(async () => {
    const [customer, admin] = await Promise.all([
      api.get<{ user: User | null }>('/api/auth/me'),
      api.get<{ user: User | null }>('/api/admin/auth/me'),
    ]);
    // When the server cannot be reached, nobody is signed out because of it
    if (customer.ok) applyCurrentUser(customer.user);
    if (admin.ok) applyAdminUser(admin.user);
    setIsSessionKnown(true);
  }, [applyCurrentUser, applyAdminUser]);

  const refreshOrders = useCallback(async () => {
    const result = await api.get<{ orders: Order[] }>('/api/orders');
    if (result.ok) applyOrders(result.orders);
    else if (result.status === 401) applyCurrentUser(null);
  }, [applyOrders, applyCurrentUser]);

  const refreshAdmin = useCallback(async () => {
    const result = await api.get<AdminData>('/api/admin/overview');
    if (result.ok) {
      const { ok: _ok, ...data } = result;
      applyAdminData(data);
      setAdminStatus('ready');
    } else if (result.status === 401 || result.status === 403) {
      applyAdminUser(null);
    } else {
      setAdminStatus((status) => (status === 'ready' ? 'ready' : 'error'));
    }
    return result.ok;
  }, [applyAdminData, applyAdminUser]);

  const retryAdmin = useCallback(() => {
    setAdminStatus('loading');
    return refreshAdmin();
  }, [refreshAdmin]);

  useEffect(() => {
    refreshCatalog();
    refreshSession();
  }, [refreshCatalog, refreshSession]);

  const customerId = currentUser?.id ?? null;
  const adminId = adminUser?.id ?? null;

  useEffect(() => {
    if (customerId) refreshOrders();
    else applyOrders([]);
  }, [customerId, refreshOrders]);

  useEffect(() => {
    if (adminId) {
      setAdminStatus('loading');
      refreshAdmin();
    } else {
      applyAdminData(EMPTY_ADMIN);
    }
  }, [adminId, refreshAdmin]);

  useLiveRefresh(true, () => {
    refreshCatalog();
    refreshSession();
  });
  useLiveRefresh(!!customerId, refreshOrders);
  useLiveRefresh(!!adminId, refreshAdmin);

  // ---------------------------------------------------------------------------
  // The cart follows the account
  // ---------------------------------------------------------------------------

  const cartLinesRef = useRef(cartLines);
  cartLinesRef.current = cartLines;
  /** The account whose cart on the server matches this browser's cart */
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setSyncedFor(null);
      return;
    }
    let cancelled = false;

    (async () => {
      const saved = await api.get<{ lines: CartLine[] }>('/api/cart');
      if (cancelled || !saved.ok) return;

      // A visitor's cart is added to the account's cart when they sign in. A cart that
      // already belongs to this account is a copy of the server's, and is not added again.
      const local = cartLinesRef.current;
      const next = cartOwner === customerId ? local : mergeCarts(saved.lines, local);
      setCartLines(next);
      setCartOwner(customerId);
      setSyncedFor(customerId);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    if (!customerId || syncedFor !== customerId) return;
    const timer = window.setTimeout(() => {
      api.put('/api/cart', { lines: cartLines });
    }, CART_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [cartLines, customerId, syncedFor]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const activeProducts = catalog.products;

  const cart = useMemo<ResolvedCartItem[]>(() => {
    const quantityByProduct = new Map<string, number>();
    for (const line of cartLines) {
      quantityByProduct.set(
        line.productId,
        (quantityByProduct.get(line.productId) ?? 0) + line.quantity
      );
    }

    const resolved: ResolvedCartItem[] = [];
    for (const line of cartLines) {
      const product = activeProducts.find((p) => p.id === line.productId);
      if (!product) continue; // no longer sold; reported through unavailableCartCount
      const otherLines = (quantityByProduct.get(line.productId) ?? 0) - line.quantity;
      const maxQuantity = Math.max(0, product.stock - otherLines);
      resolved.push({
        ...line,
        product,
        lineId: getLineId(line),
        maxQuantity,
        issue:
          product.stock <= 0
            ? 'out_of_stock'
            : line.quantity > maxQuantity
            ? 'insufficient_stock'
            : undefined,
      });
    }
    return resolved;
  }, [cartLines, activeProducts]);

  const isCatalogReady = catalogStatus === 'ready';
  /** Lines whose product was removed or hidden after it was added to the cart */
  const unavailableCartCount = isCatalogReady ? cartLines.length - cart.length : 0;
  const hasCartIssues = cart.some((item) => item.issue);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = calcShippingFee(cartSubtotal);

  const appliedCoupon = couponCode
    ? catalog.promotions.find((p) => p.code === couponCode) ?? null
    : null;
  const couponEvaluation =
    appliedCoupon && cart.length > 0
      ? evaluateCoupon(appliedCoupon, cartSubtotal, shippingFee)
      : null;
  const isCouponValid = !!couponEvaluation?.valid;
  const discountAmount = couponEvaluation?.valid ? couponEvaluation.discount : 0;
  /** Why the applied coupon gives no discount, or a remark about it */
  const couponMessage = couponEvaluation
    ? couponEvaluation.valid
      ? couponEvaluation.note
      : couponEvaluation.reason
    : couponCode && isCatalogReady && !appliedCoupon
    ? 'Mã giảm giá này không còn được áp dụng.'
    : undefined;
  /** The code the customer entered, even when it has since been withdrawn */
  const enteredCouponCode = couponCode;

  const grandTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);

  // ---------------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------------

  const addToCart = (
    product: Pick<Product, 'id'>,
    quantity = 1,
    color?: string,
    capacity?: string
  ): ActionResult<{ added: number; capped: boolean }> => {
    const live = activeProducts.find((p) => p.id === product.id);
    if (!live) return fail('Sản phẩm này hiện không còn được bán.');
    if (live.stock <= 0) return fail('Sản phẩm đã hết hàng.');

    const colors = live.variants?.colors ?? [];
    const capacities = live.variants?.capacities ?? [];
    const line: CartLine = {
      productId: live.id,
      quantity: 0,
      selectedColor: color && colors.includes(color) ? color : colors[0],
      selectedCapacity: capacity && capacities.includes(capacity) ? capacity : capacities[0],
    };

    const inCart = cartLinesRef.current
      .filter((l) => l.productId === live.id)
      .reduce((sum, l) => sum + l.quantity, 0);
    const room = live.stock - inCart;
    if (room <= 0) {
      return fail(`Giỏ hàng đã có toàn bộ ${live.stock} sản phẩm còn lại trong kho.`);
    }

    const wanted = Math.max(1, Math.floor(quantity));
    const added = Math.min(wanted, room);
    const lineId = getLineId(line);

    const next = cartLinesRef.current.some((l) => getLineId(l) === lineId)
      ? cartLinesRef.current.map((l) =>
          getLineId(l) === lineId ? { ...l, quantity: l.quantity + added } : l
        )
      : [...cartLinesRef.current, { ...line, quantity: added }];
    // Kept up to date at once, so that several additions in a row see each other
    cartLinesRef.current = next;
    setCartLines(next);

    return { ok: true, added, capped: added < wanted };
  };

  const removeFromCart = (lineId: string) => {
    setCartLines((prev) => prev.filter((l) => getLineId(l) !== lineId));
  };

  const updateCartQuantity = (
    lineId: string,
    quantity: number
  ): ActionResult<{ quantity: number; capped: boolean }> => {
    const item = cart.find((i) => i.lineId === lineId);
    if (!item) return fail('Sản phẩm không còn trong giỏ hàng.');

    const wanted = Math.floor(quantity);
    if (wanted <= 0) {
      removeFromCart(lineId);
      return { ok: true, quantity: 0, capped: false };
    }
    if (item.maxQuantity <= 0) return fail('Sản phẩm đã hết hàng.');

    const next = Math.min(wanted, item.maxQuantity);
    setCartLines((prev) =>
      prev.map((l) => (getLineId(l) === lineId ? { ...l, quantity: next } : l))
    );
    return { ok: true, quantity: next, capped: next < wanted };
  };

  const clearCart = () => {
    setCartLines([]);
    setCouponCode(null);
  };

  const applyCoupon = (code: string): ActionResult => {
    const wanted = code.trim().toUpperCase();
    if (!wanted) return fail('Vui lòng nhập mã giảm giá.');
    const promo = catalog.promotions.find((p) => p.code.toUpperCase() === wanted);
    if (!promo) return fail('Mã giảm giá không tồn tại hoặc đã ngừng áp dụng.');

    const evaluation = evaluateCoupon(promo, cartSubtotal, shippingFee);
    if (!evaluation.valid) return fail(evaluation.reason);

    setCouponCode(promo.code);
    return { ok: true, message: evaluation.note ?? `Đã áp dụng mã ${promo.code}.` };
  };

  const removeCoupon = () => setCouponCode(null);

  // ---------------------------------------------------------------------------
  // Customer account
  // ---------------------------------------------------------------------------

  /** Runs a request that needs a customer session, and notices when the session has ended */
  const asCustomer = async <T extends object>(
    request: Promise<ApiResult<T>>
  ): Promise<ActionResult<T>> => {
    const result = await request;
    if (!result.ok && result.status === 401) applyCurrentUser(null);
    return toAction(result);
  };

  const loginCustomer = async (
    email: string,
    password: string
  ): Promise<ActionResult<{ user: User }>> => {
    const result = await api.post<{ user: User }>('/api/auth/login', { email, password });
    if (result.ok) applyCurrentUser(result.user);
    return toAction(result);
  };

  const registerCustomer = async (
    input: RegisterInput
  ): Promise<ActionResult<{ user: User }>> => {
    const result = await api.post<{ user: User }>('/api/auth/register', input);
    if (result.ok) applyCurrentUser(result.user);
    return toAction(result);
  };

  const logoutCustomer = async () => {
    await api.post('/api/auth/logout');
    applyCurrentUser(null);
    // The cart stays with the account; this browser starts over as a visitor
    setCartLines([]);
    setCartOwner(GUEST);
    setCouponCode(null);
    try {
      sessionStorage.removeItem('aura_checkout_draft');
    } catch {
      // ignore
    }
  };

  const updateProfile = async (input: ProfileInput): Promise<ActionResult> => {
    const result = await asCustomer(api.put<{ user: User }>('/api/auth/profile', input));
    if (result.ok) applyCurrentUser(result.user);
    return result.ok ? { ok: true } : result;
  };

  const changePassword = (currentPassword: string, newPassword: string) =>
    asCustomer(api.put('/api/auth/password', { currentPassword, newPassword }));

  const placeOrder = async (
    customer: CustomerInfo,
    paymentMethod: PaymentMethod
  ): Promise<ActionResult<{ order: Order }>> => {
    if (cart.length === 0) return fail('Giỏ hàng đang trống.');

    const result = await asCustomer(
      api.post<{ order: Order }>('/api/orders', {
        customer,
        paymentMethod,
        // Only what was chosen is sent; prices and totals are worked out by the server
        lines: cart.map(({ productId, quantity, selectedColor, selectedCapacity }) => ({
          productId,
          quantity,
          selectedColor,
          selectedCapacity,
        })),
        couponCode: isCouponValid ? appliedCoupon?.code : undefined,
      })
    );

    if (result.ok) {
      clearCart();
      refreshOrders();
    }
    // Either way the stock shown may be out of date by now
    refreshCatalog();
    return result;
  };

  const cancelOrder = async (orderId: string): Promise<ActionResult> => {
    const result = await asCustomer(
      api.post<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/cancel`)
    );
    if (result.ok) {
      refreshOrders();
      refreshCatalog();
    } else {
      refreshOrders();
    }
    return result.ok ? { ok: true } : result;
  };

  const hasPurchased = (productId: string): boolean =>
    customerOrders.some(
      (o) => o.status === 'delivered' && o.items.some((i) => i.productId === productId)
    );

  const addReview = async (input: ReviewInput): Promise<ActionResult> => {
    const result = await asCustomer(api.post('/api/reviews', input));
    if (result.ok) await refreshCatalog();
    return result;
  };

  const submitContactMessage = async (input: ContactInput): Promise<ActionResult> =>
    toAction(await api.post<{}>('/api/contact', input));

  const subscribeNewsletter = async (email: string): Promise<ActionResult> =>
    toAction(await api.post<{}>('/api/newsletter', { email }));

  // ---------------------------------------------------------------------------
  // Administration
  // ---------------------------------------------------------------------------

  /** Runs an admin request, then reloads what the admin area and the storefront show */
  const asAdmin = async <T extends object>(
    request: Promise<ApiResult<T>>
  ): Promise<ActionResult<T>> => {
    const result = await request;
    if (!result.ok && (result.status === 401 || result.status === 403)) {
      applyAdminUser(null);
      return fail('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.');
    }
    await Promise.all([refreshAdmin(), refreshCatalog()]);
    return toAction(result);
  };

  const loginAdmin = async (
    email: string,
    password: string,
    remember: boolean
  ): Promise<ActionResult> => {
    const result = await api.post<{ user: User }>('/api/admin/auth/login', {
      email,
      password,
      remember,
    });
    if (result.ok) applyAdminUser(result.user);
    return result.ok ? { ok: true } : fail(result.error);
  };

  const logoutAdmin = async () => {
    await api.post('/api/admin/auth/logout');
    applyAdminUser(null);
  };

  const changeAdminPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<ActionResult> => {
    const result = await api.put('/api/admin/auth/password', { currentPassword, newPassword });
    if (!result.ok && result.status === 401) applyAdminUser(null);
    return toAction(result);
  };

  const id = encodeURIComponent;

  const updateOrderStatus = (orderId: string, status: OrderStatus): Promise<ActionResult> =>
    asAdmin(api.patch(`/api/admin/orders/${id(orderId)}/status`, { status }));

  const confirmPayment = (orderId: string): Promise<ActionResult> =>
    asAdmin(api.post(`/api/admin/orders/${id(orderId)}/confirm-payment`));

  const addProduct = (input: ProductInput): Promise<ActionResult> =>
    asAdmin(api.post('/api/admin/products', input));

  const updateProduct = (productId: string, input: ProductInput): Promise<ActionResult> =>
    asAdmin(api.put(`/api/admin/products/${id(productId)}`, input));

  const setProductActive = (productId: string, isActive: boolean): Promise<ActionResult> =>
    asAdmin(api.patch(`/api/admin/products/${id(productId)}/active`, { isActive }));

  const deleteProduct = (productId: string): Promise<ActionResult> =>
    asAdmin(api.delete(`/api/admin/products/${id(productId)}`));

  const uploadProductImage = async (file: Blob): Promise<ActionResult<{ url: string }>> => {
    const form = new FormData();
    form.append('image', file, 'photo.jpg');
    const result = await api.post<{ url: string }>('/api/admin/uploads', form);
    if (!result.ok && (result.status === 401 || result.status === 403)) applyAdminUser(null);
    return toAction(result);
  };

  const setUserLocked = (userId: string, isLocked: boolean): Promise<ActionResult> =>
    asAdmin(api.patch(`/api/admin/users/${id(userId)}/lock`, { isLocked }));

  const addPromotion = (input: PromotionInput): Promise<ActionResult> =>
    asAdmin(api.post('/api/admin/promotions', input));

  const updatePromotion = (code: string, input: PromotionInput): Promise<ActionResult> =>
    asAdmin(api.put(`/api/admin/promotions/${id(code)}`, input));

  const setPromotionActive = (code: string, isActive: boolean): Promise<ActionResult> =>
    asAdmin(api.patch(`/api/admin/promotions/${id(code)}/active`, { isActive }));

  const deletePromotion = (code: string): Promise<ActionResult> =>
    asAdmin(api.delete(`/api/admin/promotions/${id(code)}`));

  const setMessageRead = (messageId: string, isRead: boolean): Promise<ActionResult> =>
    asAdmin(api.patch(`/api/admin/messages/${id(messageId)}/read`, { isRead }));

  const deleteMessage = (messageId: string): Promise<ActionResult> =>
    asAdmin(api.delete(`/api/admin/messages/${id(messageId)}`));

  const removeSubscriber = (email: string): Promise<ActionResult> =>
    asAdmin(api.delete(`/api/admin/subscribers/${id(email)}`));

  return {
    // Loading
    catalogStatus,
    retryCatalog,
    isSessionKnown,
    adminStatus,
    retryAdmin,
    // Storefront catalogue
    activeProducts,
    categories: catalog.categories,
    reviews: catalog.reviews,
    promotions: catalog.promotions,
    // Cart
    cart,
    cartSubtotal,
    cartTotalItems,
    shippingFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    enteredCouponCode,
    isCouponValid,
    couponMessage,
    hasCartIssues,
    unavailableCartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    // Customer
    currentUser,
    customerOrders,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    updateProfile,
    changePassword,
    placeOrder,
    cancelOrder,
    hasPurchased,
    addReview,
    submitContactMessage,
    subscribeNewsletter,
    // Admin
    adminUser,
    products: adminData.products,
    orders: adminData.orders,
    users: adminData.users,
    allPromotions: adminData.promotions,
    messages: adminData.messages,
    subscribers: adminData.subscribers,
    loginAdmin,
    logoutAdmin,
    changeAdminPassword,
    updateOrderStatus,
    confirmPayment,
    addProduct,
    updateProduct,
    setProductActive,
    deleteProduct,
    uploadProductImage,
    setUserLocked,
    addPromotion,
    updatePromotion,
    setPromotionActive,
    deletePromotion,
    setMessageRead,
    deleteMessage,
    removeSubscriber,
  };
};

export type StoreHook = ReturnType<typeof useStore>;
