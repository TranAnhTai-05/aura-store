import React, { useEffect } from 'react';
import { Link, useRouter } from '../../router/RouterContext';
import { SHOP } from '../../config/shop';
import { formatVND } from '../../utils/format';

interface PolicySection {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

const SECTIONS: PolicySection[] = [
  {
    id: 'shipping',
    title: 'Giao hàng & thanh toán',
    paragraphs: [
      `AURA giao hàng toàn quốc. Đơn hàng từ ${formatVND(SHOP.freeShippingThreshold)} được miễn phí vận chuyển; các đơn còn lại có phí vận chuyển đồng giá ${formatVND(SHOP.shippingFee)}.`,
    ],
    points: [
      'Thanh toán khi nhận hàng (COD): bạn được kiểm tra hàng trước khi thanh toán cho nhân viên giao hàng.',
      'Chuyển khoản ngân hàng: đơn hàng được xử lý sau khi AURA xác nhận đã nhận thanh toán. Thông tin chuyển khoản hiển thị ngay sau khi đặt hàng và trong trang chi tiết đơn hàng.',
      'Bạn có thể tự hủy đơn trong mục Đơn hàng của tôi khi đơn chưa chuyển sang bước chuẩn bị hàng.',
    ],
  },
  {
    id: 'warranty',
    title: 'Chính sách bảo hành',
    paragraphs: [
      'Sản phẩm AURA được bảo hành 24 tháng kể từ ngày nhận hàng đối với lỗi phần cứng do nhà sản xuất.',
    ],
    points: [
      'Áp dụng 1 đổi 1 khi lỗi phần cứng được trung tâm bảo hành xác nhận.',
      'Không áp dụng cho hư hỏng do rơi vỡ, vào nước ngoài mức công bố, hoặc tự ý tháo sửa.',
      'Khi cần bảo hành, vui lòng cung cấp mã đơn hàng để được hỗ trợ nhanh nhất.',
    ],
  },
  {
    id: 'returns',
    title: 'Chính sách đổi trả',
    paragraphs: [
      'Bạn có thể đổi hoặc trả sản phẩm trong vòng 30 ngày kể từ ngày nhận hàng.',
    ],
    points: [
      'Sản phẩm còn đầy đủ hộp, phụ kiện và không có dấu hiệu hư hỏng do sử dụng.',
      'Tiền hoàn được chuyển theo phương thức bạn đã thanh toán sau khi AURA nhận và kiểm tra sản phẩm.',
      `Liên hệ hotline ${SHOP.hotline} hoặc gửi yêu cầu tại trang Liên hệ để bắt đầu đổi trả.`,
    ],
  },
  {
    id: 'terms',
    title: 'Điều khoản dịch vụ',
    paragraphs: [
      'Khi đặt hàng tại AURA, bạn xác nhận thông tin nhận hàng là chính xác và đồng ý với các chính sách trên trang này.',
    ],
    points: [
      'Giá và tình trạng còn hàng được xác nhận tại thời điểm đặt hàng thành công.',
      'Mỗi đơn hàng áp dụng được một mã giảm giá, theo điều kiện của từng mã.',
      'AURA có thể liên hệ để xác minh đơn hàng trước khi giao.',
    ],
  },
  {
    id: 'privacy',
    title: 'Chính sách bảo mật',
    paragraphs: [
      'AURA chỉ thu thập những thông tin cần thiết để xử lý đơn hàng và hỗ trợ bạn: họ tên, số điện thoại, email và địa chỉ giao hàng.',
    ],
    points: [
      'Thông tin của bạn không được bán hoặc chia sẻ cho bên thứ ba vì mục đích quảng cáo.',
      'Bạn có thể cập nhật thông tin cá nhân và đổi mật khẩu trong trang Tài khoản.',
      'Bạn có thể yêu cầu ngừng nhận bản tin bất cứ lúc nào qua email hỗ trợ.',
    ],
  },
];

export const PoliciesPage: React.FC = () => {
  const { hash } = useRouter();

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-[#fafaf9] py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Hỗ trợ khách hàng
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 font-display">
            Chính Sách Mua Hàng
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Thông tin về giao hàng, bảo hành, đổi trả và cách AURA bảo vệ dữ liệu của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <nav
            className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0"
            aria-label="Mục lục chính sách"
          >
            {SECTIONS.map((section) => (
              <Link
                key={section.id}
                to={`/policies#${section.id}`}
                className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  hash === `#${section.id}`
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {section.title}
              </Link>
            ))}
          </nav>

          <div className="lg:col-span-3 space-y-6">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs scroll-mt-24"
              >
                <h2 className="text-lg font-bold text-zinc-900 font-display mb-3">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm text-zinc-600 leading-relaxed mb-3">
                    {paragraph}
                  </p>
                ))}
                {section.points && (
                  <ul className="space-y-2 text-sm text-zinc-600 leading-relaxed list-disc pl-5 marker:text-zinc-300">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <p className="text-sm text-zinc-500">
              Cần giải đáp thêm?{' '}
              <Link to="/contact" className="font-semibold text-zinc-900 hover:underline">
                Liên hệ với AURA
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
