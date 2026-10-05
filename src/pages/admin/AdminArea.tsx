import React, { useEffect } from 'react';
import { Redirect, useRouter } from '../../router/RouterContext';
import { useAppStore } from '../../context/StoreContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { NotFoundPage } from '../user/NotFoundPage';
import { LoadErrorState, LoadingState } from '../../components/common/LoadState';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminProductsPage } from './AdminProductsPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminPromotionsPage } from './AdminPromotionsPage';
import { AdminMessagesPage } from './AdminMessagesPage';
import { AdminSettingsPage } from './AdminSettingsPage';

const ADMIN_PAGES: Record<string, React.FC> = {
  '/admin/dashboard': AdminDashboardPage,
  '/admin/products': AdminProductsPage,
  '/admin/orders': AdminOrdersPage,
  '/admin/users': AdminUsersPage,
  '/admin/promotions': AdminPromotionsPage,
  '/admin/messages': AdminMessagesPage,
  '/admin/settings': AdminSettingsPage,
};

/**
 * Everything under /admin. Loaded on demand, so none of this code is shipped to
 * customers browsing the storefront.
 */
const AdminArea: React.FC = () => {
  const { path } = useRouter();
  const { adminUser, isSessionKnown, adminStatus, retryAdmin } = useAppStore();

  useEffect(() => {
    document.title = 'AURA Admin';
  }, []);

  const route = path.replace(/\/$/, '');
  const isGate = route === '/admin';

  const screen = (content: React.ReactNode) => (
    <div className="admin-area min-h-screen bg-zinc-950 flex items-center justify-center">{content}</div>
  );

  if (!isSessionKnown) return screen(<LoadingState tone="dark" />);

  // Only an administrator session opens anything behind the gate; a signed-in
  // customer is treated exactly like an anonymous visitor here.
  if (!adminUser) return isGate ? <AdminLoginPage /> : <Redirect to="/admin" />;
  if (isGate) return <Redirect to="/admin/dashboard" />;

  if (adminStatus === 'error') return screen(<LoadErrorState tone="dark" onRetry={retryAdmin} />);
  if (adminStatus === 'loading') return screen(<LoadingState tone="dark" />);

  const Page = ADMIN_PAGES[route];
  if (Page) return <Page />;

  return (
    <AdminLayout title="Không tìm thấy trang">
      <NotFoundPage homePath="/admin/dashboard" homeLabel="Về bảng điều khiển" tone="dark" />
    </AdminLayout>
  );
};

export default AdminArea;
