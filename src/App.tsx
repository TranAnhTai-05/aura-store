import React, { Suspense, lazy, useEffect } from 'react';
import { RouterProvider, Redirect, useRouter } from './router/RouterContext';
import { StoreProvider, useAppStore } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadErrorState, LoadingState } from './components/common/LoadState';

// User components & pages
import { Header } from './components/user/Header';
import { Footer } from './components/user/Footer';
import { HomePage } from './pages/user/HomePage';
import { ProductsPage } from './pages/user/ProductsPage';
import { ProductDetailPage } from './pages/user/ProductDetailPage';
import { CartPage } from './pages/user/CartPage';
import { CheckoutPage } from './pages/user/CheckoutPage';
import { LoginPage } from './pages/user/LoginPage';
import { RegisterPage } from './pages/user/RegisterPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { OrdersPage } from './pages/user/OrdersPage';
import { OrderDetailPage } from './pages/user/OrderDetailPage';
import { PromotionsPage } from './pages/user/PromotionsPage';
import { AboutPage } from './pages/user/AboutPage';
import { ContactPage } from './pages/user/ContactPage';
import { PoliciesPage } from './pages/user/PoliciesPage';
import { ImageCreditsPage } from './pages/user/ImageCreditsPage';
import { NotFoundPage } from './pages/user/NotFoundPage';

// The admin area is a separate bundle, fetched only when /admin is opened
const AdminArea = lazy(() => import('./pages/admin/AdminArea'));

const SITE_TITLE = 'AURA | Thương Hiệu Thiết Bị & Phong Cách Sống Đẳng Cấp';

const PAGE_TITLES: Record<string, string> = {
  '/products': 'Sản phẩm',
  '/cart': 'Giỏ hàng',
  '/checkout': 'Thanh toán',
  '/login': 'Đăng nhập',
  '/register': 'Tạo tài khoản',
  '/profile': 'Tài khoản của tôi',
  '/orders': 'Đơn hàng của tôi',
  '/promotions': 'Khuyến mãi',
  '/about': 'Giới thiệu',
  '/contact': 'Liên hệ',
  '/policies': 'Chính sách',
  '/image-credits': 'Nguồn hình ảnh',
};

/** Pages that belong to a signed-in customer */
const RequireCustomer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppStore();
  const { path, search } = useRouter();
  if (!currentUser) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(path + search)}`} />;
  }
  return <>{children}</>;
};

const Storefront: React.FC = () => {
  const { path, matchRoute } = useRouter();
  const { catalogStatus, isSessionKnown, retryCatalog } = useAppStore();
  const route = path.length > 1 ? path.replace(/\/$/, '') : path;

  useEffect(() => {
    const title = PAGE_TITLES[route];
    document.title = title ? `${title} | AURA` : SITE_TITLE;
  }, [route]);

  const renderPage = () => {
    // Nothing is decided before the shop knows its products and who is signed in:
    // a protected page must not send a signed-in customer to the login page.
    if (catalogStatus === 'error') return <LoadErrorState onRetry={retryCatalog} />;
    if (catalogStatus === 'loading' || !isSessionKnown) return <LoadingState />;

    if (route === '/') return <HomePage />;
    if (route === '/products') return <ProductsPage />;

    const productMatch = matchRoute('/products/:id');
    // Keyed so that variant, quantity and tab selections never carry over between products
    if (productMatch.match) {
      return <ProductDetailPage key={productMatch.params.id} productId={productMatch.params.id} />;
    }

    if (route === '/cart') return <CartPage />;
    if (route === '/checkout') return <CheckoutPage />;
    if (route === '/login') return <LoginPage />;
    if (route === '/register') return <RegisterPage />;

    if (route === '/profile') {
      return (
        <RequireCustomer>
          <ProfilePage />
        </RequireCustomer>
      );
    }
    if (route === '/orders') {
      return (
        <RequireCustomer>
          <OrdersPage />
        </RequireCustomer>
      );
    }
    const orderMatch = matchRoute('/orders/:orderNumber');
    if (orderMatch.match) {
      return (
        <RequireCustomer>
          <OrderDetailPage
            key={orderMatch.params.orderNumber}
            orderNumber={orderMatch.params.orderNumber}
          />
        </RequireCustomer>
      );
    }

    if (route === '/promotions') return <PromotionsPage />;
    if (route === '/about') return <AboutPage />;
    if (route === '/contact') return <ContactPage />;
    if (route === '/policies') return <PoliciesPage />;
    if (route === '/image-credits') return <ImageCreditsPage />;

    return <NotFoundPage />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { path } = useRouter();
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');
  if (!isAdminRoute) return <Storefront />;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <LoadingState tone="dark" label="Đang tải trang quản trị..." />
        </div>
      }
    >
      <AdminArea />
    </Suspense>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <StoreProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </StoreProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
