import React, { useState } from 'react';
import { Link } from '../../router/RouterContext';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { usePending } from '../../hooks/usePending';
import { SHOP } from '../../config/shop';
import { formatVND } from '../../utils/format';
import { ShieldCheck, Truck, RotateCcw, Headphones, ArrowRight, Check } from 'lucide-react';

const SERVICE_LINKS = [
  { label: 'Tra cứu đơn hàng', to: '/orders' },
  { label: 'Chính sách bảo hành', to: '/policies#warranty' },
  { label: 'Chính sách đổi trả', to: '/policies#returns' },
  { label: 'Giao hàng & thanh toán', to: '/policies#shipping' },
  { label: 'Hệ thống showroom', to: '/contact' },
];

export const Footer: React.FC = () => {
  const { categories, subscribeNewsletter } = useAppStore();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [pending, run] = usePending();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run(() => subscribeNewsletter(email));
    if (!result) return;
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    setSubscribed(true);
    setEmail('');
    showToast('Đã đăng ký nhận bản tin AURA.');
  };

  const badges = [
    { icon: Truck, title: 'Giao hàng toàn quốc', text: `Miễn phí cho đơn từ ${formatVND(SHOP.freeShippingThreshold)}` },
    { icon: ShieldCheck, title: 'Bảo hành chính hãng', text: '24 tháng, 1 đổi 1' },
    { icon: RotateCcw, title: 'Đổi trả linh hoạt', text: 'Trong vòng 30 ngày' },
    { icon: Headphones, title: 'Hỗ trợ khách hàng', text: `Hotline ${SHOP.hotline}` },
  ];

  return (
    <footer className="bg-zinc-950 text-zinc-400 text-sm border-t border-zinc-800" data-print-hidden>
      <div className="border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {badges.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{title}</p>
                  <p className="text-xs text-zinc-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="sm:col-span-2 space-y-4">
            <span className="text-2xl font-black tracking-tight text-white font-display">AURA</span>
            <p className="text-sm leading-relaxed text-zinc-400 max-w-sm">
              Thiết bị công nghệ và phong cách sống với thiết kế tối giản, vật liệu bền bỉ và dịch vụ
              hậu mãi tận tâm.
            </p>
            <div className="pt-2 text-sm space-y-1.5 text-zinc-400">
              <p><strong className="text-zinc-300">Trụ sở:</strong> {SHOP.address}</p>
              <p>
                <strong className="text-zinc-300">Hotline:</strong>{' '}
                <a href={`tel:${SHOP.hotline.replace(/\s/g, '')}`} className="hover:text-white">
                  {SHOP.hotline}
                </a>{' '}
                (8h00 – 21h30)
              </p>
              <p>
                <strong className="text-zinc-300">Email:</strong>{' '}
                <a href={`mailto:${SHOP.supportEmail}`} className="hover:text-white">
                  {SHOP.supportEmail}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Danh mục</h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${encodeURIComponent(category.name)}`}
                    className="hover:text-white transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2.5 text-sm">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Đăng ký nhận tin</h4>
            <p className="text-sm text-zinc-400 mb-3">
              Nhận thông tin sản phẩm mới và chương trình ưu đãi qua email.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-emerald-800/50 rounded-xl text-emerald-400 text-sm">
                <Check className="w-4 h-4 shrink-0" />
                <span>Đã đăng ký thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2" noValidate>
                <label htmlFor="newsletter-email" className="sr-only">
                  Email nhận bản tin
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-600"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2.5 px-4 bg-white text-zinc-950 font-semibold text-xs rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{pending ? 'Đang gửi...' : 'Đăng ký'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} AURA Living & Technology Co., Ltd.</p>
          <div className="flex items-center gap-5">
            <Link to="/policies#terms" className="hover:text-zinc-300 transition-colors">
              Điều khoản dịch vụ
            </Link>
            <Link to="/policies#privacy" className="hover:text-zinc-300 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link to="/image-credits" className="hover:text-zinc-300 transition-colors">
              Nguồn hình ảnh
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
