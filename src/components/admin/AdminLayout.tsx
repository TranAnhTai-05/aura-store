import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useRouter, Link } from '../../router/RouterContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  Inbox,
  Settings,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { adminUser, logoutAdmin, orders, messages } = useAppStore();
  const { path, navigate } = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const unreadMessages = messages.filter((m) => !m.isRead).length;

  useEffect(() => setIsSidebarOpen(false), [path]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin', { replace: true });
  };

  const navItems = [
    { label: 'Tổng quan', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Sản phẩm', to: '/admin/products', icon: Package },
    { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart, badge: pendingOrders },
    { label: 'Khách hàng', to: '/admin/users', icon: Users },
    { label: 'Khuyến mãi', to: '/admin/promotions', icon: Tag },
    { label: 'Hộp thư', to: '/admin/messages', icon: Inbox, badge: unreadMessages },
    { label: 'Cài đặt', to: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="admin-area min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row antialiased">
      <div
        className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-zinc-900 border-b border-zinc-800"
        data-print-hidden
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <span className="font-bold tracking-tight text-white font-display">AURA ADMIN</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Mở menu quản trị"
          className="p-2.5 -mr-2 text-zinc-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden aura-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        data-print-hidden
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between overflow-y-auto transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="p-6 border-b border-zinc-800 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-display">AURA</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">{adminUser?.email}</p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Đóng menu"
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1" aria-label="Điều hướng quản trị">
            {navItems.map((item) => {
              const isActive = path === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {!!item.badge && (
                    <span className="min-w-5 px-1.5 py-0.5 text-[11px] font-bold bg-amber-500 text-zinc-950 rounded-full text-center tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <span>Xem cửa hàng</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4"
          data-print-hidden
        >
          <h1 className="text-base sm:text-lg font-bold text-white font-display truncate">{title}</h1>

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              {adminUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-xs">
              <p className="font-semibold text-white leading-tight">{adminUser?.name}</p>
              <p className="text-[11px] text-zinc-500">Quản trị viên</p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
