import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '../../router/RouterContext';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { SearchModal } from './SearchModal';
import { CartDrawer } from './CartDrawer';
import { SHOP } from '../../config/shop';
import { formatVND } from '../../utils/format';
import { describePromotion, isPromotionAvailable } from '../../services/pricing';
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  Menu,
  X,
  Package,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Khuyến mãi', to: '/promotions' },
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Liên hệ', to: '/contact' },
];

export const Header: React.FC = () => {
  const { cartTotalItems, currentUser, logoutCustomer, promotions } = useAppStore();
  const { path, search, navigate } = useRouter();
  const { showToast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const featuredPromo = promotions.find((p) => isPromotionAvailable(p));

  // Overlays never outlive the page they were opened on
  useEffect(() => {
    setIsSearchOpen(false);
    setIsCartOpen(false);
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [path, search]);

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAccountMenuOpen, isMobileMenuOpen]);

  // "/" opens the search from anywhere outside a form field
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if (e.key === '/' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logoutCustomer();
    showToast('Bạn đã đăng xuất.');
    navigate('/');
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-zinc-900 text-zinc-300 text-xs py-2 px-4 text-center tracking-wide font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <span>
          Miễn phí giao hàng toàn quốc cho đơn từ {formatVND(SHOP.freeShippingThreshold)}
        </span>
        {featuredPromo && (
          <>
            <span aria-hidden="true" className="text-zinc-500 hidden sm:inline">·</span>
            <Link to="/promotions" className="text-white underline underline-offset-2 hover:text-zinc-200">
              Mã {featuredPromo.code}: {describePromotion(featuredPromo)}
            </Link>
          </>
        )}
      </div>

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 -ml-2 text-zinc-600 hover:text-zinc-900 rounded-xl"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="text-2xl font-black tracking-tight text-zinc-900 font-display">
              AURA
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-600" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === '/' ? path === '/' : path.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`hover:text-zinc-950 transition-colors py-1 border-b-2 ${
                    isActive ? 'text-zinc-950 font-semibold border-zinc-900' : 'border-transparent'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-xs text-zinc-400">Tìm kiếm...</span>
              <kbd className="hidden md:inline text-[10px] font-sans text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">
                /
              </kbd>
            </button>

            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  className="flex items-center gap-1.5 p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors text-xs font-semibold"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                </button>
              ) : (
                <Link
                  to="/login"
                  aria-label="Đăng nhập"
                  className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Đăng nhập</span>
                </Link>
              )}

              {isAccountMenuOpen && currentUser && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsAccountMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-40 aura-rise-in"
                  >
                    <div className="px-4 py-2 border-b border-zinc-100">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      <span>Thông tin tài khoản</span>
                    </Link>

                    <Link
                      to="/orders"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-zinc-400" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
              aria-label={`Xem giỏ hàng, ${cartTotalItems} sản phẩm`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold tabular-nums">{cartTotalItems}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs aura-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto aura-slide-in-left">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <span className="text-xl font-black tracking-tight font-display">AURA</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                  className="p-2 text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-1" aria-label="Điều hướng chính">
                {NAV_LINKS.map((link) => {
                  const isActive = link.to === '/' ? path === '/' : path.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`py-3 px-3 text-sm font-medium rounded-xl transition-colors ${
                        isActive ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100">
              {currentUser ? (
                <div className="space-y-1">
                  <div className="px-3 py-1 mb-2">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block py-2.5 px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg"
                  >
                    Thông tin tài khoản
                  </Link>
                  <Link
                    to="/orders"
                    className="block py-2.5 px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg"
                  >
                    Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2.5 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-3 px-4 bg-zinc-900 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Đăng nhập / Đăng ký</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
